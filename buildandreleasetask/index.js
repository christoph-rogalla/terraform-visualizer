"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("azure-pipelines-task-lib/task");
const JsonFileReader_1 = __importDefault(require("./services/JsonFileReader"));
const TerraformChangeDetector_1 = __importDefault(require("./services/TerraformChangeDetector"));
const TemplateBuilder_1 = __importDefault(require("./services/TemplateBuilder"));
const logic_functions_1 = require("./registration/logic-functions");
const visual_functions_1 = require("./registration/visual-functions");
const fs_1 = require("fs");
async function run() {
    try {
        // params
        const filePath = tl.getInput('filePath', true);
        const outputFilePath = tl.getInput('outputFilePath', true);
        const includeReadActions = tl.getInput('includeReadActions', false) == 'true';
        // services
        let fileReader = new JsonFileReader_1.default();
        let changeDetector = new TerraformChangeDetector_1.default();
        let templateBuilder = new TemplateBuilder_1.default();
        // read and parse the JSON file
        let plan = fileReader.readTerraformPlan(filePath);
        let changes = changeDetector.detectChanges(plan, includeReadActions);
        (0, logic_functions_1.registerLogicFunctions)();
        (0, visual_functions_1.registerVisualisationFunctions)();
        let html = templateBuilder.build(changes);
        console.log("Writing HTML to file...");
        (0, fs_1.writeFileSync)(outputFilePath, html);
        tl.setResult(tl.TaskResult.Succeeded, "Successfully generated Terraform visualisation HTML file");
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}
run();
