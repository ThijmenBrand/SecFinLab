import { useMemo, useState } from "react";
import { combinationCovered } from "../lib/labeling";
import type { DuplicateType } from "../lib/types/duplicate";
import type { UploadedSarif } from "../lib/types/uploadTypes";
import FindingFileBox from "./FindingFileBox";

interface VulnMatchModeProps {
  files: UploadedSarif[];
  duplicates?: DuplicateType[];
  markDuplicate: (
    sourceFileId: string,
    sourceVulnIndex: number,
    comparisonFileId: string,
    comparisonVulnIndex: number
  ) => void;
  removeDuplicate: (
    sourceFileId: string,
    sourceVulnIndex: number,
    comparisonFileId: string,
    comparisonVulnIndex: number
  ) => void;
}

export default function VulnMatchMode({
  files = [],
  duplicates = [],
  markDuplicate,
  removeDuplicate,
}: VulnMatchModeProps) {
  // Implementation of VulnMatchMode component goes here
  const [currentComparisonIndex] = useState(0);
  const [currentComparisonVulnIndex, setCurrentComparisonVulnIndex] =
    useState(0);
  const [currentSourceVulnIndex, setCurrentSourceVulnIndex] = useState(0);
  const sourceFile = useMemo(() => files[0] ?? null, [files]);
  const comparisonFiles = files.slice(1);
  const currentComparisonFile = comparisonFiles[currentComparisonIndex] ?? null;

  const stepVuln = (
    delta: number,
    max: number,
    setter: React.Dispatch<React.SetStateAction<number>>
  ) => {
    setter((prev) => {
      let next = prev + delta;
      if (next < 0) next = max - 1;
      if (next > max - 1) next = 0;
      return next;
    });
  };

  return (
    <div className="mb-4">
      <div>
        {combinationCovered(
          duplicates,
          sourceFile?.id ?? "",
          currentSourceVulnIndex,
          currentComparisonFile?.id ?? "",
          currentComparisonVulnIndex
        ) ? (
          <button
            className="bg-red-500 hover:bg-red-300 text-white py-1 px-3 rounded cursor-pointer"
            onClick={() =>
              removeDuplicate(
                sourceFile?.id ?? "",
                currentSourceVulnIndex,
                currentComparisonFile?.id ?? "",
                currentComparisonVulnIndex
              )
            }
          >
            Remove duplicate mark
          </button>
        ) : (
          <button
            className="bg-blue-500 hover:bg-blue-300 text-white py-1 px-3 rounded mb-4 cursor-pointer"
            onClick={() =>
              markDuplicate(
                sourceFile?.id ?? "",
                currentSourceVulnIndex,
                currentComparisonFile?.id ?? "",
                currentComparisonVulnIndex
              )
            }
          >
            Mark duplicate
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FindingFileBox
          fileIn={sourceFile}
          vulnIndex={currentSourceVulnIndex}
          stepVuln={(delta: number, max: number) =>
            stepVuln(delta, max, setCurrentSourceVulnIndex)
          }
        />
        <FindingFileBox
          fileIn={currentComparisonFile}
          vulnIndex={currentComparisonVulnIndex}
          stepVuln={(delta: number, max: number) =>
            stepVuln(delta, max, setCurrentComparisonVulnIndex)
          }
        />
      </div>
    </div>
  );
}
