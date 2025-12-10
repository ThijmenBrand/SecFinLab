/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from "react";
import { readFileText } from "../lib/readFileText";
import type { UploadedFileRaw } from "../lib/types/uploadTypes";

interface FileUploadBoxProps {
  multiple?: boolean;
  onFilesUploaded?: (files: UploadedFileRaw[]) => void;
  onFileUploaded?: (file: UploadedFileRaw) => void;
  fileParser?: (text: string) => any;
}

export default function FileUploadBox({
  onFilesUploaded,
  onFileUploaded,
  multiple = true,
}: FileUploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);

  if (!onFilesUploaded && !onFileUploaded) {
    throw new Error(
      "FileUploadBox requires at least one of onFilesUploaded or onFileUploaded props"
    );
  }

  const handleFileList = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList) return;

      // Limit files if multiple === false
      const incoming = Array.from(fileList);
      const toProcess = multiple ? incoming : incoming.slice(0, 1);

      const newItems: UploadedFileRaw[] = [];
      for (const file of toProcess) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        try {
          const text = await readFileText(file);
          const item: UploadedFileRaw = {
            id,
            name: file.name,
            size: file.size,
            text,
            rawFile: file,
          };
          newItems.push(item);
        } catch (err: any) {
          newItems.push({
            id,
            name: file.name,
            size: file.size,
            error: err?.message ?? "Failed to read file",
          });
        }
      }

      setIsDragging(false);

      // Prefer array callback if provided
      if (onFilesUploaded) {
        onFilesUploaded(newItems);
        return;
      }

      // Otherwise call single-file callback for each created item (or just the first if single-select)
      if (onFileUploaded) {
        if (multiple) {
          for (const it of newItems) onFileUploaded(it);
        } else if (newItems[0]) {
          onFileUploaded(newItems[0]);
        }
      }
    },
    [multiple, onFilesUploaded, onFileUploaded]
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
      <p className="text-gray-700 mb-3">Drag & drop files here, or</p>

      <label className="inline-block">
        <input
          type="file"
          accept=".sarif,application/json,.json,.text/plain,.csv"
          multiple={multiple}
          onChange={onInputChange}
          className="hidden"
        />
        <span className="cursor-pointer inline-block bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
          {multiple ? "Select Files" : "Select a File"}
        </span>
      </label>

      <p className="text-sm text-gray-500 mt-3">
        The app will parse each file and display a basic findings count. You can
        remove files or process all.
      </p>
    </div>
  );
}
