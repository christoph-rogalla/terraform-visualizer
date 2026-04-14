"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerVisualisationFunctions = registerVisualisationFunctions;
const handlebars_1 = __importDefault(require("handlebars"));
function registerVisualisationFunctions() {
    registerGroupByAction();
    registerRendersChanges();
    registerTruncate();
}
function registerGroupByAction() {
    handlebars_1.default.registerHelper('groupByAction', (changes) => {
        const grouped = {};
        changes.forEach(change => {
            const actions = change.change.actions || [];
            actions.forEach(action => {
                const key = action.toLowerCase();
                if (!grouped[key])
                    grouped[key] = [];
                grouped[key].push(change);
            });
        });
        ['create', 'update', 'delete', 'read'].forEach(k => {
            if (!grouped[k])
                grouped[k] = [];
        });
        return grouped;
    });
}
function registerRendersChanges() {
    handlebars_1.default.registerHelper("renderBefore", (before, after, beforeSensitive, afterSensitive) => {
        return new handlebars_1.default.SafeString(renderSide(before, after, beforeSensitive, afterSensitive, "before"));
    });
    handlebars_1.default.registerHelper("renderAfter", (before, after, beforeSensitive, afterSensitive) => {
        return new handlebars_1.default.SafeString(renderSide(after, before, afterSensitive, beforeSensitive, "after"));
    });
}
function registerTruncate() {
    handlebars_1.default.registerHelper("truncate", (str, len) => {
        if (!str)
            return "";
        return str.length > len ? str.slice(0, len) + "…" : str;
    });
}
function maskSensitive(data, sensitiveMap) {
    if (sensitiveMap === true)
        return '***';
    if (!data || typeof data !== 'object')
        return data;
    if (Array.isArray(data)) {
        return data.map((item, i) => maskSensitive(item, sensitiveMap?.[i] ?? false));
    }
    const result = {};
    for (const key of Object.keys(data)) {
        const isSensitive = typeof sensitiveMap === 'object' &&
            sensitiveMap !== null &&
            sensitiveMap[key] === true;
        result[key] = isSensitive
            ? '***'
            : maskSensitive(data[key], sensitiveMap?.[key]);
    }
    return result;
}
function renderSide(main, other, mainSensitive, otherSensitive, mainIs) {
    if (main === null && mainIs === "after")
        return '<span class="added">— deleted —</span>';
    if (main === null && mainIs === "before")
        return '<span class="removed">— created —</span>';
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
        }
        else if (!inOther && mainIs === "before") {
            // key was removed — highlight in before panel
            return `<span class="line removed">"${key}": ${val}</span>`;
        }
        else if (inMain && inOther && val !== otherVal) {
            // key changed — highlight in both panels
            return `<span class="line changed">"${key}": ${val}</span>`;
        }
        else if (!inMain) {
            // key doesn't exist on this side — skip
            return null;
        }
        else {
            return `<span class="line">"${key}": ${val}</span>`;
        }
    }).filter(Boolean);
    if (safeMain["id"] == "https://kv-rhegpt-01-dev.vault.azure.net/secrets/sql-database-connection-string/ea73ed2e5fe64d84944ecca7a7d23ecb") {
        console.log(lines);
        console.log(lines.join(",<br />"));
    }
    return lines.join(",<br />");
}
