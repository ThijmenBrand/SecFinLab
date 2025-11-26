import type { AspmResultFile, GroundTruthFile } from "./types/uploadTypes";

/** True positives. The the findings that were correctly identified as duplicates.
 *  The findings are in the ground truth under the "duplcates" field.
 *  These findings should then be consolodated into one finding in the ASPM results.
 *  If only one of the findings from this group exists in the ASPM result, it counts as a true positive.
 **/

export const truePositives = (
  groundTruth: GroundTruthFile,
  aspmResults: AspmResultFile
) => {
  let tpCount = 0;
  const gtDuplicates = groundTruth.parsed.duplicates;
  const aspmFindings = aspmResults.parsed.results;

  // track which ASPM finding indicies have already been matched to avoid double counting
  const usedIndices = new Set<number>();

  // Go over each group of duplicates in the ground truth
  for (const duplicateGroup of gtDuplicates) {
    // Check how many findings from this group are present in the ASPM results
    let foundCount = 0;

    for (const gtFinding of duplicateGroup) {
      const index = aspmFindings.findIndex(
        (aspmFinding, idx) =>
          aspmFinding.vulnPath === gtFinding.vulnPath &&
          aspmFinding.vulnName === gtFinding.vulnName &&
          !usedIndices.has(idx) // ensure this finding hasn't been used yet
      );

      if (index > -1) {
        foundCount += 1;
        usedIndices.add(index); // mark this finding as used
      }
    }

    // If more than one finding is found from this group, it means some duplicates were missed
    if (foundCount === 1) {
      tpCount += 1;
    }
  }

  return tpCount;
};

/**
 * False positives. These are findings that were marked as duplicates in the ASPM results, but are not duplicates according to the ground truth.
 * These findings should exist in the ground truth under the "generic" field.
 * If there is a finding in the generic findings that is not in the ASPM results, it counts as a false positive.
 **/
export const falsePositives = (
  groundTruth: GroundTruthFile,
  aspmResults: AspmResultFile
) => {
  let fpCount = 0;
  const gtGenericFindings = groundTruth.parsed.generic;
  const aspmFindings = aspmResults.parsed.results;

  // Go over each generic finding in the ground truth
  for (const gtFinding of gtGenericFindings) {
    const found = aspmFindings.some(
      (aspmFinding) =>
        aspmFinding.vulnPath === gtFinding.vulnPath &&
        aspmFinding.vulnName === gtFinding.vulnName
    );

    // If the generic finding is not found in the ASPM results, it means it was marked as duplicate incorrectly
    if (!found) {
      fpCount += 1;
    }
  }

  return fpCount;
};

/**
 * False negatives. These are duplicate findings that were not marked as duplicates in the ASPM results.
 * These findings exists in the ground truth under the "duplicates" field.
 * If more than one finding from a duplicate group exists in the ASPM results, it counts as a false negative.
 **/
export const falseNegatives = (
  groundTruth: GroundTruthFile,
  aspmResults: AspmResultFile
) => {
  let fnCount = 0;
  const gtDuplicates = groundTruth.parsed.duplicates;
  const aspmFindings = aspmResults.parsed.results;

  // Go over each group of duplicates in the ground truth
  for (const duplicateGroup of gtDuplicates) {
    // Check how many findings from this group are present in the ASPM results
    const foundCount = duplicateGroup.reduce((count, gtFinding) => {
      const found = aspmFindings.some(
        (aspmFinding) =>
          aspmFinding.vulnPath === gtFinding.vulnPath &&
          aspmFinding.vulnName === gtFinding.vulnName
      );
      return found ? count + 1 : count;
    }, 0);

    // If more than one finding is found from this group, it means some duplicates were missed
    if (foundCount > 1) {
      fnCount += 1;
    }
  }

  return fnCount;
};

/**
 * Precision: TP / (TP + FP)
 **/
export function precision(tp: number, fp: number) {
  if (tp + fp === 0) return 0;

  console.log("TP:", tp, "FP:", fp);

  return tp / (tp + fp);
}

/**
 * Recall: TP / (TP + FN)
 **/
export function recall(tp: number, fn: number) {
  if (tp + fn === 0) return 0;

  console.log("TP:", tp, "FN:", fn);

  return tp / (tp + fn);
}

/**
 * F1 Score: 2 * (Precision * Recall) / (Precision + Recall)
 **/
export function f1Score(precision: number, recall: number) {
  if (precision + recall === 0) return 0;

  console.log("Precision:", precision, "Recall:", recall);

  return (2 * precision * recall) / (precision + recall);
}
