"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const handlebars_1 = __importDefault(require("handlebars"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class HtmlGenerator {
    generateHtmlFrom(changes) {
        console.log("Generating HTML...");
        this.registerLogicFunctions();
        this.registerVisualisationFunctions();
        const templatePath = path_1.default.join(__dirname, "..", "templates", "template.hbs");
        const template = fs_1.default.readFileSync(templatePath, "utf8");
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
        handlebars_1.default.registerHelper('diffHighlight', function (before, after, mode) {
            const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            before = before || {};
            after = after || {};
            // Collect top-level keys
            const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
            const render = (obj) => {
                const parts = allKeys.map(k => {
                    const b = before[k];
                    const a = after[k];
                    const keyHtml = `"${escapeHtml(k)}": `;
                    const val = obj[k] !== undefined ? JSON.stringify(obj[k], null, 2) : 'undefined';
                    if (mode === 'after') {
                        if (!(k in before)) {
                            return `<span class="diff-added font-bold text-green-700">${keyHtml}${escapeHtml(val)}</span>`;
                        }
                        if (!(k in after)) {
                            return `<span class="diff-removed line-through text-red-600 opacity-80">${keyHtml}${escapeHtml(JSON.stringify(b, null, 2))}</span>`;
                        }
                        if (JSON.stringify(b) !== JSON.stringify(a)) {
                            return `<span class="diff-added font-bold text-green-700">${keyHtml}${escapeHtml(val)}</span>`;
                        }
                    }
                    return `${keyHtml}${escapeHtml(val)}`;
                });
                return `{${parts.length ? '<br>' + parts.join(',<br>') + '<br>' : ''}}`;
            };
            const html = `<pre class="${mode === 'after' ? 'after-diff' : 'before-diff'}">${render(mode === 'after' ? after : before)}</pre>`;
            return new handlebars_1.default.SafeString(html);
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
