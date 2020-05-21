const trHelper = require("./testrail_helper");
const Testrail = require("testrail-api");

// Configure testrail authentication
const testrail = new Testrail({
    host: process.env.trApiUrl,
    user: process.env.trApiUser,
    password: process.env.trApiKey,
});


module.exports = {
    // get the status from the TestRail and push everything to automationstatus.json to be consumed by EazyBI
    getDashboardStatus: async function (projectId, file_loc) {
        var resultfile;
        if (file_loc == "") {
            file_loc = "automationstatus.json";
            resultfile = [];
        } else {
            resultfile = jsonfile.readFileSync(file_loc);
        }
        //console.log (" ========= INITIAL ============ ")
        //console.log ( JSON.stringify (resultfile, null, 5 ) );
        //console.log (" ====== END OF INITIAL =====");

        var currentWeek = trHelper.getCurrentWeekNumber(new Date());
        var currentSprint = trHelper.getCurrentSprintID();
        console.log("=======  DATA PULLING INFORMATION ======");
        console.log("Current date   : " + new Date());
        console.log("Current week   : " + currentWeek);
        console.log("Current sprint : " + currentSprint);
        console.log("========================================");

        // map array to promises
        const promises = projectId.map((pid) =>
            (async () => {
                {
                    //======= POPULATING TEST CASES INFORMATION =========//
                    var project = await testrail.getProject(pid).then((response) => {
                        return response.body;
                    });
                    var toBeAutomatedCase;
                    var automatedCase;
                    var willNotAutomate;
                    var wna_oneoff;
                    var wna_subjective;
                    var wna_unstable;
                    var wna_3rdparty;
                    var wna_environment;
                    var wna_load;
                    var wna_permission;
                    var wna_bigdata;
                    var wna_undefined;
                    var totalTestCase;
                    var tobeAutomatedPercentage;
                    var automatedPercentage;
                    var automatedPercentageNotManual;
                    var manualPercentage;

                    console.log(" > collecting data for project " + pid);
                    var allTestCases = await testrail
                        .getCases(pid)
                        .then((response) => {
                            const allCases = response.body;
                            const myCases = allCases.filter((s) => !s.custom_outdated); //.filter ( c => (c.custom_summary == null || !c.custom_summary.includes ("Exclude from status")))
                            toBeAutomatedCase = myCases.filter((s) => s.custom_automation == 1);
                            automatedCase = myCases.filter((s) => s.custom_automation == 2);
                            willNotAutomate = myCases.filter((s) => s.custom_automation == 4);
                            wna_oneoff = willNotAutomate.filter((s) => s.custom_automationpriority == 1);
                            wna_subjective = willNotAutomate.filter((s) => s.custom_automationpriority == 2);
                            wna_unstable = willNotAutomate.filter((s) => s.custom_automationpriority == 3);
                            wna_3rdparty = willNotAutomate.filter((s) => s.custom_automationpriority == 4);
                            wna_environment = willNotAutomate.filter((s) => s.custom_automationpriority == 5);
                            wna_load = willNotAutomate.filter((s) => s.custom_automationpriority == 6);
                            wna_permission = willNotAutomate.filter((s) => s.custom_automationpriority == 7);
                            wna_bigdata = willNotAutomate.filter((s) => s.custom_automationpriority == 8);
                            wna_undefined = willNotAutomate.filter((s) => s.custom_automationpriority == null);
                            totalTestCase = toBeAutomatedCase.length + automatedCase.length + willNotAutomate.length;
                            tobeAutomatedPercentage = Math.round((toBeAutomatedCase.length / totalTestCase) * 100 * 100) / 100 || 0;
                            automatedPercentage = Math.round((automatedCase.length / totalTestCase) * 100 * 100) / 100 || 0;
                            automatedPercentageNotManual = Math.round((automatedCase.length / (totalTestCase - willNotAutomate.length)) * 100 * 100) / 100 || 0;
                            manualPercentage = Math.round((willNotAutomate.length / totalTestCase) * 100 * 100) / 100 || 0;

                            var savedProject = resultfile.filter((r) => r.projectid == pid);
                            if (savedProject && savedProject.length != 0) {
                                console.log("> Project " + pid + " exist in the result json. data will be added");
                                //var savedWeek = savedProject[0].status.filter ( s => (s.week == currentWeek))
                                var savedSprint = savedProject[0].status.filter((s) => s.sprint == currentSprint);

                                if (savedSprint && savedSprint.length != 0) {
                                    //console.log ( "  > Week " + currentWeek + " exist for project " + pid + ". data will be updated");
                                    console.log("  > Sprint " + currentSprint + " exist for project " + pid + ". data will be updated");
                                    savedSprint[0].totaltestcase = totalTestCase;
                                    savedSprint[0].automated = automatedCase.length;
                                    savedSprint[0].tobeautomated = toBeAutomatedCase.length;
                                    savedSprint[0].willnotautomate[0].total_wna = willNotAutomate.length;
                                    savedSprint[0].willnotautomate[0].undefined_data = wna_undefined.length;
                                    savedSprint[0].willnotautomate[0].one_off = wna_oneoff.length;
                                    savedSprint[0].willnotautomate[0].subjective = wna_subjective.length;
                                    savedSprint[0].willnotautomate[0].unstable = wna_unstable.length;
                                    savedSprint[0].willnotautomate[0].thirdparty = wna_3rdparty.length;
                                    savedSprint[0].willnotautomate[0].environment = wna_environment.length;
                                    savedSprint[0].willnotautomate[0].perfload = wna_load.length;
                                    savedSprint[0].willnotautomate[0].permission = wna_permission.length;
                                    savedSprint[0].willnotautomate[0].bigdata = wna_bigdata.length;
                                    savedSprint[0].tobeautomatedPerc = tobeAutomatedPercentage;
                                    savedSprint[0].automatedPerc = automatedPercentage;
                                    savedSprint[0].automatedNotManualPerc = automatedPercentageNotManual;
                                    savedSprint[0].manualPerc = manualPercentage;
                                } else {
                             
                                    console.log("  > Sprint " + currentSprint + " does not exist for project " + pid + ". data will be added");
                                    var newSprintData = {
                                        //week : currentWeek,
                                        sprint: currentSprint,
                                        totaltestcase: totalTestCase,
                                        automated: automatedCase.length,
                                        tobeautomated: toBeAutomatedCase.length,
                                        willnotautomate: [
                                            {
                                                total_wna: willNotAutomate.length,
                                                undefined_data: wna_undefined.length,
                                                one_off: wna_oneoff.length,
                                                subjective: wna_subjective.length,
                                                unstable: wna_unstable.length,
                                                thirdparty: wna_3rdparty.length,
                                                environment: wna_environment.length,
                                                perfload: wna_load.length,
                                                permission: wna_permission.length,
                                                bigdata: wna_bigdata.length,
                                            },
                                        ],
                                        tobeautomatedPerc: tobeAutomatedPercentage,
                                        automatedPerc: automatedPercentage,
                                        automatedNotManualPerc: automatedPercentageNotManual,
                                        manualPerc: manualPercentage,
                                    };
                                    savedProject[0].status.push(newSprintData);
                                }
                            } else {
                                console.log("> Project " + pid + " does not exist in the result json. New project data will be created");
                                var newProjectData = {
                                    projectid: pid,
                                    projectname: project.name,
                                    status: [
                                        {
                                            sprint: currentSprint,
                                            totaltestcase: totalTestCase,
                                            automated: automatedCase.length,
                                            tobeautomated: toBeAutomatedCase.length,
                                            willnotautomate: [
                                                {
                                                    total_wna: willNotAutomate.length,
                                                    undefined_data: wna_undefined.length,
                                                    one_off: wna_oneoff.length,
                                                    subjective: wna_subjective.length,
                                                    unstable: wna_unstable.length,
                                                    thirdparty: wna_3rdparty.length,
                                                    environment: wna_environment.length,
                                                    perfload: wna_load.length,
                                                    permission: wna_permission.length,
                                                    bigdata: wna_bigdata.length,
                                                },
                                            ],
                                            tobeautomatedPerc: tobeAutomatedPercentage,
                                            automatedPerc: automatedPercentage,
                                            automatedNotManualPerc: automatedPercentageNotManual,
                                            manualPerc: manualPercentage,
                                        },
                                    ],
                                };
                                resultfile.push(newProjectData);
                            }
                            console.log(" > Data added/updated for project " + pid);
                            return myCases;
                        })
                        .catch((err) => {
                            console.error("Testrail getCases Error :", err);
                        });
                }
            })()
        );

        // wait until all promises are resolved
        await Promise.all(promises);
        console.log("Done!");

        //const file = 'automationstatus.json'
        jsonfile.writeFileSync(file_loc, resultfile);
        console.log(" ========= RAW JSON DATA ============ ");
        console.log(JSON.stringify(resultfile, null, 4));
    },

    //Get dashboard information to update the health section - this will generate healthstatus.json
    getHealthStatus: async function (projectId, file_loc) {
        var resultfile;
        if (file_loc == "") {
            file_loc = "healthstatus.json";
            resultfile = [];
        } else {
            resultfile = jsonfile.readFileSync(file_loc);
        }

        var currentSprint = trHelper.getCurrentSprintID();

        const promises = projectId.map((pid) =>
            (async () => {
                var project = await testrail.getProject(pid).then((response) => {
                    return response.body;
                });
                console.log(" > collecting health status for project " + pid);

                var allMilestones = await testrail.getMilestones(pid).then((response) => {
                    return response.body;
                });

                // testrail.getMilestones ( pid ).then ( response => {
                //const allMilestones = response.body;

                //get all milestones for given project (auto,manual,feature - exclude performance)
                const currentSprintMilestone = allMilestones.filter((m) => m.name.includes("Sprint " + currentSprint) && !m.name.includes("Performance"));
                const autoMilestone = currentSprintMilestone.filter((m) => m.name.toLowerCase().includes("automated"))[0];
                const manualMilestone = currentSprintMilestone.filter((m) => m.name.toLowerCase().includes("manual"))[0];
                const featureMilestone = currentSprintMilestone.filter((m) => m.name.toLowerCase().includes("feature scenarios"))[0];

                var m_ids = "";
                currentSprintMilestone.forEach((m) => {
                    m_ids += m.id + ",";
                });
                m_ids = m_ids.slice(0, m_ids.length - 1);

                var autoPassCount = 0;
                var autoFailCount = 0;
                var autoBlockCount = 0;
                var autoUntestedCount = 0;
                var manualPassCount = 0;
                var manualFailCount = 0;
                var manualBlockCount = 0;
                var manualUntestedCount = 0;
                var featurePassCount = 0;
                var featureFailCount = 0;
                var featureBlockCount = 0;
                var featureUntestedCount = 0;

                await testrail.getRuns(pid, { milestone_id: m_ids }).then((response) => {
                    //await testrail.getRuns( pid, {milestone_id: m_ids}, function (err, response, runs) {
                    const allRuns = response.body;
                    if (autoMilestone) {
                        const autoRuns = allRuns.filter((r) => r.milestone_id == autoMilestone.id && !r.is_completed);
                        autoRuns.forEach((r) => {
                            autoPassCount += r.passed_count;
                            autoFailCount += r.failed_count;
                            autoBlockCount += r.blocked_count;
                            autoUntestedCount += r.untested_count;
                        });
                    }
                    if (manualMilestone) {
                        const manualRuns = allRuns.filter((r) => r.milestone_id == manualMilestone.id);
                        manualRuns.forEach((r) => {
                            manualPassCount += r.passed_count;
                            manualFailCount += r.failed_count;
                            manualBlockCount += r.blocked_count;
                            manualUntestedCount += r.untested_count;
                        });
                    }
                    if (featureMilestone) {
                        const featureRuns = allRuns.filter((r) => r.milestone_id == featureMilestone.id);
                        featureRuns.forEach((r) => {
                            featurePassCount += r.passed_count;
                            featureFailCount += r.failed_count;
                            featureBlockCount += r.blocked_count;
                            featureUntestedCount += r.untested_count;
                        });
                    }
                });


                var savedProject = resultfile.filter((r) => r.projectid == pid);
                if (savedProject && savedProject.length != 0) {
                    console.log("> Project " + pid + " exist in the result json. health data will be added");
                    var savedSprint = savedProject[0].status.filter((s) => s.sprint == currentSprint);
                    if (savedSprint && savedSprint.length != 0) {
                        console.log("  > Sprint " + currentSprint + " exist for project " + pid + ". data will be updated");
                        savedSprint[0].auto_passed = autoPassCount;
                        savedSprint[0].auto_failed = autoFailCount;
                        savedSprint[0].auto_blocked = autoBlockCount;
                        savedSprint[0].auto_untested = autoUntestedCount;
                        savedSprint[0].manual_passed = manualPassCount;
                        savedSprint[0].manual_failed = manualFailCount;
                        savedSprint[0].manual_blocked = manualBlockCount;
                        savedSprint[0].manual_untested = manualUntestedCount;
                        savedSprint[0].feature_passed = featurePassCount;
                        savedSprint[0].feature_failed = featureFailCount;
                        savedSprint[0].feature_blocked = featureBlockCount;
                        savedSprint[0].feature_untested = featureUntestedCount;
                    } else {
                        console.log("  > Sprint " + currentSprint + " does not exist for project " + pid + ". data will be added");
                        var newSprintData = {
                            sprint: currentSprint,
                            auto_passed: autoPassCount,
                            auto_failed: autoFailCount,
                            auto_blocked: autoBlockCount,
                            auto_untested: autoUntestedCount,
                            manual_passed: manualPassCount,
                            manual_failed: manualFailCount,
                            manual_blocked: manualBlockCount,
                            manual_untested: manualUntestedCount,
                            feature_passed: featurePassCount,
                            feature_failed: featureFailCount,
                            feature_blocked: featureBlockCount,
                            feature_untested: featureUntestedCount,
                        };
                        savedProject[0].status.push(newSprintData);
                    }
                } else {
                    console.log("> Project " + pid + " does not exist in the result json. New project data will be created");
                    var newHealthData = {
                        projectid: pid,
                        projectname: project.name,
                        status: [
                            {
                                sprint: currentSprint,
                                auto_passed: autoPassCount,
                                auto_failed: autoFailCount,
                                auto_blocked: autoBlockCount,
                                auto_untested: autoUntestedCount,
                                manual_passed: manualPassCount,
                                manual_failed: manualFailCount,
                                manual_blocked: manualBlockCount,
                                manual_untested: manualUntestedCount,
                                feature_passed: featurePassCount,
                                feature_failed: featureFailCount,
                                feature_blocked: featureBlockCount,
                                feature_untested: featureUntestedCount,
                            },
                        ],
                    };
                    resultfile.push(newHealthData);
                }
                console.log(" > Data added/updated for project " + pid);

                // }).catch (err => {
                //   console.error ('TestRail getHealth error :' , err );
                // });
            })()
        );

        await Promise.all(promises);
        console.log("Done!");

        jsonfile.writeFileSync(file_loc, resultfile);
        console.log(" ========= RAW JSON DATA ============ ");
        console.log(JSON.stringify(resultfile, null, 4));
    },
};
