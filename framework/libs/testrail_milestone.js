const trHelper = require("./testrail_helper");
const Testrail = require("testrail-api");

// Configure testrail authentication
const testrail = new Testrail({
    host: process.env.trApiUrl,
    user: process.env.trApiUser,
    password: process.env.trApiKey,
});

module.exports = {
    // Generate milestone name based on given sprintId.

    getGeneratedMilestoneName: function (sprintId) {
        if (sprintId == 0) {
            //auto-generated
            return "Sprint " + trHelper.getCurrentSprintID() + " - Project";
        }
        return "Sprint " + sprintId + " - Project";
    },

    // Add milestone entry to the project with given ID at the TestRail application
    addMilestone_byName: async function (projectId, milestoneName) {
        var myPreparedMilestone = {
            name: milestoneName,
            due_on: this.getMilestoneDuedate_bySprintId(milestoneName),
            description: "",
        };
        var myAddedMilestone;
        var projectName = await trHelper.getProjectName_byId(projectId);
        myPreparedMilestone.description = "Milestone For " + projectName + " project";
        myAddedMilestone = await testrail.addMilestone(/*PROJECT_ID=*/ projectId, /*CONTENT=*/ myPreparedMilestone).then((response) => {
            return response.body;
        });
        return myAddedMilestone;
    },

    // Generate milestone due date (typically 2-weeks)
    // Sprint ID is automatically pulled out from the milestone name with regex
    getMilestoneDuedate_bySprintId: function (milestoneName) {
        const END_DATE_SPRINT100 = "March 15, 2019 00:00:00";
        const ANCHOR_SPRINTID = 100;
        const SPRINT_LENGTH = 14;
        var dueDate = new Date(END_DATE_SPRINT100);
        let sprintID = milestoneName.match(/\d+/);
        dueDate.setDate(dueDate.getDate() + (sprintID - ANCHOR_SPRINTID) * SPRINT_LENGTH);
        return Math.floor(dueDate / 1000);
    },
};
