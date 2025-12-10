/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import FileUploadBox from "./components/FileUploadBox";
import { parseJson } from "./lib/parsers/parseJson";
import type { UploadedJson, UploadedFileRaw } from "./lib/types/uploadTypes";
import { ClearCache, LoadFromCache, persist } from "./lib/cache";

const FIELD_STRIPPER_STORAGE_KEY = "secfinlab.fieldStripper.v1";

export default function FieldStripper() {
  const [file, setFile] = useState<UploadedJson | null>(null);

  const onFileUploaded = (files: UploadedFileRaw) => {
    const parsed = parseJson(files.text || "");
    const jsonFile = {
      id: files.id,
      name: files.name,
      size: files.size,
      text: files.text,
      parsed: parsed,
    };
    setFile(jsonFile);
    persist(FIELD_STRIPPER_STORAGE_KEY, jsonFile);
  };

  const removeJson = () => {
    setFile(null);
    ClearCache(FIELD_STRIPPER_STORAGE_KEY);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cached = await LoadFromCache<UploadedJson>(
          FIELD_STRIPPER_STORAGE_KEY
        );
        if (mounted && cached) {
          setFile(cached);
        }
      } catch (err) {
        console.warn("Failed to load cached field stripper file:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // prefer File System Access API, fall back to anchor download
  const exportToLocation = useCallback(
    async (filename: string, data: unknown) => {
      const json =
        typeof data === "string" ? data : JSON.stringify(data, null, 2);
      const picker = (window as any).showSaveFilePicker;
      console.log(picker);
      if (picker) {
        try {
          const handle = await picker({
            suggestedName: filename,
            types: [
              {
                description: "JSON file",
                accept: { "application/json": [".json"] },
              },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(json);
          await writable.close();
          return;
        } catch (err) {
          // user cancelled or error -> fall back to download
          console.warn(
            "Save picker failed or cancelled, falling back to download:",
            err
          );
        }
      }

      try {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.warn("Failed to export JSON:", err);
        // minimal user hint
        alert("Failed to export JSON. See console for details.");
      }
    },
    []
  );

  // pure recursive remover: returns a new value with all occurrences of key removed
  const removeKeyRecursive = useCallback(
    (value: any, keyToRemove: string): any => {
      if (Array.isArray(value)) {
        // map array elements, removing key from any contained objects/arrays
        return value.map((item) => removeKeyRecursive(item, keyToRemove));
      }
      if (value && typeof value === "object") {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(value)) {
          if (k === keyToRemove) {
            // skip this key (removes it)
            continue;
          }
          out[k] = removeKeyRecursive(v, keyToRemove);
        }
        return out;
      }
      // primitive -> unchanged
      return value;
    },
    []
  );

  const resetToOriginal = useCallback(() => {
    if (!file?.text) {
      alert("No original file text available to reset to.");
      return;
    }

    const ok = window.confirm(
      "Reset all changes and restore the original uploaded JSON? This cannot be undone."
    );
    if (!ok) return;

    try {
      const parsed = parseJson(file.text || "");
      const jsonFile = { ...file, parsed };
      setFile(jsonFile);
      persist(FIELD_STRIPPER_STORAGE_KEY, jsonFile);
    } catch (err) {
      console.warn("Failed to parse original JSON text:", err);
      alert("Failed to parse original JSON text. See console for details.");
    }
  }, [file]);

  const handleRemoveKey = useCallback(
    (keyName: string) => {
      if (!file?.parsed) return;
      // confirm destructive action
      const ok = window.confirm(
        `Remove all occurrences of the field "${keyName}" from the JSON? This cannot be undone.`
      );
      if (!ok) return;
      const newParsed = removeKeyRecursive(file.parsed, keyName);
      setFile((prev) => (prev ? { ...prev, parsed: newParsed } : prev));
      persist(FIELD_STRIPPER_STORAGE_KEY, {
        ...file,
        parsed: newParsed,
      });
    },
    [file, removeKeyRecursive]
  );

  // helper: determine if value is plain object
  const isObject = (v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v);

  const sameKeysShape = (
    a: Record<string, unknown>,
    b: Record<string, unknown>
  ) => {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    if (aKeys.length !== bKeys.length) return false;
    for (let i = 0; i < aKeys.length; i++) {
      if (aKeys[i] !== bKeys[i]) return false;
    }
    return true;
  };

  // recursive renderer for keys — show a small remove control next to each key
  const renderKeys = (value: any, depth = 0, parentKey?: string) => {
    const indentPx = depth * 14;

    if (isObject(value)) {
      return Object.entries(value).map(([k, v]) => (
        <div
          key={`${parentKey ?? "root"}-${k}`}
          style={{ marginLeft: indentPx }}
          className="mb-1"
        >
          <div className="flex items-center space-x-2">
            <span
              className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded break-words"
              title={k}
            >
              {k}
            </span>

            <button
              type="button"
              onClick={() => handleRemoveKey(k)}
              className="text-xs text-red-600 hover:text-red-800 ml-1 cursor-pointer"
              aria-label={`Remove all "${k}" fields`}
            >
              ×
            </button>
          </div>

          {/* recurse if nested */}
          <div className="mt-1">
            {renderKeys(v, depth + 1, `${parentKey ?? "root"}.${k}`)}
          </div>
        </div>
      ));
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return (
          <div
            key={`${parentKey ?? "root"}-arr-empty`}
            style={{ marginLeft: indentPx }}
            className="mb-1 text-gray-500 text-xs"
          >
            <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
              []
            </span>
          </div>
        );
      }

      const first = value[0];

      if (isObject(first)) {
        const sameShape = value.every(
          (it) =>
            isObject(it) &&
            sameKeysShape(
              first as Record<string, unknown>,
              it as Record<string, unknown>
            )
        );

        return (
          <div
            key={`${parentKey ?? "root"}-arr-obj`}
            style={{ marginLeft: indentPx }}
            className="mb-1"
          >
            <div className="flex items-start space-x-2">
              <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                [0]
              </span>
              <div className="flex-1">
                {renderKeys(first, depth + 1, `${parentKey ?? "root"}[0]`)}
                {value.length > 1 && (
                  <div className="text-xs text-gray-500 mt-1">
                    +{value.length - 1} more
                  </div>
                )}
                {!sameShape && (
                  <div className="text-xs text-yellow-600 mt-1">
                    Array items have mixed shapes; only first shown
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div
          key={`${parentKey ?? "root"}-arr-prim`}
          style={{ marginLeft: indentPx }}
          className="mb-1"
        >
          <div className="flex items-center space-x-2">
            <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
              [0]
            </span>
            <div className="text-sm text-gray-800">
              <span className="font-mono text-xs">{String(first)}</span>
              {value.length > 1 && (
                <span className="text-xs text-gray-500 ml-2">
                  +{value.length - 1} more
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={`${parentKey ?? "root"}-val`}
        style={{ marginLeft: indentPx }}
        className="mb-1"
      >
        <span className="inline-block text-gray-500 text-xs italic break-words">
          {String(value)}
        </span>
      </div>
    );
  };

  /* ...existing JSX rendering below (unchanged) ... */
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Field Stripper</h1>
      <p>This is the Field Stripper component.</p>

      {file ? (
        <div className="mb-4 p-4 border border-gray-300 rounded bg-white shadow-sm">
          <div className="font-medium mb-2">Uploaded File:</div>
          <div className="text-gray-700">{file.name}</div>

          <div className="mt-3 flex space-x-2">
            <button
              className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded"
              onClick={removeJson}
            >
              Remove File
            </button>

            <button
              className="bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-3 rounded"
              onClick={resetToOriginal}
            >
              Reset to Original
            </button>

            <button
              className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
              onClick={() => {
                // export original uploaded raw text (if available)
                const base = file.name.replace(/\.[^/.]+$/, "");
                exportToLocation(
                  `${base}-original.json`,
                  file.parsed ?? file.text ?? {}
                );
              }}
            >
              Export Current JSON View
            </button>
          </div>
        </div>
      ) : (
        <FileUploadBox onFileUploaded={onFileUploaded} multiple={false} />
      )}

      <div className="mt-6 p-4 border border-gray-300 rounded bg-white shadow-sm">
        <div className="font-medium mb-2">JSON fields</div>

        <div className="text-sm text-gray-800">
          {file?.parsed ? (
            <div>{renderKeys(file.parsed)}</div>
          ) : (
            <div className="text-gray-500">No JSON loaded.</div>
          )}
        </div>
      </div>
    </div>
  );
}
