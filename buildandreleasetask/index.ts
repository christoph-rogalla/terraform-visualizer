import tl = require('azure-pipelines-task-lib/task');
import JsonFileReader from "./services/JsonFileReader";
import TerraformChangeDetector from "./services/TerraformChangeDetector";
import HtmlGenerator from "./services/HtmlGenerator";
import HtmlFileExporter from "./services/HtmlFileExporter";
import fs from "fs";

async function run() {
  try {
    const filePath = tl.getInput('filePath', true);
    const outputFilePath = tl.getInput('outputFilePath', true);
    const includeReadActions = tl.getInput('includeReadActions', false) == 'true';
    const template = fs.readFileSync("./template.hbs", "utf8");

    let fileReader = new JsonFileReader();
    let changeDetector = new TerraformChangeDetector();
    let htmlGenerator = new HtmlGenerator();
    let fileExporter = new HtmlFileExporter();

    // read and parse the JSON file
    let plan = fileReader.readTerraformPlan(filePath!);
    let changes = changeDetector.detectChanges(plan, includeReadActions);
    let html = htmlGenerator.generateHtmlFrom(changes, template);
    fileExporter.export(html, outputFilePath!);
    tl.setResult(tl.TaskResult.Succeeded, "Successfully generated Terraform visualisation HTML file");
  } catch (err: any) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();