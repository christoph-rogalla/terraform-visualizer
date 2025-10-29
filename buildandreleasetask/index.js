"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const path = __importStar(require("path"));
async function run() {
    try {
        console.log('Current directory:', process.cwd());
        fs_1.default.readdir(process.cwd(), (err, files) => {
            if (err) {
                console.error('Error reading directory:', err);
            }
            else {
                console.log('Directory contents:', files);
            }
        });
        const templatePath = path.join(process.cwd(), 'buildandrelease', 'template.hbs');
        console.log('Looking for template at:', templatePath);
        console.log('Exists?', fs_1.default.existsSync(templatePath));
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
