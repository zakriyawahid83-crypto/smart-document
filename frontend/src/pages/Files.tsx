import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import api from "../services/api";

interface FileData {
  id: number;
  filename?: string;
  file_name?: string;
  original_filename?: string;
  name?: string;
  workspace_id?: number;
  created_at?: string;
  size?: number;
}

interface FilesProps {
  workspaceId: number;
  onBack: () => void;
}

function Files({
  workspaceId,
  onBack,
}: FilesProps) {
  const [files, setFiles] = useState<FileData[]>(
    []
  );

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [renamingId, setRenamingId] =
    useState<number | null>(null);

  const [renameValue, setRenameValue] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/upload/workspace/${workspaceId}`
      );

      setFiles(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err: any) {
      console.error(
        "FILES ERROR:",
        err
      );

      const detail =
        err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map(
              (item: any) =>
                item.msg
            )
            .join(", ")
        );
      } else if (detail) {
        setError(String(detail));
      } else {
        setError(
          "Failed to load files."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [workspaceId]);

  const getFileName = (
    file: FileData
  ) => {
    return (
      file.filename ||
      file.file_name ||
      file.original_filename ||
      file.name ||
      `File ${file.id}`
    );
  };

  const getExtension = (
    file: FileData
  ) => {
    const name = getFileName(file);
    const parts = name.split(".");

    if (parts.length < 2) {
      return "FILE";
    }

    return parts[
      parts.length - 1
    ].toUpperCase();
  };

  const formatSize = (
    size?: number
  ) => {
    if (
      size === undefined ||
      size === null
    ) {
      return "Size unavailable";
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(
        size / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  const formatDate = (
    value?: string
  ) => {
    if (!value) {
      return "Date unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString();
  };

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    try {
      setUploading(true);
      setError("");
      setMessage("");

      const formData = new FormData();

      formData.append(
        "file",
        selectedFile
      );

      formData.append(
        "workspace_id",
        String(workspaceId)
      );

      await api.post(
        "/upload/",
        formData
      );

      setMessage(
        "File uploaded successfully."
      );

      await loadFiles();
    } catch (err: any) {
      console.error(
        "UPLOAD ERROR:",
        err
      );

      const detail =
        err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map(
              (item: any) =>
                item.msg
            )
            .join(", ")
        );
      } else if (detail) {
        setError(String(detail));
      } else {
        setError(
          "Failed to upload file."
        );
      }
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownload = async (
    file: FileData
  ) => {
    try {
      setError("");
      setMessage("");

      const response = await api.get(
        `/upload/${file.id}/download`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([
        response.data,
      ]);

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = url;
      link.download = getFileName(file);

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      setMessage(
        "Download started."
      );
    } catch (err) {
      console.error(
        "DOWNLOAD ERROR:",
        err
      );

      setError(
        "Failed to download file."
      );
    }
  };

  const startRename = (
    file: FileData
  ) => {
    setRenamingId(file.id);
    setRenameValue(
      getFileName(file)
    );
    setError("");
    setMessage("");
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const handleRename = async (
    fileId: number
  ) => {
    if (!renameValue.trim()) {
      setError(
        "File name is required."
      );
      return;
    }

    try {
      setError("");
      setMessage("");

      await api.put(
        `/upload/${fileId}/rename`,
        null,
        {
          params: {
            new_name:
              renameValue.trim(),
          },
        }
      );

      setRenamingId(null);
      setRenameValue("");

      setMessage(
        "File renamed successfully."
      );

      await loadFiles();
    } catch (err: any) {
      console.error(
        "RENAME ERROR:",
        err
      );

      const detail =
        err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map(
              (item: any) =>
                item.msg
            )
            .join(", ")
        );
      } else if (detail) {
        setError(String(detail));
      } else {
        setError(
          "Failed to rename file."
        );
      }
    }
  };

  const handleDelete = async (
    fileId: number
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this file?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(fileId);
      setError("");
      setMessage("");

      await api.delete(
        `/upload/${fileId}`
      );

      setFiles((current) =>
        current.filter(
          (file) =>
            file.id !== fileId
        )
      );

      setMessage(
        "File deleted successfully."
      );
    } catch (err: any) {
      console.error(
        "DELETE FILE ERROR:",
        err
      );

      const detail =
        err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map(
              (item: any) =>
                item.msg
            )
            .join(", ")
        );
      } else if (detail) {
        setError(String(detail));
      } else {
        setError(
          "Failed to delete file."
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filteredFiles =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return files;
      }

      return files.filter(
        (file) =>
          getFileName(file)
            .toLowerCase()
            .includes(value)
      );
    }, [files, search]);

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
              SmartDocs
            </h1>

            <p className="hidden sm:block text-xs text-slate-400">
              Document Management Platform
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-sm text-slate-600 hover:text-blue-600 transition"
          >
            Workspace
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-7">
          <div>
            <p className="text-xs text-slate-400 mb-1">
              Workspace Files
            </p>

            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800">
              Files
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Upload and manage files for this workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadFiles}
              disabled={loading}
              className="border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 px-4 py-2.5 rounded-md text-sm font-medium transition"
            >
              {loading
                ? "Loading..."
                : "Refresh"}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.txt"
              onChange={handleUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2.5 rounded-md text-sm font-medium transition"
            >
              {uploading
                ? "Uploading..."
                : "Upload File"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md px-4 py-3">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {message && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md px-4 py-3">
            <p className="text-sm text-green-700">
              {message}
            </p>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search files..."
              className="flex-1 border border-slate-300 rounded-md px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="flex items-center justify-center sm:min-w-[120px] bg-slate-50 border border-slate-200 rounded-md px-4 py-3">
              <span className="text-sm text-slate-500">
                {filteredFiles.length}{" "}
                {filteredFiles.length === 1
                  ? "file"
                  : "files"}
              </span>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white border border-slate-200 rounded-md p-10 text-center">
            <p className="text-sm text-slate-500">
              Loading files...
            </p>
          </div>
        )}

        {!loading &&
          filteredFiles.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-md p-8 sm:p-10 text-center">
              <h3 className="text-lg font-medium text-slate-800">
                {search
                  ? "No files found"
                  : "No files yet"}
              </h3>

              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                {search
                  ? "Try another file name."
                  : "Upload your first file to start managing workspace files."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-medium transition"
                >
                  Upload File
                </button>
              )}
            </div>
          )}

        {!loading &&
          filteredFiles.length > 0 && (
            <div className="space-y-4">
              {filteredFiles.map(
                (file) => (
                  <div
                    key={file.id}
                    className="bg-white border border-slate-200 rounded-md p-5 sm:p-6 hover:border-blue-300 hover:shadow-sm transition"
                  >
                    {renamingId ===
                    file.id ? (
                      <div className="flex flex-col lg:flex-row gap-3">
                        <input
                          type="text"
                          value={
                            renameValue
                          }
                          onChange={(event) =>
                            setRenameValue(
                              event.target
                                .value
                            )
                          }
                          className="flex-1 border border-blue-400 rounded-md px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
                          autoFocus
                        />

                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleRename(
                                file.id
                              )
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md text-sm font-medium transition"
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            onClick={
                              cancelRename
                            }
                            className="border border-slate-300 hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-md text-sm font-medium transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <h3 className="text-base sm:text-lg font-semibold text-slate-800 break-all">
                              {getFileName(
                                file
                              )}
                            </h3>

                            <span className="self-start text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-full">
                              {getExtension(
                                file
                              )}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                            <span>
                              ID: {file.id}
                            </span>

                            <span>
                              {formatSize(
                                file.size
                              )}
                            </span>

                            {file.created_at && (
                              <span>
                                Added:{" "}
                                {formatDate(
                                  file.created_at
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 lg:shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleDownload(
                                file
                              )
                            }
                            className="border border-blue-200 text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-md text-sm font-medium transition"
                          >
                            Download
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              startRename(
                                file
                              )
                            }
                            className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-md text-sm font-medium transition"
                          >
                            Rename
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                file.id
                              )
                            }
                            disabled={
                              deletingId ===
                              file.id
                            }
                            className="border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 px-4 py-2.5 rounded-md text-sm font-medium transition"
                          >
                            {deletingId ===
                            file.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}

        <div className="mt-6 bg-white border border-slate-200 rounded-md p-5">
          <h3 className="text-sm font-medium text-slate-700">
            Supported File Formats
          </h3>

          <p className="text-sm text-slate-500 mt-2">
            PDF, DOCX, XLSX, PNG, JPG, JPEG and TXT
          </p>
        </div>
      </main>
    </div>
  );
}

export default Files;
