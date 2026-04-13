import fs from 'fs';
import path from 'path';
import {ResourceChanges} from "./TerraformPlan";
import handlebars from "handlebars";

export default class TemplateBuilder {
  build(changes: ResourceChanges[]) {
    // templates
    const partialsDir = path.join(__dirname, '..', 'templates', 'partials');
    const mainTemplatePath = path.join(__dirname, '..', 'templates', 'main.hbs');

    // read partial templates and register them
    fs.readdirSync(partialsDir)
      .filter(f => f.endsWith('.hbs'))
      .forEach(f => {
        const name = path.basename(f, '.hbs');
        const content = fs.readFileSync(path.join(partialsDir, f), 'utf8');
        handlebars.registerPartial(name, content);
      });

    // compile main template
    const mainTemplate = fs.readFileSync(mainTemplatePath, 'utf8');
    const template = handlebars.compile(mainTemplate);
    return template({ changes });
  }
}