import type { SarifLocation, SarifResult, SarifRun } from "../types/sarif";
import type { Finding } from "../types/uploadTypes";

export const parseSarif = (
  text: string
): { parsed: Finding[]; findingsCount: number } => {
  try {
    const json = JSON.parse(text);
    const findings: Finding[] = [];

    if (!(json.runs && Array.isArray(json.runs))) {
      return { parsed: [], findingsCount: 0 };
    }

    json.runs.forEach((run: SarifRun) => {
      if (!(run.results && Array.isArray(run.results))) {
        return;
      }

      if (run.results.length === 0) {
        return;
      }

      run.results.forEach((result: SarifResult) => {
        const ruleId = result.ruleId;
        const vulnName = result.message?.text || "Unnamed Vulnerability";
        const locations = result.locations || [];
        locations.forEach((location: SarifLocation) => {
          const physicalLocation = location.physicalLocation;
          if (physicalLocation) {
            const vulnPath =
              physicalLocation.artifactLocation?.uri || "unknown-path";
            const vulnLine = physicalLocation.region?.startLine || "0";

            findings.push({
              ruleId,
              vulnName,
              vulnPath,
              vulnLine,
            });
          }
        });
      });
    });

    return { parsed: findings, findingsCount: findings.length };
  } catch {
    return { parsed: [], findingsCount: 0 };
  }
};
