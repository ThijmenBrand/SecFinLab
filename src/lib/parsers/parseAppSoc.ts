import type { AspmResultFile, Finding } from "../types/uploadTypes";

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

export const parseAppSoc = (fileName: string, text: string): AspmResultFile => {
  const parsed: appSocFindings = JSON.parse(text);
  console.log("AppSoc Raw Parsed Data:", parsed);
  const findings: Finding[] = parsed.data.map((finding) => ({
    ruleId: "unknown-rule-id",
    vulnName: finding.name,
    vulnPath: finding.sourceFiles[0]?.path || "unknown-path",
    vulnLine: finding.sourceFiles[0]?.line,
  }));

  const aspmParsedFindings: AspmResultFile = {
    id: `aspm-result-${Date.now()}`,
    parser: "AppSoc",
    name: fileName,
    parsed: {
      results: findings,
    },
  };

  return aspmParsedFindings;
};
