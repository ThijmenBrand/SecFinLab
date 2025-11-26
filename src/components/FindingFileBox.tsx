import { useMemo } from "react";
import { getVulnerability } from "../lib/getVulnerability";
import type { UploadedSarif } from "../lib/types/uploadTypes";

interface FindingFileBoxProps {
  fileIn?: UploadedSarif;
  vulnIndex: number;
  stepVuln: (step: number, totalFindings: number) => void;
}

export default function FindingFileBox({
  fileIn,
  vulnIndex,
  stepVuln,
}: FindingFileBoxProps) {
  const file = useMemo(() => fileIn ?? null, [fileIn]);
  const vuln = useMemo(() => {
    return getVulnerability(vulnIndex, file);
  }, [file, vulnIndex]);

  if (!file) {
    return (
      <div className="bg-white p-4 rounded shadow">
        <div className="text-gray-500">No file uploaded.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mt-4 flex-col space-y-2">
        <span>
          Finding {vulnIndex + 1} / {file.findingsCount}
        </span>
        <div className="flex justify-between space-x-2">
          <button
            onClick={() => stepVuln(-1, file.findingsCount!)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded"
          >
            ← Previous Finding
          </button>
          <button
            onClick={() => stepVuln(1, file.findingsCount!)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded"
          >
            Next Finding →
          </button>
        </div>
      </div>
      <div>
        <div className="bg-white p-4 rounded shadow">
          <div className="flex items-baseline justify-between">
            <h4 className="font-semibold">{file ? file.name : "No file"}</h4>
            <div className="text-sm text-gray-500">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : ""}
            </div>
          </div>

          <div className="mt-3">
            {!file && (
              <div className="text-gray-500">No left file uploaded.</div>
            )}

            {file && file.error && (
              <div className="text-red-600">Error: {file.error}</div>
            )}

            {file &&
              !file.error &&
              (() => {
                if (!vuln) {
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
                      {vuln.ruleId ?? "—"}
                    </div>

                    <div className="text-sm text-gray-500">Message</div>
                    <div className="mb-2 text-gray-800 text-xs">
                      {vuln.message ?? "—"}
                    </div>

                    {vuln.uri && (
                      <>
                        <div className="text-sm text-gray-500">Location</div>
                        <p className="text-sm text-gray-700 break-all">
                          {vuln.uri}
                        </p>
                      </>
                    )}
                  </div>
                );
              })()}
          </div>
        </div>
      </div>
    </div>
  );
}
