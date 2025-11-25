// ...existing code...
import { useCallback, useEffect, useState } from "react";
import FileUploadBox from "./components/FileUploadBox";
import type { UploadedSarif } from "./lib/types/sarifUpload";
import UploadedFilesList from "./components/UploadedFilesList";
import { ClearCache, LoadFromCache, StoreToCache } from "./lib/cache";
import Labeler from "./components/Labeler";

const STORAGE_KEY = "secfinlab.sarifFiles.v1";

export default function DuplicateLabeler() {
  const [files, setFiles] = useState<UploadedSarif[]>([]);
  const [labelingMode, setLabelingMode] = useState(false);

  const startLabeling = () => {
    if (files.length < 2) {
      // require at least two files to compare side-by-side
      alert("Upload at least two SARIF files to start labeling.");
      return;
    }
    setLabelingMode(true);
  };

  const stopLabeling = () => setLabelingMode(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cached = await LoadFromCache<UploadedSarif[]>(STORAGE_KEY);
        if (mounted && Array.isArray(cached)) setFiles(cached);
      } catch (err) {
        console.warn("Failed to load cached SARIF files", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = async (next: UploadedSarif[]) => {
    try {
      await StoreToCache(STORAGE_KEY, next);
    } catch (err) {
      console.warn("Error storing data to cache:", err);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      void persist(updated);
      return updated;
    });
  };

  const clearAll = async () => {
    setFiles([]);
    try {
      await ClearCache(STORAGE_KEY);
    } catch (err) {
      console.warn("Failed to clear cache", err);
    }
  };

  const onFilesUploaded = useCallback((newFiles: UploadedSarif[]) => {
    setFiles((prev) => {
      const next = [...prev, ...newFiles];
      void persist(next);
      return next;
    });
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Duplicate Labeler</h2>

      {!labelingMode ? (
        <FileUploadBox onFilesUploaded={onFilesUploaded} />
      ) : (
        <div className="mb-4">
          <button
            onClick={stopLabeling}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded"
          >
            ← Back to Upload
          </button>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Uploaded files ({files.length})</h3>
          <div className="space-x-2">
            <button
              onClick={clearAll}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded"
            >
              Clear
            </button>
          </div>
        </div>

        <UploadedFilesList files={files} removeFile={removeFile} />
      </div>

      {!labelingMode && (
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          onClick={startLabeling}
        >
          Start Labeling Duplicates
        </button>
      )}

      {labelingMode && <Labeler files={files} />}
    </div>
  );
}
