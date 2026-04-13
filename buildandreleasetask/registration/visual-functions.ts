import handlebars from "handlebars";
import {ResourceChanges} from "../services/TerraformPlan";

export function registerVisualisationFunctions() {
  registerJsonMasking();
  registerGroupByAction();
  registerHighlightChanges();
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

function registerHighlightChanges() {
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

function registerJsonMasking() {
  handlebars.registerHelper("safeJsonWithSensitiveFlags", (obj, sensitiveMap) => {
    try {
      const masked = maskSensitive(obj, sensitiveMap);
      return JSON.stringify(masked, null, 2);
    } catch (e) {
      return "[Error rendering object]";
    }
  });
}

function maskSensitive(data: any, sensitiveMap: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map((item, i) => maskSensitive(item, sensitiveMap[i]));
  }

  const result: any = {};
  for (const key of Object.keys(data)) {
    const isSensitive = sensitiveMap && sensitiveMap[key] === true;
    if (isSensitive) {
      result[key] = '***';
    } else {
      result[key] = maskSensitive(data[key], sensitiveMap[key]);
    }
  }
  return result;
}