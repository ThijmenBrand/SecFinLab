import type { Finding } from "./uploadTypes";

export type FindingInMatchingFile = {
  fileId: string;
  fileName: string;
  findingIndex: number;
  finding: Finding;
};
