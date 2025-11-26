import { useCallback, useEffect, useMemo, useState } from "react";
import FileUploadBox from "./components/FileUploadBox";
import { ClearCache, LoadFromCache, persist } from "./lib/cache";
import type {
  AspmResultFile,
  GroundTruthFile,
  UploadedFileRaw,
} from "./lib/types/uploadTypes";
import {
  f1Score,
  falseNegatives,
  falsePositives,
  precision,
  recall,
  truePositives,
} from "./lib/metrics";
import { parseAspmResults } from "./lib/parsers/baseAspmParser";

const GROUND_TRUTH_STORAGE_KEY = "secfinlab.duplicateGroundTruth.v1";
const ASPM_RESULT_STORAGE_KEY = "secfinlab.aspmResult.v1";

export default function DeduplicationEvaluator() {
  const [aspmFile, setAspmFile] = useState<AspmResultFile | null>(null);
  const [groundTruth, setGroundTruth] = useState<GroundTruthFile | null>(null);

  const onFilesUploaded = useCallback((file: UploadedFileRaw) => {
    const aspmFile = parseAspmResults(file.name, file.text!);
    setAspmFile(aspmFile);
    persist(ASPM_RESULT_STORAGE_KEY, aspmFile);
  }, []);

  const removeGroundTruth = () => {
    setGroundTruth(null);
    ClearCache(GROUND_TRUTH_STORAGE_KEY);
  };

  const metrics = useMemo(() => {
    if (!aspmFile || !groundTruth) return null;
    const tp = truePositives(groundTruth, aspmFile);
    const fp = falsePositives(groundTruth, aspmFile);
    const fn = falseNegatives(groundTruth, aspmFile);
    return {
      truePositives: tp,
      falsePositives: fp,
      falseNegatives: fn,
      precision: precision(tp, fp),
      recall: recall(tp, fn),
      f1Score: f1Score(precision(tp, fp), recall(tp, fn)),
    };
  }, [aspmFile, groundTruth]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cached = await LoadFromCache<GroundTruthFile>(
          GROUND_TRUTH_STORAGE_KEY
        );
        const aspmResultCached = await LoadFromCache<AspmResultFile>(
          ASPM_RESULT_STORAGE_KEY
        );
        if (mounted && aspmResultCached) {
          setAspmFile(aspmResultCached);
        }
        if (mounted && cached) {
          setGroundTruth(cached);
        }
      } catch (err) {
        console.warn("Failed to load cached SARIF files", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Deduplication evaluator</h2>

      <div>
        <h4 className="text-lg font-medium mb-2">Instructions</h4>
        <div className="text-gray-700 space-y-2">
          <p>
            1. Upload the deduplicated JSON file exported from the ASPM tool.
          </p>
          <p>2. Load the ground truth JSON file</p>
          <p>
            3. The evaluator will compare the two files and provide a summary of
            deduplication accuracy, including metrics such as precision, recall,
            and F1-score.
          </p>
          <p>
            4. Use the results to assess the effectiveness of the deduplication
            process and identify any potential improvements.
          </p>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium mb-2">
          Upload the result JSON from the ASPM
        </h4>
        {aspmFile ? (
          <div className="mb-4 p-4 border border-gray-300 rounded bg-white shadow-sm">
            <div className="font-medium mb-2">Uploaded File:</div>
            <div className="text-gray-700">{aspmFile.name}</div>
            <div className="text-gray-600 text-sm">
              {aspmFile.parsed.results.length} findings
            </div>
            <button
              className="mt-3 bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded"
              onClick={() => setAspmFile(null)}
            >
              Remove File
            </button>
          </div>
        ) : (
          <FileUploadBox onFileUploaded={onFilesUploaded} multiple={false} />
        )}
      </div>
      <div>
        <h4 className="text-lg font-medium mb-2">Ground Truth File</h4>
        {groundTruth ? (
          <div className="mb-4 p-4 border border-gray-300 rounded bg-white shadow-sm">
            <div className="font-medium mb-2">Loaded Ground Truth:</div>
            <div className="text-gray-700">{groundTruth.name}</div>
            <div className="text-gray-600 text-sm">
              {groundTruth.parsed.generic.length} generic findigs,{" "}
              {groundTruth.parsed.duplicates.length} duplicate groups
            </div>
            <button
              className="mt-3 bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded"
              onClick={removeGroundTruth}
            >
              Remove Ground Truth
            </button>
          </div>
        ) : (
          <div className="text-gray-600">No ground truth file loaded.</div>
        )}
      </div>

      <div>
        <h4 className="text-lg font-medium mb-2">Evaluation Results</h4>
        {!aspmFile || !groundTruth ? (
          <div className="text-gray-600">
            Please upload both the deduplicated file and the ground truth file
            to see evaluation results.
          </div>
        ) : (
          <div className="p-4 border border-gray-300 rounded bg-white shadow-sm">
            {/* Evaluation logic and results would go here */}
            <div className="flex flex-row justify-between w-full text-gray-700">
              <span>
                <strong>True Positives:</strong> {metrics?.truePositives}
              </span>
              <span>
                <strong>False Positives:</strong> {metrics?.falsePositives}
              </span>
              <span>
                <strong>False Negatives:</strong> {metrics?.falseNegatives}
              </span>
            </div>

            <div className="mt-4">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr>
                    <th className="border px-4 py-2">Metric</th>
                    <th className="border px-4 py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Replace the following rows with actual computed metrics */}
                  <tr>
                    <td className="border px-4 py-2">Precision</td>
                    <td className="border px-4 py-2">{metrics?.precision}</td>
                  </tr>
                  <tr>
                    <td className="border px-4 py-2">Recall</td>
                    <td className="border px-4 py-2">{metrics?.recall}</td>
                  </tr>
                  <tr>
                    <td className="border px-4 py-2">F1-Score</td>
                    <td className="border px-4 py-2">{metrics?.f1Score}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
