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

  console.log("GT Duplicates:", gtDuplicates);
  console.log("ASPM Findings:", aspmFindings);

  // track which ASPM finding indicies have already been matched to avoid double counting
  const usedIndices = new Set<number>();

  // Go over each group of duplicates in the ground truth
  for (const duplicateGroup of gtDuplicates) {
    // Check how many findings from this group are present in the ASPM results
    let foundCount = 0;

    for (const gtFinding of duplicateGroup) {
      const index = aspmFindings.findIndex(
        (aspmFinding, idx) =>
          aspmFinding.vulnName == gtFinding.ruleId && !usedIndices.has(idx) // ensure this finding hasn't been used yet
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
    const found = aspmFindings.some((aspmFinding) => {
      return (
        aspmFinding.vulnName === gtFinding.ruleId.match(/CVE-\d{4}-\d+/)?.[0]
      );
    });

    // If the generic finding is not found in the ASPM results, it means it was marked as duplicate incorrectly
    if (!found) {
      fpCount += 1;
    }
  }

  return fpCount;
};

/**
 * False negatives. These are duplicate findings that were not marked as duplicates in the ASPM results.
 * These findings exist in the ground truth under the "duplicates" field. and must exist only once in the ASPM results.
 * If more then one finding from a duplicate group exists in the ASPM results, it counts as a false negative.
 **/
export const falseNegatives = (
  groundTruth: GroundTruthFile,
  aspmResults: AspmResultFile
) => {
  let fnCount = 0;
  const gtDuplicates = groundTruth.parsed.duplicates;
  const aspmFindings = aspmResults.parsed.results;

  const ruleIdToCve = (ruleId?: string) => ruleId?.match(/CVE-\d{4}-\d+/)?.[0];

  // Go over each group of duplicates in the ground truth
  for (const duplicateGroup of gtDuplicates) {
    // track which ASPM finding indices have been matched for THIS group
    const matchedIndices = new Set<number>();

    // Count how many UNIQUE ASPM findings correspond to members of this duplicate group
    let uniqueMatches = 0;

    for (const gtFinding of duplicateGroup) {
      const cve = ruleIdToCve(gtFinding.ruleId);

      const idx = aspmFindings.findIndex((aspmFinding, i) => {
        if (matchedIndices.has(i)) return false; // already matched for this group
        // use the same matching heuristic you used elsewhere
        if (cve) {
          if (aspmFinding.vulnName === cve) {
            return true;
          }
          return false;
        }
        // fallback matching by vulnPath & vulnName if available
        return (
          aspmFinding.vulnPath === gtFinding.vulnPath &&
          aspmFinding.vulnName === gtFinding.vulnName
        );
      });

      if (idx > -1) {
        matchedIndices.add(idx);
        uniqueMatches += 1;
      }
    }

    // If more than one UNIQUE matching finding is present, it's a false negative for that group
    if (uniqueMatches > 1) {
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

  return tp / (tp + fp);
}

/**
 * Recall: TP / (TP + FN)
 **/
export function recall(tp: number, fn: number) {
  if (tp + fn === 0) return 0;

  return tp / (tp + fn);
}

/**
 * F1 Score: 2 * (Precision * Recall) / (Precision + Recall)
 **/
export function f1Score(precision: number, recall: number) {
  if (precision + recall === 0) return 0;

  return (2 * precision * recall) / (precision + recall);
}
