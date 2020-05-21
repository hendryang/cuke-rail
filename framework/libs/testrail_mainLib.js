const fs = require("fs");
const Testrail = require("testrail-api");
//const _ = require("underscore");
const _ = require("lodash");
const jsonfile = require("jsonfile");
const trMilestone = require("./testrail_milestone");
const trHelper = require("./testrail_helper");
const trTestRun = require("./testrail_testrun");
const trTestResult = require("./testrail_testresult");
const trTestCase = require("./testrail_testcase");

// Configure testrail authentication
const testrail = new Testrail({
    host: process.env.trApiUrl,
    user: process.env.trApiUser,
    password: process.env.trApiKey,
});

module.exports = {
    // Pretest verification used to identify any potential bug before actual pushing to TestRail
    // it will check for following:
    // -- Scenario that has duplicated ID.
    // -- Scenario (in feature file) that doesn't have ID, but is part of test result
    // -- Scenario that has ID that doesn't exist in TestRail
    // -- TestRail test case that has ID that the scenario does not have (This is typically not an issue - happen when we don't run the whole set)
    getPretestVerification: async function (testrail_data, testrail_ids, cbJson) {
        var scenarioIDs = [];
        var featureWithoutIDs = [];
        var IdNotInTestrail = [];
        var IdNotInFeature = [];

        cbJson.forEach((feature) => {
            feature.elements
                .filter((s) => s.type != "background")
                .forEach((scenario) => {
                    var id = trHelper.extractId_fromTestCase(scenario.name);

                    scenarioIDs.push(id);

                    // store scenario name that doesn't have ID
                    if (id == 0) {
                        featureWithoutIDs.push(scenario.name);
                    }

                    // store ID that is in Feature file but not TestRail
                    if (!_.includes(testrail_ids, id)) {
                        IdNotInTestrail.push(id);
                    }
                });
        });

        // store ID that is in TestRail but not in Feature file
        testrail_ids.forEach((testrail) => {
            if (!_.includes(scenarioIDs, testrail)) {
                IdNotInFeature.push(testrail);
            }
        });
        console.log("***************************");
        console.log("*** Scenario without ID ***");
        console.log("***************************");
        if (featureWithoutIDs.length > 0) {
            featureWithoutIDs.forEach((f) => {
                console.log(f);
            });
        } else {
            console.log("> NO ISSUES DETECTED");
        }

        console.log("\n***************************************");
        console.log("*** Duplicated IDs found in feature ***");
        console.log("***************************************");
        var duplicatedIDs = _.transform(
            _.countBy(scenarioIDs),
            function (result, count, value) {
                if (count > 1) result.push(value);
            },
            []
        );

        if (duplicatedIDs.filter((id) => id != 0).length > 0) {
            duplicatedIDs
                .filter((id) => id != 0)
                .forEach((i) => {
                    console.log(i);
                });
        } else {
            console.log("> NO ISSUES DETECTED");
        }

        console.log("\n************************************************************");
        console.log("*** IDs exist in Feature, but does not exist in TestRail ***");
        console.log("************************************************************");
        if (IdNotInTestrail.filter((id) => id != 0).length > 0) {
            IdNotInTestrail.filter((id) => id != 0).forEach((f) => {
                console.log(f);
            });
        } else {
            console.log("> NO ISSUES DETECTED");
        }

        console.log("\n************************************************************");
        console.log("*** IDs exist in TestRail, but does not exist in Feature ***");
        console.log("************************************************************");
        var status = "";
        if (IdNotInFeature.filter((id) => id != 0).length > 0) {
            IdNotInFeature.filter((id) => id != 0).forEach((f) => {
                testrail_data
                    .filter((tr) => tr.id == f && tr.auto == 2)
                    .forEach((t) => {
                        switch (t.auto) {
                            case 1:
                                status = " - To be automated";
                                break;
                            case 2:
                                status = " - Automated";
                                break;
                            case 4:
                                status = " - Will Not Automate";
                                break;
                            default:
                                status = " - UNKNOWN";
                                break;
                        }
                        console.log(t.id + status);
                    });
            });
        } else {
            console.log("> NO ISSUES DETECTED");
        }
    },

    getPretestVerification_NW: async function (testrail_data, testrail_ids, cbJson) {
        var scenarioIDs = [];
        var featureWithoutIDs = [];
        var IdNotInTestrail = [];
        var IdNotInFeature = [];

        let moduleObj = cbJson.modules;
        let moduleList = Object.keys(moduleObj);

        for (let module of moduleList) {
            let id = trHelper.extractId_fromTestCase(module);
            scenarioIDs.push(id);
            // store scenario name that doesn't have ID
            if (id == 0) {
                featureWithoutIDs.push(module);
            }
            // store ID that is in Feature file but not TestRail
            if (!_.includes(testrail_ids, id)) {
                IdNotInTestrail.push(id);
            }
        }


        // store ID that is in TestRail but not in Feature file
        testrail_ids.forEach((testrail) => {
            if (!_.includes(scenarioIDs, testrail)) {
                IdNotInFeature.push(testrail);
            }
        });
        console.log("***************************");
        console.log("*** Scenario without ID ***");
        console.log("***************************");
        if (featureWithoutIDs.length > 0) {
            featureWithoutIDs.forEach((f) => {
                console.log(f);
            });
        } else {
            console.log("> NO ISSUES DETECTED");
        }

        console.log("\n***************************************");
        console.log("*** Duplicated IDs found in feature ***");
        console.log("***************************************");
        var duplicatedIDs = _.transform(
            _.countBy(scenarioIDs),
            function (result, count, value) {
                if (count > 1) result.push(value);
            },
            []
        );

        if (duplicatedIDs.filter((id) => id != 0).length > 0) {
            duplicatedIDs
                .filter((id) => id != 0)
                .forEach((i) => {
                    console.log(i);
                });
        } else {
            console.log("> NO ISSUES DETECTED");
        }

        console.log("\n************************************************************");
        console.log("*** IDs exist in Feature, but does not exist in TestRail ***");
        console.log("************************************************************");
        if (IdNotInTestrail.filter((id) => id != 0).length > 0) {
            IdNotInTestrail.filter((id) => id != 0).forEach((f) => {
                console.log(f);
            });
        } else {
            console.log("> NO ISSUES DETECTED");
        }

        console.log("\n************************************************************");
        console.log("*** IDs exist in TestRail, but does not exist in Feature ***");
        console.log("************************************************************");
        var status = "";
        if (IdNotInFeature.filter((id) => id != 0).length > 0) {
            IdNotInFeature.filter((id) => id != 0).forEach((f) => {
                testrail_data
                    .filter((tr) => tr.id == f && tr.auto == 2)
                    .forEach((t) => {
                        switch (t.auto) {
                            case 1:
                                status = " - To be automated";
                                break;
                            case 2:
                                status = " - Automated";
                                break;
                            case 4:
                                status = " - Will Not Automate";
                                break;
                            default:
                                status = " - UNKNOWN";
                                break;
                        }
                        console.log(t.id + status);
                    });
            });
        } else {
            console.log("> NO ISSUES DETECTED");
        }
    },

    // Update test case information (summary, bdd scenario, etc...) if exist. no adding will be done, and return the ID.
    getCaseId_byScenario: async function (testrail_ids, feature, scenario, forceUpdate) {
        if (scenario.type != "background") {
            var caseId = trHelper.extractId_fromTestCase(scenario.name);
            if (_.includes(testrail_ids, caseId)) {
                if (forceUpdate) {
                    myCase = await trTestCase.updateCase_byScenario(caseId, feature, scenario);
                    console.log(" > [Updated] Test Case ID " + myCase.id + " - " + myCase.title);
                } else {
                    console.log(" > Force Update is OFF. [" + scenario.name + "]");
                }
            } else {
                console.log(' > ID "' + caseId + '" does not exist in testrail. [' + scenario.name + "]");
            }
        }
    },

    // Get module/suite name from the feature file (eq. API/UI/ETL)
    // if provided "auto" or "" , it'll auto-detect by scanning the .json result under feature's uri property
    // sample URI (TF1.0) - /home/u3010/qe/java-tests/ui/src/test/resources/features/Sandbox/Sandbox.feature
    // sample URI (TF2.0) - file:src/test/resources/features/creditcompliance/clientOverExposure.feature
    getSuiteName_byFeature: async function (feature, type) {
        //Java test structure -> .../<your-project-name>/<your-module-name>/src/test/...
        const targetJava = "/src/test/";

        if (type.trim().toLowerCase() == "auto" || type.trim().toLowerCase() == "") {
            // string manipulation method to get the "ui" out of /home/bla/ui/src/test/bla/bla.feature
            if (feature.length > 0) {
                let featureURI = feature[0].uri; //get 1 feature (assume the job trigger the same module)
                if (featureURI.lastIndexOf(targetJava) > 0) {
                    let strProjModule = featureURI.substring(0, featureURI.lastIndexOf(targetJava));
                    strModule = strProjModule.substring(strProjModule.lastIndexOf("/") + 1);
                    console.log("Auto detect suite name : " + strModule.toUpperCase());
                    return strModule.toUpperCase();
                } else {
                    let err = `\n[Suite-Name-Error] Json file has invalid format : ${featureURI.substring(0, featureURI.lastIndexOf("/") + 1)} \n` + `  > Possible resolution: Ensure your project is following proper folder structure as per the convention\n`;
                    throw err;
                }
            } else {
                let err = "\n[Suite-Name-Error] No feature found from the supplied Json file!\n";
                throw err;
            }
        } else {
            console.log("Manual set suite name : " + type.trim());
            return type.trim();
        }
    },

    // Get valid Milestone (not is completed yet) from the given projectID and create one if it doesn't exist yet
    getMilestones_byProjectId: async function (projectId, sprintId, forceAdd = true) {
        var isValid = true;
        var milestoneName = trMilestone.getGeneratedMilestoneName(sprintId);
        var myMilestone = await testrail
            .getMilestones(projectId)
            .then((response) => {
                const milestones = response.body;
                const milestone = milestones.filter((m) => m.name == milestoneName && !m.is_completed);
                const milestoneCompleted = milestones.filter((m) => m.name == milestoneName && m.is_completed);
                isValid = milestoneCompleted[0] == undefined; //test invalid when target milestone is already completed
                return milestone[0];
            })
            .catch((err) => {
                console.error("Testrail Milestone Error :", err);
            });

        //when given milestone is not closed yet or does not exist (it can be created)
        if (isValid) {
            if (myMilestone == undefined && forceAdd == true) {
                console.log("> Create Milestone : " + milestoneName);
                myMilestone = await trMilestone.addMilestone_byName(projectId, milestoneName);
            } else if (myMilestone == undefined && forceAdd == false) {
                let err = `\n[Milestone-Handling-Error] Test Milestone "${milestoneName}" for Project ID "${projectId}" does not exist and NO request to add it.\n` + `  > Possible resolution: Please supply "--trForceAdd true" to add the missing milestone\n`;
                throw err;
            }
            console.log("Detected milestone : " + myMilestone.name);
            return myMilestone.id;
        } else {
            let err = `\n[Milestone-Handling-Error] Test Milestone "${milestoneName}" for Project ID "${projectId}" is already completed!\n`;
            throw err;
        }
    },

    // Populate list of test cases (from feature file) that exist in TestRail.
    // reason: we only want to include the result of test that is exist in TestRail (based on ID)
    getCaseDicts_byFeature: async function (testrail_ids, cbJson) {
        var caseDict = [];

        for (const feature of cbJson) {
            // loop through every feature in the JSON File
            for (const scenario of feature.elements.filter((s) => s.type != "background")) {
                // loop through every scenario in each feature (that is not a 'background' test)
                //console.log ( scenario.keyword + " - " + scenario.name );
                var caseId = trHelper.extractId_fromTestCase(scenario.name);

                // if the given test case ID (from feature file) exist in the list of ID from TestRail, add it to the list.
                // reason: we only want to include the result of test that is exist in TestRail (based on ID)
                if (_.includes(testrail_ids, caseId)) {
                    await testrail.getCase(caseId).then((response) => {
                        //caseDict.push ( {"cid": response.body.id , "cname" : response.body.title}); //refactor to use array instead.
                        caseDict.push(response.body.id);
                    });
                } else {
                    console.log(' > ID "' + caseId + '" does not exist in testrail');
                }
            }
        }
        return caseDict;
    },

    // Populate list of test cases (from feature file) that exist in TestRail.
    // reason: we only want to include the result of test that is exist in TestRail (based on ID)
    getCaseDicts_byFeature_NW: async function (testrail_ids, cbJson) {
        var caseDict = [];

        let moduleObj = cbJson.modules;
        let moduleList = Object.keys(moduleObj);

        for (let module of moduleList) {
            let caseId = trHelper.extractId_fromTestCase(module);
            if (_.includes(testrail_ids, caseId)) {
                await testrail.getCase(caseId).then((response) => {
                    caseDict.push(response.body.id);
                });
            } else {
                console.log(' > ID "' + caseId + '" does not exist in testrail');
            }
        }

        return caseDict;
    },

    // Milestone -< TestRuns [typically grouped by daily basis, so 1 milestone (2-week sprint) has around 14 test runs]
    // If not exist, It will attempt to add new test run with all test cases (from feature file) that its ID exist in TestRail
    // If exist, it will attempt to update the test run by concatenating both old and new test cases.
    getTestRuns_byMilestoneId: async function (projectId, milestoneId, sprintId, suiteName, caseDicts, jenkinsPath, forceAdd = true, forceUpdate = true) {
        var isValid = true;
        var testRunName = trTestRun.getGeneratedTestRunName(sprintId, suiteName, 0);
        var previous1TestRunName = trTestRun.getGeneratedTestRunName(sprintId, suiteName, -1);
        var previous2TestRunName = trTestRun.getGeneratedTestRunName(sprintId, suiteName, -2);
        var previous3TestRunName = trTestRun.getGeneratedTestRunName(sprintId, suiteName, -3);

        //get testruns from given projectId that is : match with expected test run name , match with given milestone and is not closed/completed.
        var myTestRun = await testrail
            .getRuns(projectId)
            .then((response) => {
                const testRuns = response.body;
                const testRun = testRuns.filter((r) => r.name == testRunName && r.milestone_id == milestoneId && !r.is_completed);
                const testRunCompleted = testRuns.filter((r) => r.name == testRunName && r.milestone_id == milestoneId && r.is_completed);
                isValid = testRunCompleted[0] == undefined; //test invalid when target testrun is already completed/closed
                return testRun[0];
            })
            .catch((err) => {
                console.error("Testrail TestRun Error :", err);
            });

        if (isValid) {
            if (myTestRun && forceUpdate == true) {
                //if test run already exist, we update the test result of that testrun (add not replace)
                console.log("> Update Test Run : " + testRunName);
                myTestRun = await trTestRun.updateTestRun_byName(myTestRun.id, caseDicts, jenkinsPath);
            }
            if (myTestRun == undefined && forceAdd == true) {
                // create new testrun with all test cases (under caseDicts). but no result is pushed yet at this point.
                console.log("> Create Test Run : " + testRunName);
                myTestRun = await trTestRun.addTestRun_byName(projectId, milestoneId, testRunName, caseDicts, jenkinsPath);
            } else if (myTestRun == undefined && forceAdd == false) {
                let err = `\n[TestRun-Handling-Error] Test run "${testRunName}" does not exist and NO request to add it.\n` + `  > Possible resolution: Please supply "--trForceAdd true" to add the missing test run\n`;
                throw err;
            }
            //lazy-way to close previous 3 testruns (previous 3 days). fix this!
            trTestRun.closeTestRun_byName(projectId, milestoneId, previous1TestRunName);
            trTestRun.closeTestRun_byName(projectId, milestoneId, previous2TestRunName);
            trTestRun.closeTestRun_byName(projectId, milestoneId, previous3TestRunName);
            return myTestRun.id;
        } else {
            let err = `\n[TestRun-Handling-Error] Test Run "${testRunName}" for Milestone ID "${milestoneId}" is already completed/closed!\n`;
            throw err;
        }
    },

    // Add test result in a bulk using provided TestRail API
    addTestResultInBulk: async function (testRunId, cbJson, caseDicts, testTarget, jenkinsPath) {
        trTestResult.constructResultsSummary(cbJson, caseDicts, testTarget, jenkinsPath).then((results) => {
            console.log(" > Test result count : " + results.length);
            testrail
                .addResultsForCases(testRunId, results)
                .then((response) => {
                    return response;
                })
                .catch((err) => {
                    console.error(err);
                });
        });
    },

    // Add test result individually (for each iteration of scenarios, result will be added)
    // See trTestResult.constructResultsSummary (...) method.
    addTestResultIndividually: async function (testRunId, cbJson, caseDicts, testTarget, jenkinsPath) {
        var targetStatus = 0; /*1 - passed on QA, 2 - blocked, 3 - untested , 4 - retest , 5 - failed , 10 - passed on support , 11 - passed on stg , 12 - passed on prod*/
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
        var counter = 0;
        var result = {};
        var status = targetStatus;
        var resultComment = "";
        var resultElapsed = 0;
        var scenarioid = 0;
        cbJson.forEach((feature) => {
            feature.elements.forEach((scenario) => {
                scenario.steps
                    .filter((s) => _.includes(["given", "when", "then", "but", "and"], s.keyword.trim().toLowerCase()))
                    .forEach((step) => {
                        if (step.result.status != "passed" && step.result.status != "skipped") {
                            resultComment += "- **" + step.result.status.toUpperCase() + "** :: " + step.keyword + " " + step.name + "\r\n";
                            status = 5;
                        }
                        if (_.has(step.result, "error_message")) {
                            resultComment += "\r\n**Error Reference :**";
                            resultComment += "\r\n" + step.result.error_message.substring(0, step.result.error_message.indexOf("\n")) + "\r\n\r\n";
                            resultComment += jenkinsPath ? "||:For more details, please go [Jenkins Link](" + jenkinsPath + trHelper.getConstructCucumberReportPath(feature) + ").\r\n" : "||:Details error are not available as the test are triggered locally!\r\n";
                        }
                        resultElapsed = resultElapsed + step.result.duration || resultElapsed;
                    });

                if (scenario.type != "background") {
                    scenarioid = trHelper.extractId_fromTestCase(scenario.name);
                    if (_.includes(caseDicts, scenarioid)) {
                        counter++;
                        result.comment = resultComment;
                        result.status_id = status;
                        // if ( result.status_id == targetStatus ) {
                        //   //todo - to be optimized
                        //   testrail.updateCase ( cid , {custom_automation: 2});
                        // }
                        result.elapsed = Math.round(resultElapsed / 1e9) > 0 ? Math.round(resultElapsed / 1e9) + "s" : null; //null for undefined steps

                        console.log(" > #" + counter + " adding result for test case " + scenarioid);
                        testrail
                            .addResultForCase(testRunId, scenarioid, result)
                            .then((response) => {
                                return response.body;
                            })
                            .catch((err) => {
                                console.log(" > add result error : " + err);
                                console.log(err.dir);
                            });
                    }
                    result = {};
                    resultComment = "";
                    resultElapsed = 0;
                    status = targetStatus;
                    scenarioid = 0;
                }
            });
        });
    },

    addTestResultIndividually_NW: async function (testRunId, cbJson, caseDicts, testTarget, jenkinsPath) {
        var targetStatus = 0; /*1 - passed on QA, 2 - blocked, 3 - untested , 4 - retest , 5 - failed , 10 - passed on support , 11 - passed on stg , 12 - passed on prod*/
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
        var counter = 0;
        var result = {};
        var status = targetStatus;
        var resultComment = "";
        var resultElapsed = 0;
        var scenarioid = 0;

        let moduleObj = cbJson.modules;
        let moduleList = Object.keys(moduleObj);

        for (let module of moduleList) {
            if (moduleObj[module].failedCount > 0 || moduleObj[module].errorsCount > 0) {
                status = 5;
            }
            if (moduleObj[module].lastError) {
                resultComment += `\r\n ${moduleObj[module].lastError.message} \r\n\r\n`;
                resultComment += jenkinsPath ? "||:For more details, please go [Jenkins Link](" + jenkinsPath + trHelper.getConstructAllureReportPath(feature) + ").\r\n" : "||:Details error are not available as the test are triggered locally!\r\n";
            }
            resultElapsed = moduleObj[module].time? moduleObj[module].time + "s" : null;
            scenarioid = trHelper.extractId_fromTestCase(module);
            if (_.includes(caseDicts, scenarioid)) {
                counter++;
                result.comment = resultComment;
                result.status_id = status;
                result.elapsed = resultElapsed;
                console.log(" > #" + counter + " adding result for test case " + scenarioid);
                testrail
                    .addResultForCase(testRunId, scenarioid, result)
                    .then((response) => {
                        return response.body;
                    })
                    .catch((err) => {
                        console.log ( " > prob : " + result.elapsed );
                        console.log(" > add result error : " + err);
                        console.dir(err);
                    });
            }
            result = {};
            resultComment = "";
            resultElapsed = 0;
            status = targetStatus;
            scenarioid = 0;
        }
    },
};
