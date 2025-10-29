import {ResourceChanges} from "./TerraformPlan.js";
import handlebars from "handlebars";
import fs from "fs";

export default class HtmlGenerator {

  generateHtmlFrom(changes: ResourceChanges[]) {
    console.log(changes[1].change)
    console.log("Generating HTML...");
    handlebars.registerHelper("json", (context) => JSON.stringify(context, null, 2));
    handlebars.registerHelper("eq", (a, b) => a === b);
    handlebars.registerHelper('eq', function (a, b) {
      return a === b;
    });

    handlebars.registerHelper('ne', function (a, b) {
      return a !== b;
    });

    handlebars.registerHelper('gt', function (a, b) {
      return a > b;
    });

    handlebars.registerHelper('lt', function (a, b) {
      return a < b;
    });

    handlebars.registerHelper('gte', function (a, b) {
      return a >= b;
    });

    handlebars.registerHelper('lte', function (a, b) {
      return a <= b;
    });
    handlebars.registerHelper('and', function () {
      return Array.prototype.every.call(arguments, Boolean);
    });

    handlebars.registerHelper('or', function () {
      // Handlebars passes an extra options argument as the last parameter
      return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
    });

    handlebars.registerHelper('not', function (value) {
      return !value;
    });
    handlebars.registerHelper('groupByAction', function (changes: ResourceChanges[]) {
      const grouped: any = {};
      changes.forEach(change => {
        const actions = change.change.actions || [];
        actions.forEach(action => {
          const key = action.toLowerCase();
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(change);
        });
      });
      // Ensure "read" appears even if empty, for consistent grouping
      ['create', 'update', 'delete', 'read'].forEach(k => {
        if (!grouped[k]) grouped[k] = [];
      });
      return grouped;
    });

    handlebars.registerHelper('diffHighlight', function (before: any, after: any, mode: 'before' | 'after') {
      const escapeHtml = (s: any) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      before = before || {};
      after = after || {};

      const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

      const render = (obj: any) => {
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
      return new handlebars.SafeString(html);
    });


    const template = fs.readFileSync("templates/template.hbs", "utf8");
    let compiledTemplate = handlebars.compile(template);
    return compiledTemplate({changes});
  }
}