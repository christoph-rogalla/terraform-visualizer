"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerVisualisationFunctions = registerVisualisationFunctions;
const handlebars_1 = __importDefault(require("handlebars"));
function registerVisualisationFunctions() {
    registerJsonMasking();
    registerGroupByAction();
    registerHighlightChanges();
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
function registerHighlightChanges() {
    handlebars_1.default.registerHelper('highlightChanges', (before, after, beforeSensitive, afterSensitive) => {
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
            }
            else if (!(k in safeAfter)) {
                // Removed key
                return `<span class="bg-red-100 text-red-800 line-through font-semibold">"${k}": ${b}</span>`;
            }
            else if (b !== a) {
                // Modified key
                return `<span class="bg-yellow-100 text-yellow-800 font-semibold">"${k}": ${a}</span>`;
            }
            else {
                // Unchanged
                return `"${k}": ${a}`;
            }
        });
        return new handlebars_1.default.SafeString(`{<br>${parts.join(',<br>')}<br>}`);
    });
}
function registerJsonMasking() {
    handlebars_1.default.registerHelper("safeJsonWithSensitiveFlags", (obj, sensitiveMap) => {
        try {
            const masked = maskSensitive(obj, sensitiveMap);
            return JSON.stringify(masked, null, 2);
        }
        catch (e) {
            return "[Error rendering object]";
        }
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
