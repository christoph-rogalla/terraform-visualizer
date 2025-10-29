"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const handlebars_1 = __importDefault(require("handlebars"));
const fs_1 = __importDefault(require("fs"));
class HtmlGenerator {
    generateHtmlFrom(changes) {
        console.log(changes[1].change);
        console.log("Generating HTML...");
        handlebars_1.default.registerHelper("json", (context) => JSON.stringify(context, null, 2));
        handlebars_1.default.registerHelper("eq", (a, b) => a === b);
        handlebars_1.default.registerHelper('eq', function (a, b) {
            return a === b;
        });
        handlebars_1.default.registerHelper('ne', function (a, b) {
            return a !== b;
        });
        handlebars_1.default.registerHelper('gt', function (a, b) {
            return a > b;
        });
        handlebars_1.default.registerHelper('lt', function (a, b) {
            return a < b;
        });
        handlebars_1.default.registerHelper('gte', function (a, b) {
            return a >= b;
        });
        handlebars_1.default.registerHelper('lte', function (a, b) {
            return a <= b;
        });
        handlebars_1.default.registerHelper('and', function () {
            return Array.prototype.every.call(arguments, Boolean);
        });
        handlebars_1.default.registerHelper('or', function () {
            // Handlebars passes an extra options argument as the last parameter
            return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
        });
        handlebars_1.default.registerHelper('not', function (value) {
            return !value;
        });
        handlebars_1.default.registerHelper('groupByAction', function (changes) {
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
            // Ensure "read" appears even if empty, for consistent grouping
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
            const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
            const render = (obj) => {
                const parts = allKeys.map(k => {
                    const b = before[k];
                    const a = after[k];
                    const keyHtml = `"${escapeHtml(k)}": `;
                    const val = obj[k] !== undefined ? JSON.stringify(obj[k], null, 2) : 'undefined';
                    if (mode === 'after') {
                        if (!(k in before)) {
                            // Added: bold + green text + subtle green background
                            return `<span class="diff-added font-bold bg-green-100 text-green-800 p-0.5 rounded">${keyHtml}${escapeHtml(val)}</span>`;
                        }
                        if (!(k in after)) {
                            return `<span class="diff-removed line-through text-red-600 opacity-80">${keyHtml}${escapeHtml(JSON.stringify(b, null, 2))}</span>`;
                        }
                        if (JSON.stringify(b) !== JSON.stringify(a)) {
                            return `<span class="diff-added font-bold bg-yellow-100 text-yellow-800 p-0.5 rounded">${keyHtml}${escapeHtml(val)}</span>`;
                        }
                    }
                    return `${keyHtml}${escapeHtml(val)}`;
                });
                return `{${parts.length ? '<br>' + parts.join(',<br>') + '<br>' : ''}}`;
            };
            const html = `<pre class="${mode === 'after' ? 'after-diff' : 'before-diff'}">${render(mode === 'after' ? after : before)}</pre>`;
            return new handlebars_1.default.SafeString(html);
        });
        const template = fs_1.default.readFileSync("templates/template.hbs", "utf8");
        let compiledTemplate = handlebars_1.default.compile(template);
        return compiledTemplate({ changes });
    }
}
exports.default = HtmlGenerator;
