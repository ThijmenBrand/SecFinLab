import type { UploadedSarif } from "../lib/types/sarifUpload";

interface UploadedFilesListProps {
  files: UploadedSarif[];
  removeFile: (id: string) => void;
}

export default function UploadedFilesList({
  files,
  removeFile,
}: UploadedFilesListProps) {
  return (
    <ul className="space-y-2">
      {files.map((file) => (
        <li
          key={file.id}
          className="flex items-center justify-between bg-white p-3 rounded shadow-sm"
        >
          <div>
            <div className="font-medium">{file.name}</div>
            <div className="text-sm text-gray-500">
              {file.error ? (
                <span className="text-red-600">Error: {file.error}</span>
              ) : (
                <span>
                  {file.findingsCount ?? 0} findings •{" "}
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => removeFile(file.id)}
              className="text-sm bg-red-100 hover:bg-red-200 text-red-800 py-1 px-2 rounded"
            >
              Remove
            </button>
          </div>
        </li>
      ))}

      {files.length === 0 && (
        <li className="text-gray-500">No files uploaded yet.</li>
      )}
    </ul>
  );
}
