import {ResourceChanges} from "./TerraformPlan.js";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";

export default class HtmlGenerator {

  generateHtmlFrom(changes: ResourceChanges[]) {
    console.log("Generating HTML...");
    this.registerLogicFunctions();
    this.registerVisualisationFunctions();
    const templatePath = path.join(__dirname, "..", "templates", "template.hbs");
    const template = fs.readFileSync(templatePath, "utf8");
    let compiledTemplate = handlebars.compile(template);
    return compiledTemplate({changes});
  }

  private registerVisualisationFunctions() {
    handlebars.registerHelper("json", (context) => JSON.stringify(context, null, 2));
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
    handlebars.registerHelper('diffHighlight', function (before: any, after: any, mode: 'before' | 'after') {
      const escapeHtml = (s: any) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      before = before || {};
      after = after || {};

      // Collect top-level keys
      const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

      const render = (obj: any) => {
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
      return new handlebars.SafeString(html);
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
}