const trHelper = require("./testrail_helper");
const _ = require("lodash");
const Testrail = require("testrail-api");

// Configure testrail authentication
const testrail = new Testrail({
    host: process.env.trApiUrl,
    user: process.env.trApiUser,
    password: process.env.trApiKey,
});

module.exports = {
    // Construct the testresult to match the standard pattern we have.
    // this will return array of results (that contains test result for all scenarios with all its steps).
    constructResultsSummary: async function (cbJson, caseDicts, testTarget, jenkinsPath) {

        var targetStatus = 0;
        switch (testTarget.toLowerCase()) {
            case "qa":
                targetStatus = 1;
                break;
            case "support":
                targetStatus = 10;
                break;
            case "staging":
            case "stg":
                targetStatus = 11;
                break;
            case "production":
            case "prod":
                targetStatus = 12;
                break;
            default:
                targetStatus = 1;
                break;
        }

        var result = {}; //to hold individual scenario's result (to be pushed to results array below)
        var results = []; //to hold all actual result (from all scenarios and all of its steps)
        var status = targetStatus; //to hold the test result status for each step (eq. 5 = failed)
        var resultComment = ""; //to hold data like "Error reference" or "" (when test is passed)
        var resultElapsed = 0; //to hold duration of the test
        cbJson.forEach((feature) => {
            feature.elements.forEach((scenario) => {
                scenario.steps
                    .filter((s) => _.includes(["given", "when", "then", "but", "and"], s.keyword.trim().toLowerCase()))
                    .forEach((step) => {
                        // for failed step, construct the failing message. (based on TestRail formatting) and define it as failed (5)
                        if (step.result.status != "passed" && step.result.status != "skipped") {
                            resultComment += "- **" + step.result.status.toUpperCase() + "** :: " + step.keyword + " " + step.name + "\r\n";
                            status = 5;
                        }

                        // if the step contains property "error_message" , retrieve the first sentence of it and print out the path to jenkins for more details
                        if (_.has(step.result, "error_message")) {
                            resultComment += "\r\n**Error Reference :**";
                            resultComment += "\r\n" + step.result.error_message.substring(0, step.result.error_message.indexOf("\n")) + "\r\n\r\n";
                            resultComment += jenkinsPath ? "||:For more details, please go [Jenkins Link](" + jenkinsPath + trHelper.getConstructCucumberReportPath(feature) + ").\r\n" : "||:Details error are not available as the test are triggered locally!\r\n";
                        }
                        resultElapsed = resultElapsed + step.result.duration || resultElapsed;
                    });

                var scenarioid = trHelper.extractId_fromTestCase(scenario.name);

                // When the current scenario is not a background, only we will push to "results" as the final data
                // When the current scenario is a background, the previous steps result will be temporarily hold until it find a non-background scenario.
                if (scenario.type != "background") {
                    //only scenario that is part of caseDicts, will be pushed to TestRail.
                    if (_.includes(caseDicts, scenarioid)) {
                        //result.case_id = _.find( caseDicts , d => {return d.cname == this.getGeneratedCaseName(scenario)}).cid;
                        result.case_id = scenarioid;
                        result.comment = resultComment;
                        result.status_id = status;
                        result.elapsed = Math.round(resultElapsed / 1e9) > 0 ? Math.round(resultElapsed / 1e9) + "s" : null; //null for undefined steps
                        results.push(result);
                    } else {
                        //console.log ( scenario.name + " is not!, skip!");
                    }

                    //once this particular scenario is pushed, we need to clean up the temporary holder for next-iteration data
                    result = {};
                    resultComment = "";
                    resultElapsed = 0;
                    status = targetStatus;
                }
            });
        });
        return results;
    },
};
