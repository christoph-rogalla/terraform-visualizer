"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
class TemplateBuilder {
    build(changes) {
        // templates
        const partialsDir = path_1.default.join(__dirname, '..', 'templates', 'partials');
        const mainTemplatePath = path_1.default.join(__dirname, '..', 'templates', 'main.hbs');
        // read partial templates and register them
        fs_1.default.readdirSync(partialsDir)
            .filter(f => f.endsWith('.hbs'))
            .forEach(f => {
            const name = path_1.default.basename(f, '.hbs');
            const content = fs_1.default.readFileSync(path_1.default.join(partialsDir, f), 'utf8');
            handlebars_1.default.registerPartial(name, content);
        });
        // compile main template
        const mainTemplate = fs_1.default.readFileSync(mainTemplatePath, 'utf8');
        const template = handlebars_1.default.compile(mainTemplate);
        return template({ changes });
    }
}
exports.default = TemplateBuilder;
