"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("azure-pipelines-task-lib/task");
const JsonFileReader_1 = __importDefault(require("./services/JsonFileReader"));
const TerraformChangeDetector_1 = __importDefault(require("./services/TerraformChangeDetector"));
const HtmlGenerator_1 = __importDefault(require("./services/HtmlGenerator"));
const HtmlFileExporter_1 = __importDefault(require("./services/HtmlFileExporter"));
const fs_1 = __importDefault(require("fs"));
async function run() {
    try {
        const filePath = tl.getInput('filePath', true);
        const outputFilePath = tl.getInput('outputFilePath', true);
        const includeReadActions = tl.getInput('includeReadActions', false) == 'true';
        const template = fs_1.default.readFileSync("./template.hbs", "utf8");
        let fileReader = new JsonFileReader_1.default();
        let changeDetector = new TerraformChangeDetector_1.default();
        let htmlGenerator = new HtmlGenerator_1.default();
        let fileExporter = new HtmlFileExporter_1.default();
        // read and parse the JSON file
        let plan = fileReader.readTerraformPlan(filePath);
        let changes = changeDetector.detectChanges(plan, includeReadActions);
        let html = htmlGenerator.generateHtmlFrom(changes, template);
        fileExporter.export(html, outputFilePath);
        tl.setResult(tl.TaskResult.Succeeded, "Successfully generated Terraform visualisation HTML file");
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}
run();
