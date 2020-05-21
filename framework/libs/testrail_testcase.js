const trHelper = require("./testrail_helper");
const Testrail = require("testrail-api");
const _ = require("lodash");
// Configure testrail authentication
const testrail = new Testrail({
    host: process.env.trApiUrl,
    user: process.env.trApiUser,
    password: process.env.trApiKey,
});

module.exports = {
    //Update test case (note that, we no longer add in the test cases, it should be done manually)
    updateCase_byScenario: async function (caseId, feature, scenario) {
        let myTestCase = {
            title: this.getGeneratedCaseName(scenario),
            custom_summary: this.constructSummary(feature, scenario),
            custom_preconds: this.constructBackground(feature),
            custom_bdd_scenario: this.constructScenario(feature, scenario),
        };
        myCase = await testrail.updateCase(/*CASE_ID=*/ caseId, /*CONTENT=*/ myTestCase).then((response) => {
            return response.body;
        });
        return myCase;
    },

    // get the test case name to be updated to testrail.
    // in test rail, ID has its own special place hence we'll replace all the ID in the feature name to empty.
    getGeneratedCaseName: function (scenario) {
        let sn = scenario.name;
        let id_withoutC = "[" + trHelper.extractId_fromTestCase(sn) + "]";
        let id_withC = "[C" + trHelper.extractId_fromTestCase(sn) + "]";
        let caseName = sn.replace(id_withoutC, "").replace(id_withC, "");
        return caseName.trim();
    },

    // Generate "summary" section of the test cases.
    // this also contains some logic to automatically remove scenario outline from result calculation. (todo)
    constructSummary: function (feature, scenario) {
        //var caseSummary = "**" + feature.keyword + " :** " + feature.uri.substring(feature.uri.lastIndexOf('/')+1, feature.uri.length) + ' || ' + feature.name + '\r\n';
        //caseSummary    += "**" + scenario.keyword + " :** " + scenario.name + '\r\n\r\n';

        var caseSummary = "";
        //scenario outline has id that last digit after ';;' indicates the examples row.
        //to exclude multiple scenario outline counted as test cases (we only want 1), any row that is not 2 , will have keyword 'exclude from status' appended
        if (scenario.keyword.toLowerCase() == "scenario outline") {
            var rowfromid = scenario.id.match(/;;\d*/);
            var examplesrow = 0;
            if (rowfromid != null) {
                examplesrow = rowfromid[0].replace(";;", "");
                if (examplesrow != "2") {
                    examplesrow += " - Exclude from status";
                }
            } else {
                console.log(" [Inner error] Scenario outline has no examples id. Some error in json file");
            }
            caseSummary += "scenario outline - [data examples on row " + examplesrow + "]\r\n\r\n";
        }
        caseSummary += feature.description;
        return caseSummary;
    },

    // Generate "preconditions" section of the test cases
    constructBackground: function (feature) {
        var bgScenario = feature.elements.filter((s) => s.type === "background")[0];
        var bgSummary = "";
        if (bgScenario !== undefined) {
            bgSummary += this.constructGenericStep(bgScenario);
        }
        return bgSummary;
    },

    // Generate "bdd scenario" section of the test cases
    constructScenario: function (feature, scenario) {
        //var caseSummary = '**' + scenario.keyword + ': ' + scenario.name + '**';
        //caseSummary += '\r\n\r\n';
        //var caseSummary = this.constructBackground (feature);
        var caseSummary = this.constructGenericStep(scenario);
        return caseSummary;
    },

    // helper method to generate the actual GWT (given,when,then) in the scenario
    // used by constructBackground and constructScenario method
    constructGenericStep: function (scenario) {
        var genericSteps = "";
        scenario.steps
            .filter((s) => _.includes(["given", "when", "then", "but", "and"], s.keyword.trim().toLowerCase()))
            .forEach((step) => {
                genericSteps += step.keyword + " " + step.name + "\r\n";
                //todo - enabled below code, once testrail able to handle large data.
                // if ( _.has ( step, "rows" )) {
                //   step.rows.forEach ( row => {
                //     genericSteps += '|';
                //     row.cells.forEach ( cell => {
                //       genericSteps += '|' + cell ;
                //     });
                //     genericSteps += '|\r\n';
                //   });
                // }
                if (_.has(step, "doc_string")) {
                    genericSteps += step.doc_string.value + "\r\n";
                }
            });
        return genericSteps;
    },
};
