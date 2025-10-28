import fs from "fs";
import {TerraformPlan} from "./TerraformPlan.js";

export default class JsonFileReader {

  readTerraformPlan(filePath: string) {
    console.log("Trying to read and parse JSON file...");
    const content = fs.readFileSync(filePath, "utf8");
    const plan = JSON.parse(content.trim()) as TerraformPlan;
    return plan;
  }
}