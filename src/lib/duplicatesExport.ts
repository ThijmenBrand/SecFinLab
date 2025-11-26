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
    const sourceFile = findingFiles.find((f) => f.id === dup.sourceFileId);
    if (!sourceFile || !sourceFile.parsed) {
      throw new Error("Source file not found for duplicate");
    }

    const finding = sourceFile.parsed[dup.sourceVulnIndex];
    const dupeFile = findingFiles.find((f) => f.id === dup.duplicateFileId);
    if (!dupeFile || !dupeFile.parsed) {
      throw new Error("Duplicate file not found for duplicate");
    }

    const dupeFinding = dupeFile.parsed[dup.duplicateVulnIndex];

    if (!finding || !dupeFinding) {
      throw new Error("Finding not found for duplicate");
    }

    return [finding, dupeFinding];
  });

  const genericFindings: Finding[] = [];
  // Collect all findings that were not marked as duplicates
  findingFiles.forEach((file) => {
    file.parsed?.forEach((finding: Finding) => {
      const isInDuplicates = duplicateGroups.some((group) =>
        group.some(
          (f) =>
            f.vulnPath === finding.vulnPath &&
            f.vulnLine === finding.vulnLine &&
            f.vulnName === finding.vulnName
        )
      );
      if (!isInDuplicates) {
        genericFindings.push(finding);
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
