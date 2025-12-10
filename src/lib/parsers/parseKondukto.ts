import { getCve } from "../getCve";
import type { AspmResultFile, Finding } from "../types/uploadTypes";

export const parseKondukto = (
  fileName: string,
  text: string
): AspmResultFile => {
  // text is in CSV format
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  console.log("Kondukto Raw Parsed Data:", lines);

  const findings: Finding[] = lines.slice(1).map((line) => {
    const finding = line.split(";");
    const id = finding[1];
    const name = getCve(finding[2]) || "Unknown Vulnerability";
    return {
      ruleId: id,
      vulnName: name,
      vulnPath: "unknown-path",
      vulnLine: "unknown-line",
    };
  });

  const aspmParsedFindings: AspmResultFile = {
    id: `aspm-result-${Date.now()}`,
    parser: "Kondukto",
    name: fileName,
    parsed: {
      results: findings,
    },
  };

  return aspmParsedFindings;
};
