"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TerraformPlan_js_1 = require("./TerraformPlan.js");
class TerraformChangeDetector {
    detectChanges(plan) {
        console.log("Analyzing Terraform plan changes...");
        // filter out read or no operation actions
        let filtered = plan.resource_changes.filter(change => !change.change.actions.includes(TerraformPlan_js_1.ActionType.NONE) && !change.change.actions.includes(TerraformPlan_js_1.ActionType.READ));
        for (const change of filtered) {
            // replace create and delete actions with replace action
            if (change.change.actions.includes(TerraformPlan_js_1.ActionType.CREATE && TerraformPlan_js_1.ActionType.DELETE)) {
                change.change.actions = [TerraformPlan_js_1.ActionType.REPLACE];
            }
        }
        return filtered;
    }
}
exports.default = TerraformChangeDetector;
