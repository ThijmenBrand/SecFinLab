import type { DuplicateType } from "./types/duplicate";

export const combinationCovered = (
  duplicates: DuplicateType[],
  sourceFileId: string,
  sourceVulnIndex: number,
  comparisonFileId: string,
  comparisonVulnIndex: number
) => {
  return duplicates.some(
    (dup) =>
      dup.sourceFileId === sourceFileId &&
      dup.sourceVulnIndex === sourceVulnIndex &&
      dup.duplicateFileId === comparisonFileId &&
      dup.duplicateVulnIndex === comparisonVulnIndex
  );
};
