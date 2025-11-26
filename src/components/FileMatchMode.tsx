import { useMemo } from "react";
import type { DuplicateType } from "../lib/types/duplicate";
import type { UploadedSarif } from "../lib/types/uploadTypes";
import type { FindingInMatchingFile } from "../lib/types/matchingFile";

interface FileMatchModeProps {
  files: UploadedSarif[];
  duplicatesIn: DuplicateType[];
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

export default function FileMatchMode({
  files = [],
  duplicatesIn = [],
  markDuplicate,
  removeDuplicate,
}: FileMatchModeProps) {
  // Create a multi-dimensional array. The first dimension represents each file, the seond dimension contains findings that have matching files in other uploads.
  const findingsWithMatchingFiles: FindingInMatchingFile[][] = useMemo(() => {
    if (!files || files.length === 0 || !Array.isArray(files[0].parsed)) {
      return [];
    }
    return (
      files[0].parsed?.map((finding, idx) => {
        const matchingFindings: FindingInMatchingFile[] = [
          {
            fileId: files[0].id,
            fileName: files[0].name,
            findingIndex: idx,
            finding: finding,
          },
        ];

        // go over the other files to find if the uri of this finding exists in their findings
        for (let i = 1; i < files.length; i++) {
          const otherFile = files[i];
          const match = otherFile.parsed?.find((otherFinding) => {
            return otherFinding.vulnPath === finding.vulnPath;
          });

          if (match) {
            matchingFindings.push({
              fileId: files[i].id,
              fileName: files[i].name,
              findingIndex: otherFile.parsed!.indexOf(match),
              finding: match,
            });
          }
        }

        return matchingFindings;
      }) ?? []
    );
  }, [files]);

  const combinationCovered = (
    sourceFileId: string,
    sourceVulnIndex: number,
    comparisonFileId: string,
    comparisonVulnIndex: number
  ) => {
    return duplicatesIn.some(
      (dup) =>
        dup.sourceFileId === sourceFileId &&
        dup.sourceVulnIndex === sourceVulnIndex &&
        dup.duplicateFileId === comparisonFileId &&
        dup.duplicateVulnIndex === comparisonVulnIndex
    );
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">File Match Mode</h2>
      <div className="space-y-6">
        {findingsWithMatchingFiles.map((matchingFindings, index) => (
          <div key={index} className="shadow bg-gray-100 p-3">
            <span>
              <p>File: {matchingFindings[0].finding.vulnPath}</p>
            </span>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p>
                  origin file:
                  <span className="font-bold">
                    {" "}
                    {matchingFindings[0].fileName}
                  </span>
                </p>
                <p>{matchingFindings[0].finding.vulnName}</p>
              </div>
              {matchingFindings.length < 2 ? (
                <div>
                  <p className="text-gray-500">
                    No matching finding in other files.
                  </p>
                </div>
              ) : (
                <div>
                  <p>
                    origin file:
                    <span className="font-bold">
                      {" "}
                      {matchingFindings[1].fileName}
                    </span>
                  </p>
                  <p>{matchingFindings[1].finding.vulnName}</p>
                </div>
              )}
            </div>

            {matchingFindings.length < 2 ? null : combinationCovered(
                matchingFindings[0].fileId,
                matchingFindings[0].findingIndex,
                matchingFindings[1]?.fileId ?? "",
                matchingFindings[1]?.findingIndex ?? -1
              ) ? (
              <button
                className="mt-3 bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded"
                onClick={() =>
                  removeDuplicate(
                    matchingFindings[0].fileId,
                    matchingFindings[0].findingIndex,
                    matchingFindings[1]?.fileId ?? "",
                    matchingFindings[1]?.findingIndex ?? -1
                  )
                }
              >
                Remove duplicate mark
              </button>
            ) : (
              <button
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                onClick={() =>
                  markDuplicate(
                    matchingFindings[0].fileId,
                    matchingFindings[0].findingIndex,
                    matchingFindings[1]?.fileId ?? "",
                    matchingFindings[1]?.findingIndex ?? -1
                  )
                }
              >
                Mark as duplicate
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
