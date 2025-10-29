import {ResourceChanges} from "./TerraformPlan.js";
import handlebars from "handlebars";

export default class HtmlGenerator {

  generateHtmlFrom(changes: ResourceChanges[], template: string) {
    console.log("Generating HTML...");
    this.registerLogicFunctions();
    this.registerVisualisationFunctions();
    let compiledTemplate = handlebars.compile(template);
    return compiledTemplate({changes});
  }

  private registerVisualisationFunctions() {
    let maskSensitive = this.maskSensitive;
    handlebars.registerHelper("safeJsonWithSensitiveFlags", function (obj, sensitiveMap) {
      try {
        const masked = maskSensitive(obj, sensitiveMap);
        return JSON.stringify(masked, null, 2);
      } catch (e) {
        return "[Error rendering object]";
      }
    });

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
    handlebars.registerHelper('highlightChanges', (before, after, beforeSensitive, afterSensitive) => {
      before = before || {};
      after = after || {};
      beforeSensitive = beforeSensitive || {};
      afterSensitive = afterSensitive || {};

      // Mask secrets using Terraform metadata
      const safeBefore = maskSensitive(before, beforeSensitive);
      const safeAfter = maskSensitive(after, afterSensitive);

      const allKeys = Array.from(new Set([...Object.keys(safeBefore), ...Object.keys(safeAfter)]));
      const parts = allKeys.map(k => {
        const b = JSON.stringify(safeBefore[k], null, 2);
        const a = JSON.stringify(safeAfter[k], null, 2);

        if (!(k in safeBefore)) {
          // Added key
          return `<span class="bg-green-100 text-green-800 font-semibold">"${k}": ${a}</span>`;
        } else if (!(k in safeAfter)) {
          // Removed key
          return `<span class="bg-red-100 text-red-800 line-through font-semibold">"${k}": ${b}</span>`;
        } else if (b !== a) {
          // Modified key
          return `<span class="bg-yellow-100 text-yellow-800 font-semibold">"${k}": ${a}</span>`;
        } else {
          // Unchanged
          return `"${k}": ${a}`;
        }
      });

      return new handlebars.SafeString(`{<br>${parts.join(',<br>')}<br>}`);
    });
  }

  private registerLogicFunctions() {
    handlebars.registerHelper('eq', (a, b) => a === b);
    handlebars.registerHelper('ne', (a, b) => a !== b);
    handlebars.registerHelper('gt', (a, b) => a > b);
    handlebars.registerHelper('lt', (a, b) => a < b);
    handlebars.registerHelper('gte', (a, b) => a >= b);
    handlebars.registerHelper('lte', (a, b) => a <= b);
    handlebars.registerHelper('and', () => Array.prototype.slice.call(arguments, 0, -1).every(Boolean));
    handlebars.registerHelper('or', () => Array.prototype.slice.call(arguments, 0, -1).some(Boolean));
    handlebars.registerHelper('not', (value) => !value);
  }

  private maskSensitive(data: any, sensitiveMap: any): any {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data)) {
      return data.map((item, i) => this.maskSensitive(item, sensitiveMap[i]));
    }

    const result: any = {};
    for (const key of Object.keys(data)) {
      const isSensitive = sensitiveMap && sensitiveMap[key] === true;
      if (isSensitive) {
        result[key] = '***';
      } else {
        result[key] = this.maskSensitive(data[key], sensitiveMap[key]);
      }
    }
    return result;
  }
}