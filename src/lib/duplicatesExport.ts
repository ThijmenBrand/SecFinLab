/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DuplicateType } from "./types/duplicate";
import type {
  Finding,
  GroundTruthFile,
  UploadedSarif,
} from "./types/uploadTypes";

export function exportGroundTruth(
  duplicates: DuplicateType[],
  findingFiles: UploadedSarif[]
) {
  // Get the duplicates from the findings files. Every duplicate group is an array of findings.
  const duplicateGroups: Finding[][] = duplicates.map((dup) => {
    // For a duplicate, get the finding details from the corresponding findings file
    console.log(findingFiles, dup);
    const sourceFile = findingFiles.find((f) => f.id === dup.sourceFileId);
    const finding = sourceFile?.parsed.runs[0].results[dup.sourceVulnIndex];
    const dupeFile = findingFiles.find((f) => f.id === dup.duplicateFileId);
    const dupeFinding =
      dupeFile?.parsed.runs[0].results[dup.duplicateVulnIndex];

    if (!finding || !dupeFinding) {
      throw new Error("Finding not found for duplicate");
    }

    return [
      {
        vulnPath: finding.locations[0].physicalLocation.artifactLocation.uri,
        vulnLine: finding.locations[0].physicalLocation.region.startLine,
        vulnName: finding.message.text,
      },
      {
        vulnPath:
          dupeFinding.locations[0].physicalLocation.artifactLocation.uri,
        vulnLine: dupeFinding.locations[0].physicalLocation.region.startLine,
        vulnName: dupeFinding.message.text,
      },
    ];
  });

  const genericFindings: Finding[] = [];
  // Collect all findings that were not marked as duplicates
  console.log("Finding files:", findingFiles);
  findingFiles.forEach((file) => {
    file.parsed.runs[0].results.forEach((finding: any) => {
      console.log("Checking finding:", finding);
      const isInDuplicates = duplicateGroups.some((group) =>
        group.some(
          (f) =>
            f.vulnPath ===
              finding.locations[0].physicalLocation.artifactLocation.uri &&
            f.vulnLine ===
              finding.locations[0].physicalLocation.region.startLine &&
            f.vulnName === finding.message.text
        )
      );
      console.log(finding.locations[0].physicalLocation);
      if (!isInDuplicates) {
        genericFindings.push({
          vulnPath: finding.locations[0].physicalLocation.artifactLocation.uri,
          vulnLine: finding.locations[0].physicalLocation.region.startLine,
          vulnName: finding.message.text,
        });
      }
    });
  });

  const groundTruthFile: GroundTruthFile = {
    id: `ground-truth-${Date.now()}`,
    name: `ground-truth-${Date.now()}.json`,
    parsed: {
      duplicates: duplicateGroups,
      generic: genericFindings,
    },
  };

  console.log("Exporting ground truth file:", groundTruthFile);

  return groundTruthFile;
}

export function exportJsonFile(fileName: string, data: unknown, pretty = true) {
  const json =
    typeof data === "string"
      ? data
      : JSON.stringify(data, null, pretty ? 2 : 0);

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
