/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from "react";
import type { UploadedSarif } from "../lib/types/sarifUpload";
import { readFileText } from "../lib/readFileText";
import { parseSarif } from "../lib/parseSarif";

interface FileUploadBoxProps {
  onFilesUploaded: (files: UploadedSarif[]) => void;
}

export default function FileUploadBox({ onFilesUploaded }: FileUploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileList = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList) return;
      const newItems: UploadedSarif[] = [];
      for (const file of Array.from(fileList)) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        try {
          const text = await readFileText(file);
          const { parsed, findingsCount } = parseSarif(text);
          newItems.push({
            id,
            name: file.name,
            size: file.size,
            text,
            parsed,
            findingsCount,
          });
        } catch (err: any) {
          newItems.push({
            id,
            name: file.name,
            size: file.size,
            error: err?.message ?? "Failed to parse",
          });
        }
      }
      setIsDragging(false);
      onFilesUploaded(newItems);
    },
    [onFilesUploaded]
  );

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileList(e.dataTransfer.files);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleFileList(e.target.files);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`border-2 rounded-md p-6 mb-4 transition-colors ${
        isDragging
          ? "border-blue-400 bg-blue-50"
          : "border-dashed border-gray-300 bg-white"
      }`}
    >
      <p className="text-gray-700 mb-3">
        Drag & drop SARIF (.sarif / .json) files here, or
      </p>

      <label className="inline-block">
        <input
          type="file"
          accept=".sarif,application/json,.json"
          multiple
          onChange={onInputChange}
          className="hidden"
        />
        <span className="cursor-pointer inline-block bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
          Choose files
        </span>
      </label>

      <p className="text-sm text-gray-500 mt-3">
        The app will parse each file and display a basic findings count. You can
        remove files or process all.
      </p>
    </div>
  );
}
