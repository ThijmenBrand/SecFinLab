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
  const findings = parsed.data.map((finding) => ({
    vulnName: finding.name,
    vulnPath: finding.sourceFiles[0]?.path || "unknown-path",
    vulnLine: finding.sourceFiles[0]?.line,
  }));

  const aspmParsedFindings: AspmResultFile = {
    id: `appsoc-aspm-${Date.now()}`,
    name: `appsoc-aspm-${Date.now()}.json`,
    parsed: {
      results: findings,
    },
  };

  return aspmParsedFindings;
};
