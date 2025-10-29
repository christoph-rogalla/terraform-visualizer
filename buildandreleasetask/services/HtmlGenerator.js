"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const handlebars_1 = __importDefault(require("handlebars"));
class HtmlGenerator {
    generateHtmlFrom(changes, template) {
        console.log("Generating HTML...");
        this.registerLogicFunctions();
        this.registerVisualisationFunctions();
        let compiledTemplate = handlebars_1.default.compile(template);
        return compiledTemplate({ changes });
    }
    registerVisualisationFunctions() {
        handlebars_1.default.registerHelper("json", (context) => JSON.stringify(context, null, 2));
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
        handlebars_1.default.registerHelper('highlightChanges', (before, after) => {
            before = before || {};
            after = after || {};
            const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
            const parts = allKeys.map(k => {
                const b = JSON.stringify(before[k], null, 2);
                const a = JSON.stringify(after[k], null, 2);
                if (!(k in before)) {
                    // Added key
                    return `<span class="bg-green-100 text-green-800 font-semibold">"${k}": ${a}</span>`;
                }
                else if (!(k in after)) {
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
    registerLogicFunctions() {
        handlebars_1.default.registerHelper('eq', (a, b) => a === b);
        handlebars_1.default.registerHelper('ne', (a, b) => a !== b);
        handlebars_1.default.registerHelper('gt', (a, b) => a > b);
        handlebars_1.default.registerHelper('lt', (a, b) => a < b);
        handlebars_1.default.registerHelper('gte', (a, b) => a >= b);
        handlebars_1.default.registerHelper('lte', (a, b) => a <= b);
        handlebars_1.default.registerHelper('and', () => Array.prototype.slice.call(arguments, 0, -1).every(Boolean));
        handlebars_1.default.registerHelper('or', () => Array.prototype.slice.call(arguments, 0, -1).some(Boolean));
        handlebars_1.default.registerHelper('not', (value) => !value);
    }
}
exports.default = HtmlGenerator;
