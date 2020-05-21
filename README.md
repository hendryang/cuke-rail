# TESTRAIL INTEGRATION 

Script to automatically sync test cases from cucumber/junit json result to TestRail based on [TestRail API (v2)](http://docs.gurock.com/testrail-api2/start)

## Preparation

Set following environment variable:
* trApiUrl=TestRail_BaseURL
* trApiUser=<user@email.com>
* trApiKey=&lt;ApiKey&gt;

## Available commands
| Command | Values | Description |
|----|----|----|
| `--trCmd`| `cbPretestVerification` | please refer to [pretest section](#pre-check-result) |
||`cbPretestVerification_NW`| please refer to [pretest section](#pre-check-result)  |
||`cbTestCases`| please refer to [sync test cases section](#sync-test-cases)  |
||`cbTestResults`| please refer to [sync test results section](#sync-test-results)  |
||`cbTestResults_NW`| please refer to [sync test results section](#sync-test-results)  |
|`--trProjectId`| &lt;testrail ID&gt; | TestRail project ID|
|`--trcbJsonPath`| <path-to-result.json> | Path to the result.json to be read from|
|`--trTestTarget`| qa,ci,dev,stg,prod| Target of the run (default: **qa**) |
|`--trJenkinsPath` | <path-to-jenkins-job> | To enable *tracing* to the source of test result (jenkins link)|
|`--trModuleName` | <module-name> | To identify/create test run based on the module <br> (default: **auto scan**) |

## Synchronization with TestRail
### Pre check result
* For cucumber test, Run `node testrail-report.js --trCmd cbPretestVerification --cbJsonPath <Path-to-json-result.json> --trProjectId <testrail project id>`
* For nightwatch test, Run `node testrail-report.js --trCmd cbPretestVerification_NW --cbJsonPath <Path-to-json-result.json> --trProjectId <testrail project id>`

This will scan your test result (json file) against TestRail and will print out following information:
* List of test cases that has no testrail ID
* List of duplicated IDs found in your test result
* List of IDs that exist in test result but does not exist in TestRail
* List of IDs that exist in TestRail (automated) but does not exist in your testresult 

### Sync Test Cases
* Run `node testrail-reports.js --trCmd cbTestCases --trProjectId <projectID> --cbJsonPath <path-to-result.json>`

This will update all the test cases from your test result to test cases in TestRail. The update will include test description, summary, and bdd steps.
Note: do not run this if you wish to retain your test case information "as is" in the testrail.
### Sync Test Results
* For **cucumber** test, Run `node testrail-reports.js --trCmd cbTestResults --trModuleName <mod-name> --trProjectId <proj-id> --cbJsonPath <path-to-result.json> --trJenkinsPath <jenkins-job> --trTestTarget <test-target> --trUpdateInBulk false`
* For **nightwatch** test, Run `node testrail-reports.js --trCmd cbTestResults_NW --trModuleName <mod-name> --trProjectId <proj-id> --cbJsonPath <path-to-result.json> --trJenkinsPath <jenkins-job> --trTestTarget <test-target> --trUpdateInBulk false`

## Sample Jenkins Job

## Built With
* Nodejs
* Npm
* TestRail API 
* EazyBI support

## Maintainers

* Hendryang91@gmail.com