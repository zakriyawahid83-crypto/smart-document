import {
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../services/api";

interface DocumentData {
  id: number;
  workspace_id: number;
  owner_id: number;
  title: string;
  content: string | null;
  folder_id: number | null;
}

interface VersionData {
  id: number;
  document_id?: number;
  title?: string;
  content?: string | null;
  created_at?: string;
}

interface DocumentEditorProps {
  documentId: number;
  onBack: () => void;
}

function DocumentEditor({
  documentId,
  onBack,
}: DocumentEditorProps) {
  const [document, setDocument] =
    useState<DocumentData | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] =
    useState("");

  const [savedTitle, setSavedTitle] =
    useState("");

  const [savedContent, setSavedContent] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [loadingVersions, setLoadingVersions] =
    useState(false);

  const [restoringId, setRestoringId] =
    useState<number | null>(null);

  const [versions, setVersions] = useState<
    VersionData[]
  >([]);

  const [showVersions, setShowVersions] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/documents/${documentId}`
      );

      const data = response.data;

      setDocument(data);
      setTitle(data.title || "");
      setContent(data.content || "");

      setSavedTitle(data.title || "");
      setSavedContent(data.content || "");
    } catch (err: any) {
      console.error(
        "DOCUMENT ERROR:",
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
          "Failed to load document."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async () => {
    try {
      setLoadingVersions(true);
      setError("");

      const response = await api.get(
        `/documents/${documentId}/versions`
      );

      setVersions(response.data || []);
    } catch (err: any) {
      console.error(
        "VERSIONS ERROR:",
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
          "Failed to load version history."
        );
      }
    } finally {
      setLoadingVersions(false);
    }
  };

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  useEffect(() => {
    if (showVersions) {
      loadVersions();
    }
  }, [showVersions, documentId]);

  const hasChanges = useMemo(() => {
    return (
      title !== savedTitle ||
      content !== savedContent
    );
  }, [
    title,
    content,
    savedTitle,
    savedContent,
  ]);

  const wordCount = useMemo(() => {
    const trimmed = content.trim();

    if (!trimmed) {
      return 0;
    }

    return trimmed.split(/\s+/).length;
  }, [content]);

  const characterCount =
    content.length;

  const handleSave = async () => {
    if (!title.trim()) {
      setError(
        "Document title is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await api.put(
        `/documents/${documentId}`,
        null,
        {
          params: {
            title: title.trim(),
            content:
              content || null,
          },
        }
      );

      const updated =
        response.data;

      setDocument(updated);

      setTitle(updated.title || "");
      setContent(
        updated.content || ""
      );

      setSavedTitle(
        updated.title || ""
      );

      setSavedContent(
        updated.content || ""
      );

      setMessage(
        "Document saved successfully."
      );

      if (showVersions) {
        await loadVersions();
      }
    } catch (err: any) {
      console.error(
        "SAVE DOCUMENT ERROR:",
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
          "Failed to save document."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (
    versionId: number
  ) => {
    const confirmed =
      window.confirm(
        "Restore this version? Your current document content will be replaced."
      );

    if (!confirmed) {
      return;
    }

    try {
      setRestoringId(versionId);
      setError("");
      setMessage("");

      await api.post(
        `/documents/${documentId}/versions/${versionId}/restore`
      );

      await loadDocument();

      await loadVersions();

      setMessage(
        "Version restored successfully."
      );
    } catch (err: any) {
      console.error(
        "RESTORE VERSION ERROR:",
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
          "Failed to restore version."
        );
      }
    } finally {
      setRestoringId(null);
    }
  };

  useEffect(() => {
    const handleKeyboard = (
      event: KeyboardEvent
    ) => {
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();

        if (!saving && hasChanges) {
          handleSave();
        }
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, [
    saving,
    hasChanges,
    title,
    content,
  ]);

  const handleBack = () => {
    if (hasChanges) {
      const confirmed =
        window.confirm(
          "You have unsaved changes. Leave without saving?"
        );

      if (!confirmed) {
        return;
      }
    }

    onBack();
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

    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <nav className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                SmartDocs
              </h1>

              <p className="text-xs text-slate-400">
                Document Management Platform
              </p>
            </div>

            <button
              onClick={onBack}
              className="text-sm text-slate-600 hover:text-blue-600 transition"
            >
              Back
            </button>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-6 py-10">
          <div className="bg-white border border-slate-200 rounded-md p-10 text-center">
            <p className="text-sm text-slate-500">
              Loading document...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="min-h-screen bg-slate-100">
        <nav className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                SmartDocs
              </h1>

              <p className="text-xs text-slate-400">
                Document Management Platform
              </p>
            </div>

            <button
              onClick={onBack}
              className="text-sm text-slate-600 hover:text-blue-600 transition"
            >
              Back
            </button>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-6 py-10">
          <div className="bg-white border border-red-200 rounded-md p-8">
            <h2 className="text-lg font-medium text-slate-800">
              Document unavailable
            </h2>

            <p className="text-sm text-red-600 mt-2">
              {error}
            </p>

            <button
              onClick={onBack}
              className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-medium transition"
            >
              Back to Documents
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">
              SmartDocs
            </h1>

            <p className="text-xs text-slate-400">
              Document Management Platform
            </p>
          </div>

          <button
            onClick={handleBack}
            className="text-sm text-slate-600 hover:text-blue-600 transition"
          >
            Back to Documents
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs text-slate-400 mb-1">
              Document #{documentId}
            </p>

            <h2 className="text-2xl font-semibold text-slate-800">
              Document Editor
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`text-sm ${
                hasChanges
                  ? "text-amber-600"
                  : "text-green-600"
              }`}
            >
              {hasChanges
                ? "Unsaved changes"
                : "All changes saved"}
            </span>

            <button
              onClick={() =>
                setShowVersions(
                  !showVersions
                )
              }
              className="border border-slate-300 text-slate-600 hover:bg-white px-4 py-2.5 rounded-md text-sm font-medium transition"
            >
              {showVersions
                ? "Hide History"
                : "Version History"}
            </button>

            <button
              onClick={handleSave}
              disabled={
                saving || !hasChanges
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-md text-sm font-medium transition"
            >
              {saving
                ? "Saving..."
                : "Save"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
            {message}
          </div>
        )}

        {showVersions && (
          <div className="bg-white border border-slate-200 rounded-md mb-6">
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-slate-800">
                    Version History
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    View previous versions and restore
                    an older version.
                  </p>
                </div>

                <span className="text-xs text-slate-400">
                  {versions.length}{" "}
                  {versions.length === 1
                    ? "version"
                    : "versions"}
                </span>
              </div>
            </div>

            {loadingVersions && (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">
                  Loading version history...
                </p>
              </div>
            )}

            {!loadingVersions &&
              versions.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-500">
                    No previous versions available.
                  </p>
                </div>
              )}

            {!loadingVersions &&
              versions.length > 0 && (
                <div className="divide-y divide-slate-100">
                  {versions.map(
                    (version, index) => (
                      <div
                        key={version.id}
                        className="p-5 hover:bg-slate-50 transition"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <h4 className="text-sm font-medium text-slate-800">
                                Version{" "}
                                {versions.length -
                                  index}
                              </h4>

                              {index === 0 && (
                                <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded-full">
                                  Latest
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-400 mt-1">
                              {formatDate(
                                version.created_at
                              )}
                            </p>

                            <div className="mt-3">
                              <p className="text-sm text-slate-700">
                                {version.title ||
                                  "Untitled document"}
                              </p>

                              {version.content && (
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2 whitespace-pre-line">
                                  {version.content}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              handleRestore(
                                version.id
                              )
                            }
                            disabled={
                              restoringId ===
                              version.id
                            }
                            className="shrink-0 border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50 px-4 py-2 rounded-md text-sm font-medium transition"
                          >
                            {restoringId ===
                            version.id
                              ? "Restoring..."
                              : "Restore"}
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Document Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(
                  event.target.value
                );
                setMessage("");
              }}
              placeholder="Enter document title"
              className="w-full border border-slate-300 rounded-md px-4 py-3 text-lg font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="p-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Content
            </label>

            <textarea
              value={content}
              onChange={(event) => {
                setContent(
                  event.target.value
                );
                setMessage("");
              }}
              placeholder="Start writing your document..."
              className="w-full min-h-[500px] border border-slate-300 rounded-md px-4 py-4 text-sm leading-7 text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
            />

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex gap-5 text-xs text-slate-400">
                <span>
                  Words: {wordCount}
                </span>

                <span>
                  Characters:{" "}
                  {characterCount}
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Press Ctrl + S to save
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white border border-slate-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-slate-800">
            Document Information
          </h3>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <p className="text-xs text-slate-400">
                Document ID
              </p>

              <p className="text-sm text-slate-700 mt-1">
                {document?.id}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Workspace ID
              </p>

              <p className="text-sm text-slate-700 mt-1">
                {document?.workspace_id}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Folder
              </p>

              <p className="text-sm text-slate-700 mt-1">
                {document?.folder_id
                  ? document.folder_id
                  : "No folder"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DocumentEditor;
