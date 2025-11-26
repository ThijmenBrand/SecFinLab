import type { AspmParser } from "../types/aspmParser";
import type { AspmResultFile } from "../types/uploadTypes";
import { parseAppSoc } from "./parseAppSoc";

export const parseAspmResults = (
  fileName: string,
  text: string
): AspmResultFile => {
  const targetParser = determineAspmParser(fileName);
  return targetParser.parse(fileName, text);
};

const determineAspmParser = (fileName: string): AspmParser => {
  const fileParts = fileName.split(".");
  const aspmName = fileParts[0].toLowerCase();

  switch (aspmName) {
    case "appsoc":
      return {
        name: "AppSoc",
        parse: parseAppSoc,
      };
    // Future ASPM parsers can be added here
    default:
      throw new Error(`Unsupported ASPM tool: ${aspmName}`);
  }
};
