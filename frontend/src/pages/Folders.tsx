import {
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../services/api";

interface FolderData {
  id: number;
  name: string;
  workspace_id: number;
  parent_id: number | null;
  created_at?: string;
}

interface FoldersProps {
  workspaceId: number;
  onBack: () => void;
}

function Folders({
  workspaceId,
  onBack,
}: FoldersProps) {
  const [folders, setFolders] = useState<
    FolderData[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [showCreate, setShowCreate] =
    useState(false);

  const [name, setName] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const loadFolders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/folders/?workspace_id=${workspaceId}`
      );

      setFolders(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err: any) {
      console.error(
        "FOLDERS ERROR:",
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
          "Failed to load folders."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, [workspaceId]);

  const handleCreate = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      setError(
        "Folder name is required."
      );
      return;
    }

    try {
      setCreating(true);
      setError("");
      setMessage("");

      await api.post(
        "/folders/",
        {
          name: name.trim(),
          workspace_id: workspaceId,
          parent_id: null,
        }
      );

      setName("");
      setShowCreate(false);

      setMessage(
        "Folder created successfully."
      );

      await loadFolders();
    } catch (err: any) {
      console.error(
        "CREATE FOLDER ERROR:",
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
          "Failed to create folder."
        );
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (
    folderId: number
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this folder?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(folderId);
      setError("");
      setMessage("");

      await api.delete(
        `/folders/${folderId}`
      );

      setFolders((current) =>
        current.filter(
          (folder) =>
            folder.id !== folderId
        )
      );

      setMessage(
        "Folder deleted successfully."
      );
    } catch (err: any) {
      console.error(
        "DELETE FOLDER ERROR:",
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
          "Failed to delete folder."
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filteredFolders =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return folders;
      }

      return folders.filter(
        (folder) =>
          folder.name
            .toLowerCase()
            .includes(value)
      );
    }, [folders, search]);

  const closeCreateForm = () => {
    setShowCreate(false);
    setName("");
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
              Workspace Organization
            </p>

            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800">
              Folders
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Organize your workspace documents and files.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadFolders}
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
                : "Create Folder"}
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
                Create Folder
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Create a folder to organize your workspace.
              </p>
            </div>

            <form
              onSubmit={handleCreate}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Folder Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Project Documents"
                  autoFocus
                  className="w-full border border-slate-300 rounded-md px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    : "Create Folder"}
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
              placeholder="Search folders..."
              className="flex-1 border border-slate-300 rounded-md px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="flex items-center justify-center sm:min-w-[120px] bg-slate-50 border border-slate-200 rounded-md px-4 py-3">
              <span className="text-sm text-slate-500">
                {filteredFolders.length}{" "}
                {filteredFolders.length ===
                1
                  ? "folder"
                  : "folders"}
              </span>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white border border-slate-200 rounded-md p-10 text-center">
            <p className="text-sm text-slate-500">
              Loading folders...
            </p>
          </div>
        )}

        {!loading &&
          filteredFolders.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-md p-8 sm:p-10 text-center">
              <h3 className="text-lg font-medium text-slate-800">
                {search
                  ? "No folders found"
                  : "No folders yet"}
              </h3>

              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                {search
                  ? "Try another folder name."
                  : "Create your first folder to organize your workspace."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={() =>
                    setShowCreate(true)
                  }
                  className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-medium transition"
                >
                  Create Folder
                </button>
              )}
            </div>
          )}

        {!loading &&
          filteredFolders.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredFolders.map(
                (folder) => (
                  <div
                    key={folder.id}
                    className="bg-white border border-slate-200 rounded-md p-5 sm:p-6 hover:border-blue-300 hover:shadow-sm transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-slate-800 break-words">
                          {folder.name}
                        </h3>

                        <div className="mt-3 space-y-1">
                          <p className="text-xs text-slate-400">
                            Folder ID: {folder.id}
                          </p>

                          <p className="text-xs text-slate-400">
                            Workspace ID:{" "}
                            {folder.workspace_id}
                          </p>

                          <p className="text-xs text-slate-400">
                            Parent:{" "}
                            {folder.parent_id ??
                              "Root"}
                          </p>
                        </div>
                      </div>

                      <span className="self-start text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full">
                        Folder
                      </span>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            folder.id
                          )
                        }
                        disabled={
                          deletingId ===
                          folder.id
                        }
                        className="border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 px-4 py-2 rounded-md text-sm font-medium transition"
                      >
                        {deletingId ===
                        folder.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
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

export default Folders;
