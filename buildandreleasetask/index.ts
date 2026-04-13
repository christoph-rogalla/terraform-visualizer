import tl = require('azure-pipelines-task-lib/task');
import JsonFileReader from "./services/JsonFileReader";
import TerraformChangeDetector from "./services/TerraformChangeDetector";
import TemplateBuilder from "./services/TemplateBuilder";
import {registerLogicFunctions} from "./registration/logic-functions";
import {registerVisualisationFunctions} from "./registration/visual-functions";
import {writeFileSync} from "fs";

async function run() {
  try {
    // params
    const filePath = tl.getInput('filePath', true);
    const outputFilePath = tl.getInput('outputFilePath', true);
    const includeReadActions = tl.getInput('includeReadActions', false) == 'true';

    // services
    let fileReader = new JsonFileReader();
    let changeDetector = new TerraformChangeDetector();
    let templateBuilder = new TemplateBuilder();

    // read and parse the JSON file
    let plan = fileReader.readTerraformPlan(filePath!);
    let changes = changeDetector.detectChanges(plan, includeReadActions);
    registerLogicFunctions();
    registerVisualisationFunctions();
    let html = templateBuilder.build(changes);

    console.log("Writing HTML to file...");
    writeFileSync(outputFilePath!, html);

    tl.setResult(tl.TaskResult.Succeeded, "Successfully generated Terraform visualisation HTML file");
  } catch (err: any) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();