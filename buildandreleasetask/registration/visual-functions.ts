import handlebars from "handlebars";
import {ResourceChanges} from "../services/TerraformPlan";

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

function maskSensitive(data: any, sensitiveMap: any): any {
  if (sensitiveMap === true) return '***';
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item, i) =>
      maskSensitive(item, sensitiveMap?.[i] ?? false)
    );
  }

  const result: any = {};
  for (const key of Object.keys(data)) {
    const isSensitive =
      typeof sensitiveMap === 'object' &&
      sensitiveMap !== null &&
      sensitiveMap[key] === true;

    result[key] = isSensitive
      ? '***'
      : maskSensitive(data[key], sensitiveMap?.[key]);
  }
  return result;
}

function renderSide(main: any, other: any, mainSensitive: any, otherSensitive: any, mainIs: string) {
  if (main === null && mainIs === "after") return '<span class="added">— deleted —</span>';
  if (main === null && mainIs === "before") return '<span class="removed">— created —</span>';

  const safeMain = maskSensitive(main || {}, mainSensitive || {});
  const safeOther = maskSensitive(other || {}, otherSensitive || {});

  const allKeys = Array.from(new Set([
    ...Object.keys(safeMain),
    ...Object.keys(safeOther)
  ]));

  const lines = allKeys.map(key => {
    const inMain = key in safeMain;
    const inOther = key in safeOther;
    const val = JSON.stringify(safeMain[key], null, 2);
    const otherVal = JSON.stringify(safeOther[key], null, 2);
    if (!inMain && mainIs === "after") {
      // key was added — highlight in after panel
      return `<span class="line added">"${key}": ${val}</span>`;
    } else if (!inOther && mainIs === "before") {
      // key was removed — highlight in before panel
      return `<span class="line removed">"${key}": ${val}</span>`;
    } else if (inMain && inOther && val !== otherVal) {
      // key changed — highlight in both panels
      return `<span class="line changed">"${key}": ${val}</span>`;
    } else if (!inMain) {
      // key doesn't exist on this side — skip
      return null;
    } else {
      return `<span class="line">"${key}": ${val}</span>`;
    }
  }).filter(Boolean);

  return lines.join(",<br />");
}