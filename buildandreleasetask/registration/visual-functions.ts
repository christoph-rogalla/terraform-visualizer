import handlebars from "handlebars";
import {ResourceChanges} from "../services/TerraformPlan";
import {EntityDifferenceBuilder} from "../services/EntityDifferenceBuilder";

export function registerVisualisationFunctions() {
  registerGroupByAction();
  registerRendersChanges();
  registerTruncate();
}

function registerGroupByAction() {
  handlebars.registerHelper('groupByAction', (changes: ResourceChanges[]) => {
    const grouped: any = {};
    changes.forEach(change => {
      const actions = change.change.actions || [];
      actions.forEach(action => {
        const key = action.toLowerCase();
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(change);
      });
    });
    ['create', 'update', 'delete', 'read'].forEach(k => {
      if (!grouped[k]) grouped[k] = [];
    });
    return grouped;
  });
}

function registerRendersChanges() {
  handlebars.registerHelper("renderBefore", (before, after, beforeSensitive, afterSensitive) => {
    return new handlebars.SafeString(renderSide(before, after, beforeSensitive, afterSensitive, "before"));
  });

  handlebars.registerHelper("renderAfter", (before, after, beforeSensitive, afterSensitive) => {
    return new handlebars.SafeString(renderSide(after, before, afterSensitive, beforeSensitive, "after"));
  });
}

function registerTruncate() {
  handlebars.registerHelper("truncate", (str, len) => {
    if (!str) return "";
    return str.length > len ? str.slice(0, len) + "…" : str;
  });
}

function renderSide(main: any, side: any, mainSensitive: any, sideSensitive: any, mainIs: "after" | "before") {
  return new EntityDifferenceBuilder()
    .setMain(main, mainSensitive)
    .setSide(side, sideSensitive)
    .setCurrentSide(mainIs)
    .renderAsHtml();
}