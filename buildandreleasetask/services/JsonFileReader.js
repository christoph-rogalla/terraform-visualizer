"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
class JsonFileReader {
    readTerraformPlan(filePath) {
        console.log("Trying to read and parse JSON file...");
        const content = fs_1.default.readFileSync(filePath, "utf8");
        const plan = JSON.parse(content.trim());
        return plan;
    }
}
exports.default = JsonFileReader;
