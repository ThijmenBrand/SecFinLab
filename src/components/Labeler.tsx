// ...existing code...
import { useMemo, useState } from "react";
import type { DuplicateType } from "../lib/types/duplicate";
import { exportGroundTruth, exportJsonFile } from "../lib/duplicatesExport";
import { StoreToCache } from "../lib/cache";
import type { UploadedSarif } from "../lib/types/uploadTypes";
import VulnMatchMode from "./VulnMatchMode";
import FileMatchMode from "./FileMatchMode";

const GROUND_TRUTH_STORAGE_KEY = "secfinlab.duplicateGroundTruth.v1";
const RAW_GROUND_TRUTH_STORAGE_KEY = "secfinlab.duplicateRawGroundTruth.v1";

interface LabelerProps {
  filesIn: UploadedSarif[];
  duplicatesIn?: DuplicateType[];
}

export default function Labeler({ filesIn, duplicatesIn = [] }: LabelerProps) {
  const [duplicates, setDuplicates] = useState<DuplicateType[]>(duplicatesIn);
  const [labelMode, setLabelMode] = useState<"vuln" | "file">("vuln");

  const markDuplicate = (
    sourceFileId: string,
    sourceVulnIndex: number,
    comparisonFileId: string,
    comparisonVulnIndex: number
  ) => {
    const newDuplicate: DuplicateType = {
      sourceFileId: sourceFileId,
      sourceVulnIndex: sourceVulnIndex, // always first vuln in source
      duplicateFileId: comparisonFileId,
      duplicateVulnIndex: comparisonVulnIndex,
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

  const files = useMemo(() => filesIn, [filesIn]);

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
      <div>
        <button
          className={`py-1 px-3 rounded mb-4 mr-2 cursor-pointer ${
            labelMode === "vuln"
              ? "bg-blue-500 hover:bg-blue-300 text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-800"
          }`}
          onClick={() => setLabelMode("vuln")}
        >
          Vulnerability Match Mode
        </button>
        <button
          className={`py-1 px-3 rounded mb-4 mr-2 cursor-pointer ${
            labelMode === "file"
              ? "bg-blue-500 hover:bg-blue-300 text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-800"
          }`}
          onClick={() => setLabelMode("file")}
        >
          File Match Mode
        </button>
      </div>
      {labelMode === "file" ? (
        <FileMatchMode
          files={files}
          duplicatesIn={duplicates}
          markDuplicate={markDuplicate}
          removeDuplicate={removeDuplicate}
        />
      ) : (
        <VulnMatchMode
          files={files}
          duplicates={duplicates}
          markDuplicate={markDuplicate}
          removeDuplicate={removeDuplicate}
        />
      )}

      <div className="mt-4 flex-col space-y-2">
        <p>Duplicates #{duplicates.length}</p>
        <div>
          {duplicates.length === 0 && (
            <div className="text-gray-500">No duplicates marked yet.</div>
          )}
          {duplicates.map((dup, idx) => (
            <div key={idx} className="text-sm">
              Source File ID: {dup.sourceFileId}, Vulnerability Index:{" "}
              {dup.sourceVulnIndex} → Duplicate File ID: {dup.duplicateFileId},
              Vulnerability Index: {dup.duplicateVulnIndex}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// ...existing code...
