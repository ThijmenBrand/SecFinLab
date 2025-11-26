import type { AspmResultFile } from "./uploadTypes";

export type AspmParser = {
  name: string;
  parse: (fileName: string, text: string) => AspmResultFile;
};
