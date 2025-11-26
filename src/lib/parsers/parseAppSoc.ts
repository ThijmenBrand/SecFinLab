import type { AspmResultFile } from "../types/uploadTypes";

type appSocFindings = {
  data: {
    name: string;
    cvss: string;
    epss: string;
    partOfCisaKev: boolean;
    sourceFiles: {
      path: string;
      line: string;
    }[];
  }[];
};

export const parseAppSoc = (text: string) => {
  const parsed: appSocFindings = JSON.parse(text);
  console.log("AppSoc Raw Parsed Data:", parsed);
  const findings = parsed.data.map((finding) => ({
    vulnName: finding.name,
    vulnPath: finding.sourceFiles[0]?.path || "unknown-path",
    vulnLine: finding.sourceFiles[0]?.line,
  }));

  console.log("AppSoc Mapped Findings:", findings);

  const aspmParsedFindings: AspmResultFile = {
    id: `test`,
    name: `test`,
    parsed: {
      results: findings,
    },
  };

  console.log("AppSoc Parsed Findings:", aspmParsedFindings);

  return aspmParsedFindings;
};
