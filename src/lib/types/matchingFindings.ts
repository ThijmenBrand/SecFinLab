import type { Finding } from "./uploadTypes";

export type FindingInMatchingFile = {
  fileId: string;
  fileName: string;
  findingIndex: number;
  finding: Finding;
};

export type FindingInMatchingCVE = {
  fileId: string;
  findingIndex: number;
  cveId: string;
  finding: Finding;
};
