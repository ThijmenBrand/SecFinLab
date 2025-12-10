import type { GroundTruthFile } from "../types/uploadTypes";

export const parseGroundTruth = (
  fileName: string,
  text: string
): GroundTruthFile => {
  try {
    return JSON.parse(text) as GroundTruthFile;
  } catch (err) {
    throw new Error(`Failed to parse ground truth file ${fileName}: ${err}`);
  }
};
