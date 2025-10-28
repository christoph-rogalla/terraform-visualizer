"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
class HtmlFileExporter {
    export(html, outputFilePath) {
        console.log("Writing HTML to file...");
        (0, fs_1.writeFileSync)(outputFilePath, html);
    }
}
exports.default = HtmlFileExporter;
