import {ActionType, TerraformPlan} from "./TerraformPlan.js";

export default class TerraformChangeDetector {
  detectChanges(plan: TerraformPlan, includeReadActions: boolean = false) {
    console.log("Analyzing Terraform plan changes...");
    // filter out read or no operation actions
    let filtered = includeReadActions ?
      plan.resource_changes.filter(change => !change.change.actions.includes(ActionType.NONE)) :
      plan.resource_changes.filter(change => !change.change.actions.includes(ActionType.NONE) && !change.change.actions.includes(ActionType.READ));
    for (const change of filtered) {
      // replace create and delete actions with replace action
      if (change.change.actions.includes(ActionType.CREATE && ActionType.DELETE)) {
        change.change.actions = [ActionType.REPLACE]
      }
    }

    return filtered;
  }
}