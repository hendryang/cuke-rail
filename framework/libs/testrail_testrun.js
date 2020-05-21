const trHelper = require("./testrail_helper");
const Testrail = require("testrail-api");

// Configure testrail authentication
const testrail = new Testrail({
    host: process.env.trApiUrl,
    user: process.env.trApiUser,
    password: process.env.trApiKey,
});

module.exports = {
    // Generate test run name based on given sprintId ( 0-default = auto-generated ) and module/suite name.
    // dayOffset is to get testrun of previous day (since our testrun is generated on daily basis)
    // -n dayOffset will return testrun name of -n day (0 = today , -1 = yesterday :D)

    getGeneratedTestRunName: function (sprintId, suiteName, dayOffset) {
        //var currentDate = new Date( Date.now() + (dayOffset * 864e5)).toJSON().slice(0,10).replace(/-/g,'/');
        var currentDate = new Date(Date.now() + dayOffset * 864e5);
        var formattedDate = ("0" + (currentDate.getMonth() + 1)).slice(-2) + "/" + ("0" + currentDate.getDate()).slice(-2) + "/" + currentDate.getFullYear();

        if (sprintId == 0) {
            //auto-generated
            return "Week " + trHelper.getCurrentSprintID() + " - " + suiteName + " Project " + formattedDate;
        }
        return "Week " + sprintId + " - " + suiteName + " Project " + formattedDate;
    },

    // Add new test run in the given project and milestone.
    // This testrun will also contains all the test cases that exists in Feature file (given the ID also exist in TestRail)
    addTestRun_byName: async function (projectId, milestoneId, testRunName, caseDicts, jenkinsPath) {
        var myPreparedTestRun = {
            name: testRunName,
            milestone_id: milestoneId,
            include_all: false,
            case_ids: caseDicts,
            description: "",
        };
        var myAddedTestRun;

        //setting description in the testrun to point to jenkins location
        myPreparedTestRun.description = jenkinsPath ? "Latest test run is triggered from Jenkins job. Job details : " + jenkinsPath : "Latest test run is triggered locally (without Jenkins)";
        myAddedTestRun = await testrail.addRun(/*PROJECT_ID=*/ projectId, /*CONTENT=*/ myPreparedTestRun).then((response) => {
            return response.body;
        });
        return myAddedTestRun;
    },

    // If testrun already exist, it will attempt to update the testrun.
    // the update strategy is using "append or add" rather than "replace"
    // hence to retain existing data, all the ID (old and new) will be concat/append together.
    updateTestRun_byName: async function (testRunId, caseDicts, jenkinsPath) {
        // storing all new test case IDs
        var caseIds = [];
        caseDicts.forEach((caseDict) => {
            caseIds.push(caseDict);
        });

        // get all existing test case IDs from the test run
        var currentCaseIds = await testrail.getTests(testRunId).then((response) => {
            var data = [];
            response.body.forEach((test) => {
                data.push(test.case_id);
            });
            return data;
        });

        // combine both (old and new) together.
        var finalcaseids = currentCaseIds.concat(caseIds);
        var updatedTestRun = {
            case_ids: finalcaseids,
        };

        updatedTestRun.description = jenkinsPath ? "Latest test run is triggered from Jenkins job. Job details : " + jenkinsPath : "Latest test run is triggered locally (without Jenkins)";
        myTestRun = testrail.updateRun(/*RUN_ID=*/ testRunId, /*CONTENT=*/ updatedTestRun).then((response) => {
            return response.body;
        });
        return myTestRun;
    },

    // close the test run from specific project/milestone and name.
    closeTestRun_byName: async function (projectId, milestoneId, testRunName) {
        var targetTestRun = await testrail.getRuns(/*PROJECT_ID=*/ projectId, /*FILTERS=*/ { milestone_id: milestoneId }).then((response) => {
            var prevTestRun = response.body.filter((r) => r.name == testRunName && !r.is_completed);
            return prevTestRun[0];
        });

        if (targetTestRun) {
            testrail.closeRun(/*RUN_ID=*/ targetTestRun.id, function (err, response, run) {
                console.log('> Auto Close Test Run "' + run.name + '"');
            });
        } else {
            console.log('> [Skip-TestRun-Close] Unable to close Test run "' + testRunName + "\", Either it's already closed or non-exist!");
        }
    },
};
