import { writeFileSync } from "fs";
export default class HtmlFileExporter {
  export(html:string, outputFilePath:string) {
    console.log("Writing HTML to file...");
    writeFileSync(outputFilePath, html);
  }
}