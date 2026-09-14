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

interface DocumentsProps {
  workspaceId: number;
  onOpenDocument: (documentId: number) => void;
  onBack: () => void;
}

function Documents({
  workspaceId,
  onOpenDocument,
  onBack,
}: DocumentsProps) {
  const [documents, setDocuments] =
    useState<DocumentData[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [showCreate, setShowCreate] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [content, setContent] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/documents/?workspace_id=${workspaceId}`
      );

      setDocuments(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err: any) {
      console.error(
        "DOCUMENTS ERROR:",
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
          "Failed to load documents."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [workspaceId]);

  const handleCreate = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!title.trim()) {
      setError(
        "Document title is required."
      );
      return;
    }

    try {
      setCreating(true);
      setError("");
      setMessage("");

      const response = await api.post(
        "/documents/",
        null,
        {
          params: {
            workspace_id:
              workspaceId,
            title: title.trim(),
            content:
              content.trim() || null,
          },
        }
      );

      const createdDocument =
        response.data;

      setTitle("");
      setContent("");
      setShowCreate(false);

      setMessage(
        "Document created successfully."
      );

      await loadDocuments();

      if (createdDocument?.id) {
        setTimeout(() => {
          onOpenDocument(
            createdDocument.id
          );
        }, 300);
      }
    } catch (err: any) {
      console.error(
        "CREATE DOCUMENT ERROR:",
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
          "Failed to create document."
        );
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (
    documentId: number
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this document?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(documentId);
      setError("");
      setMessage("");

      await api.delete(
        `/documents/${documentId}`
      );

      setDocuments((current) =>
        current.filter(
          (document) =>
            document.id !== documentId
        )
      );

      setMessage(
        "Document deleted successfully."
      );
    } catch (err: any) {
      console.error(
        "DELETE DOCUMENT ERROR:",
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
          "Failed to delete document."
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocuments =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return documents;
      }

      return documents.filter(
        (document) => {
          const text =
            `${document.title} ${
              document.content || ""
            }`.toLowerCase();

          return text.includes(value);
        }
      );
    }, [documents, search]);

  const closeCreateForm = () => {
    setShowCreate(false);
    setTitle("");
    setContent("");
    setError("");
  };

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
              Workspace Documents
            </p>

            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800">
              Documents
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Create, search and manage your workspace documents.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadDocuments}
              disabled={loading}
              className="border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 px-4 py-2.5 rounded-md text-sm font-medium transition"
            >
              {loading
                ? "Loading..."
                : "Refresh"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowCreate(
                  !showCreate
                );
                setError("");
                setMessage("");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-medium transition"
            >
              {showCreate
                ? "Cancel"
                : "Create Document"}
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

        {showCreate && (
          <div className="bg-white border border-slate-200 rounded-md p-5 sm:p-6 mb-6">
            <div className="mb-5">
              <h3 className="text-lg font-medium text-slate-800">
                Create Document
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Add a title and optional starting content.
              </p>
            </div>

            <form
              onSubmit={handleCreate}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Document Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  placeholder="Enter document title"
                  autoFocus
                  className="w-full border border-slate-300 rounded-md px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Content
                </label>

                <textarea
                  value={content}
                  onChange={(event) =>
                    setContent(
                      event.target.value
                    )
                  }
                  placeholder="Start writing..."
                  rows={7}
                  className="w-full border border-slate-300 rounded-md px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-y"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2.5 rounded-md text-sm font-medium transition"
                >
                  {creating
                    ? "Creating..."
                    : "Create Document"}
                </button>

                <button
                  type="button"
                  onClick={closeCreateForm}
                  className="border border-slate-300 hover:bg-slate-50 text-slate-600 px-5 py-2.5 rounded-md text-sm font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
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
              placeholder="Search documents by title or content..."
              className="flex-1 border border-slate-300 rounded-md px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="flex items-center justify-center sm:min-w-[120px] bg-slate-50 border border-slate-200 rounded-md px-4 py-3">
              <span className="text-sm text-slate-500">
                {filteredDocuments.length}{" "}
                {filteredDocuments.length ===
                1
                  ? "document"
                  : "documents"}
              </span>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white border border-slate-200 rounded-md p-10 text-center">
            <p className="text-sm text-slate-500">
              Loading documents...
            </p>
          </div>
        )}

        {!loading &&
          filteredDocuments.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-md p-8 sm:p-10 text-center">
              <h3 className="text-lg font-medium text-slate-800">
                {search
                  ? "No documents found"
                  : "No documents yet"}
              </h3>

              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                {search
                  ? "Try searching with another title or keyword."
                  : "Create your first document to start working in this workspace."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={() =>
                    setShowCreate(true)
                  }
                  className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-medium transition"
                >
                  Create Document
                </button>
              )}
            </div>
          )}

        {!loading &&
          filteredDocuments.length > 0 && (
            <div className="space-y-4">
              {filteredDocuments.map(
                (document) => (
                  <div
                    key={document.id}
                    className="bg-white border border-slate-200 rounded-md p-5 sm:p-6 hover:border-blue-300 hover:shadow-sm transition"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-800 break-words">
                            {document.title}
                          </h3>

                          <span className="self-start text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2 py-1 rounded-full">
                            Document
                          </span>
                        </div>

                        <p className="text-sm text-slate-500 mt-3 line-clamp-4 whitespace-pre-line">
                          {document.content ||
                            "No content available."}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
                          <span>
                            ID: {document.id}
                          </span>

                          <span>
                            Workspace:{" "}
                            {document.workspace_id}
                          </span>

                          <span>
                            {document.folder_id
                              ? `Folder: ${document.folder_id}`
                              : "No folder"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 lg:shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onOpenDocument(
                              document.id
                            )
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-medium transition"
                        >
                          Open
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              document.id
                            )
                          }
                          disabled={
                            deletingId ===
                            document.id
                          }
                          className="border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 px-5 py-2.5 rounded-md text-sm font-medium transition"
                        >
                          {deletingId ===
                          document.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
      </main>
    </div>
  );
}

export default Documents;
