// ...existing code...
import { useState } from "react";
import { getVulnerability } from "../lib/getVulnerability";
import type { DuplicateType } from "../lib/types/duplicate";
import { exportGroundTruth, exportJsonFile } from "../lib/duplicatesExport";
import { StoreToCache } from "../lib/cache";
import type { UploadedSarif } from "../lib/types/uploadTypes";

const GROUND_TRUTH_STORAGE_KEY = "secfinlab.duplicateGroundTruth.v1";
const RAW_GROUND_TRUTH_STORAGE_KEY = "secfinlab.duplicateRawGroundTruth.v1";

interface LabelerProps {
  files: UploadedSarif[];
  duplicatesIn?: DuplicateType[];
}

export default function Labeler({ files, duplicatesIn = [] }: LabelerProps) {
  const [currentComparisonIndex] = useState(0);
  const [currentComparisonVulnIndex, setCurrentComparisonVulnIndex] =
    useState(0);
  const [currentSourceVulnIndex, setCurrentSourceVulnIndex] = useState(0);
  const [duplicates, setDuplicates] = useState<DuplicateType[]>(duplicatesIn);
  const sourceFile = files[0] ?? null;
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

  const markDuplicate = () => {
    if (!sourceFile || !currentComparisonFile) return;

    const newDuplicate: DuplicateType = {
      sourceFileId: sourceFile.id,
      sourceVulnIndex: currentSourceVulnIndex, // always first vuln in source
      duplicateFileId: currentComparisonFile.id,
      duplicateVulnIndex: currentComparisonVulnIndex,
    };

    if (
      duplicates.find(
        (dup) =>
          dup.sourceFileId === newDuplicate.sourceFileId &&
          dup.sourceVulnIndex === newDuplicate.sourceVulnIndex &&
          dup.duplicateFileId === newDuplicate.duplicateFileId &&
          dup.duplicateVulnIndex === newDuplicate.duplicateVulnIndex
      )
    ) {
      // already marked
      return;
    }

    setDuplicates((prev) => [...prev, newDuplicate]);
  };

  const combinationCovered = (
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

  const removeDuplicate = (
    sourceFileId: string,
    sourceVulnIndex: number,
    comparisonFileId: string,
    comparisonVulnIndex: number
  ) => {
    setDuplicates((prev) =>
      prev.filter(
        (dup) =>
          !(
            dup.sourceFileId === sourceFileId &&
            dup.sourceVulnIndex === sourceVulnIndex &&
            dup.duplicateFileId === comparisonFileId &&
            dup.duplicateVulnIndex === comparisonVulnIndex
          )
      )
    );
  };

  const exportTruth = async () => {
    const data = exportGroundTruth(duplicates, files);
    exportJsonFile("ground_truth.json", data);
    try {
      await StoreToCache(GROUND_TRUTH_STORAGE_KEY, data);
      await StoreToCache(RAW_GROUND_TRUTH_STORAGE_KEY, duplicates);
    } catch (err) {
      console.warn("Error storing ground truth to cache:", err);
    }
  };

  const saveTruth = async () => {
    const data = exportGroundTruth(duplicates, files);
    try {
      await StoreToCache(GROUND_TRUTH_STORAGE_KEY, data);
      await StoreToCache(RAW_GROUND_TRUTH_STORAGE_KEY, duplicates);
    } catch (err) {
      console.warn("Error storing ground truth to cache:", err);
    } finally {
      alert("Ground truth saved to cache.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold mb-4">Duplicate Labeler</h2>
        <span>
          <button
            className="bg-red-500 hover:bg-red-300 text-white py-1 px-3 rounded mb-4 cursor-pointer"
            onClick={() => setDuplicates([])}
          >
            Clear All Duplicates
          </button>
          <button
            className="bg-green-500 hover:bg-green-300 text-white py-1 px-3 rounded mb-4 ml-2 cursor-pointer"
            onClick={() => {
              exportTruth();
            }}
          >
            Export
          </button>
          <button
            className="bg-green-500 hover:bg-green-300 text-white py-1 px-3 rounded mb-4 ml-2 cursor-pointer"
            onClick={() => {
              saveTruth();
            }}
          >
            Save
          </button>
        </span>
      </div>

      <div className="mb-4">
        <div>
          {combinationCovered(
            sourceFile?.id ?? "",
            currentSourceVulnIndex,
            currentComparisonFile?.id ?? "",
            currentComparisonVulnIndex
          ) ? (
            <div>
              <span className="text-green-600 font-medium">
                This combination is marked as duplicate.
              </span>
              <button
                className="bg-red-500 hover:bg-red-300 text-white py-1 px-3 rounded ml-4 cursor-pointer"
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
            </div>
          ) : (
            <button
              className="bg-blue-500 hover:bg-blue-300 text-white py-1 px-3 rounded mb-4 cursor-pointer"
              onClick={markDuplicate}
            >
              Mark duplicate
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="mt-4 flex-col space-y-2">
            <span>
              Finding {currentSourceVulnIndex + 1} / {sourceFile.findingsCount}
            </span>
            <div className="flex justify-between space-x-2">
              <button
                onClick={() =>
                  stepVuln(
                    -1,
                    sourceFile.findingsCount!,
                    setCurrentSourceVulnIndex
                  )
                }
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded"
              >
                ← Previous Finding
              </button>
              <button
                onClick={() =>
                  stepVuln(
                    1,
                    sourceFile.findingsCount!,
                    setCurrentSourceVulnIndex
                  )
                }
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded"
              >
                Next Finding →
              </button>
            </div>
          </div>
          <div className="mt-4 flex-col space-y-2">
            <span>
              Finding {currentComparisonVulnIndex + 1} /{" "}
              {currentComparisonFile.findingsCount}
            </span>
            <div className="flex justify-between space-x-2">
              <button
                onClick={() =>
                  stepVuln(
                    -1,
                    currentComparisonFile.findingsCount!,
                    setCurrentComparisonVulnIndex
                  )
                }
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded"
              >
                ← Previous Finding
              </button>
              <button
                onClick={() =>
                  stepVuln(
                    1,
                    currentComparisonFile.findingsCount!,
                    setCurrentComparisonVulnIndex
                  )
                }
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded"
              >
                Next Finding →
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="flex items-baseline justify-between">
              <h4 className="font-semibold">
                {sourceFile ? sourceFile.name : "No file"}
              </h4>
              <div className="text-sm text-gray-500">
                {sourceFile ? `${(sourceFile.size / 1024).toFixed(1)} KB` : ""}
              </div>
            </div>

            <div className="mt-3">
              {!sourceFile && (
                <div className="text-gray-500">No left file uploaded.</div>
              )}

              {sourceFile && sourceFile.error && (
                <div className="text-red-600">Error: {sourceFile.error}</div>
              )}

              {sourceFile &&
                !sourceFile.error &&
                (() => {
                  const v = getVulnerability(
                    sourceFile.parsed,
                    currentSourceVulnIndex
                  );
                  if (!v) {
                    return (
                      <div className="text-gray-600">
                        No findings in the first run.
                      </div>
                    );
                  }
                  return (
                    <div>
                      <div className="text-sm text-gray-500">Rule</div>
                      <div className="font-medium mb-2 text-sm">
                        {v.ruleId ?? "—"}
                      </div>

                      <div className="text-sm text-gray-500">Message</div>
                      <div className="mb-2 text-gray-800 text-xs">
                        {v.message ?? "—"}
                      </div>

                      {v.uri && (
                        <>
                          <div className="text-sm text-gray-500">Location</div>
                          <div className="text-sm text-gray-700">
                            {String(v.uri)}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <div className="flex items-baseline justify-between">
              <h4 className="font-semibold">
                {currentComparisonFile ? currentComparisonFile.name : "No file"}
              </h4>
              <div className="text-sm text-gray-500">
                {currentComparisonFile
                  ? `${(currentComparisonFile.size / 1024).toFixed(1)} KB`
                  : ""}
              </div>
            </div>

            <div className="mt-3">
              {!currentComparisonFile && (
                <div className="text-gray-500">No right file uploaded.</div>
              )}

              {currentComparisonFile && currentComparisonFile.error && (
                <div className="text-red-600">
                  Error: {currentComparisonFile.error}
                </div>
              )}

              {currentComparisonFile &&
                !currentComparisonFile.error &&
                (() => {
                  const v = getVulnerability(
                    currentComparisonFile.parsed,
                    currentComparisonVulnIndex
                  );
                  if (!v) {
                    return (
                      <div className="text-gray-600">
                        No findings in the first run.
                      </div>
                    );
                  }
                  return (
                    <div>
                      <div className="text-sm text-gray-500">Rule</div>
                      <div className="font-medium mb-2 text-sm">
                        {v.ruleId ?? "—"}
                      </div>

                      <div className="text-sm text-gray-500">Message</div>
                      <div className="mb-2 text-gray-800 text-xs">
                        {v.message ?? "—"}
                      </div>

                      {v.uri && (
                        <>
                          <div className="text-sm text-gray-500">Location</div>
                          <div className="text-sm text-gray-700">
                            {String(v.uri)}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
            </div>
          </div>
        </div>

        <div className="mt-4 flex-col space-y-2">
          <p>Duplicates #{duplicates.length}</p>
          <div>
            {duplicates.length === 0 && (
              <div className="text-gray-500">No duplicates marked yet.</div>
            )}
            {duplicates.map((dup, idx) => (
              <div key={idx} className="text-sm">
                Source File ID: {dup.sourceFileId}, Vulnerability Index:{" "}
                {dup.sourceVulnIndex} → Duplicate File ID: {dup.duplicateFileId}
                , Vulnerability Index: {dup.duplicateVulnIndex}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// ...existing code...
