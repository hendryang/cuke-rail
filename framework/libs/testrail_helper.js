const Testrail = require("testrail-api");

// Configure testrail authentication
const testrail = new Testrail({
    host: process.env.trApiUrl,
    user: process.env.trApiUser,
    password: process.env.trApiKey,
});

module.exports = {
    // Get Project name from its ID
    getProjectName_byId: async function (projectId) {
        try {
            const myProject = await testrail
                .getProject(projectId)
                .then((response) => {
                    return response.body;
                })
                .catch((err) => {
                    console.error("testrail:", err);
                });
            return myProject.name;
        } catch (e) {}
    },

    //return ID from test case (8-10 digit testrail ID)
    //eq. [12345567] Test case , will return 12345567
    //eq. [C12345678] Test case , will return 12345678
    extractId_fromTestCase: function (scenarioName) {
        var regex = /\[C?\d{8,10}\]/g;
        var foundID = scenarioName.match(regex);
        var retrievedID = "";
        if (foundID != null) {
            if (foundID.length == 1) {
                retrievedID = foundID[0].replace("[", "").replace("]", "").replace("C", "");
            } else if (foundID.length > 1) {
                //when multiple ID is found, only first one will be taken
                retrievedID = foundID[0].replace("[", "").replace("]", "").replace("C", "");
            }
        } else {
            console.log(' > Test case "' + scenarioName + '" has no valid ID. No operation to testrail will be done. ');
        }
        return Number(retrievedID);
    },

    // Get current sprint number, used to handle milestone/runs naming.

    getCurrentSprintID: function () {
        //project-specific implementation
        return 1;
    },

    // Get the path to cucumber report path (this is mainly use "for more details..." when printing error message to testresult)
    getConstructCucumberReportPath: function (feature) {
        //below path only works on older cucumber (4.1.0)
        //const CUKE_APPEND = 'cucumber-html-reports/report-feature_';
        //var cukePath = CUKE_APPEND + feature.uri.replace(/\//g,'-').replace(/\./g,'-').replace(/\s/g, '-') + ".html";

        var cukePath = "cucumber-html-reports/overview-failures.html";
        return cukePath;
    },

    // Get the path to cucumber report path (this is mainly use "for more details..." when printing error message to testresult)
    getConstructAllureReportPath: function (feature) {
        //below path only works on older cucumber (4.1.0)
        //const CUKE_APPEND = 'cucumber-html-reports/report-feature_';
        //var cukePath = CUKE_APPEND + feature.uri.replace(/\//g,'-').replace(/\./g,'-').replace(/\s/g, '-') + ".html";

        var cukePath = "cucumber-html-reports/overview-failures.html";
        return cukePath;
    },

    getCurrentWeekNumber: function (d) {
        // Copy date so don't modify original
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        // Set to nearest Thursday: current date + 4 - current day number
        // Make Sunday's day number 7
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        // Get first day of year
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        // Calculate full weeks to nearest Thursday
        var weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
        // Return array of year and week number
        return weekNo;
    },
};
