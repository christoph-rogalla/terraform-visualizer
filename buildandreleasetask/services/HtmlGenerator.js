"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsdom_1 = require("jsdom");
const TerraformPlan_js_1 = require("./TerraformPlan.js");
const dom = new jsdom_1.JSDOM(`<!DOCTYPE html><html><body></body></html>`);
const document = dom.window.document;
class HtmlGenerator {
    styleElement = document.createElement("style");
    headerElement = document.createElement("h1");
    sectionsDetailsWrapperElement = document.createElement("div");
    generateHtmlFrom(changes) {
        console.log("Generating HTML...");
        this.createStyleElement();
        this.createHeader();
        this.createList(TerraformPlan_js_1.ActionType.CREATE, changes);
        this.createList(TerraformPlan_js_1.ActionType.DELETE, changes);
        this.createList(TerraformPlan_js_1.ActionType.REPLACE, changes);
        return this.serialize();
    }
    serialize() {
        console.log("Writing HTML to file...");
        document.head.appendChild(this.styleElement);
        document.body.appendChild(this.headerElement);
        document.body.appendChild(this.sectionsDetailsWrapperElement);
        return dom.serialize();
    }
    createHeader() {
        const title = document.createElement("h1");
        title.textContent = "Terraform Plan Summary";
    }
    createList(action, changes) {
        let filtered = changes.filter(change => change.change.actions.includes(action));
        const section = document.createElement("details");
        section.className = action.toLowerCase();
        section.open = false;
        const summary = document.createElement("summary");
        summary.textContent = `${action.toLowerCase()} (${filtered.length})`;
        section.appendChild(summary);
        const list = document.createElement("ul");
        if (filtered.length === 0) {
            const li = document.createElement("li");
            li.textContent = "No resources";
            list.appendChild(li);
        }
        else {
            filtered.forEach(item => {
                const li = document.createElement("li");
                li.textContent = item.address;
                list.appendChild(li);
            });
        }
        section.appendChild(list);
        this.sectionsDetailsWrapperElement.appendChild(section);
    }
    createStyleElement() {
        this.styleElement.textContent = `
      body { font-family: Arial, sans-serif; margin: 2rem; }
      summary { cursor: pointer; font-weight: bold; margin-top: 1em; }
      ul { margin-left: 1.5em; }
      .created summary { color: green; }
      .changed summary { color: orange; }
      .unchanged summary { color: gray; }
      details { border: 1px solid #ccc; border-radius: 8px; padding: .5em 1em; margin-bottom: 1em; background: #f9f9f9; }
  `;
    }
}
exports.default = HtmlGenerator;
