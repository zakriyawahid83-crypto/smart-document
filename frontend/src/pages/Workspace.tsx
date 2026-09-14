import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

interface Workspace {
  id: number;
  name: string;
  description: string | null;
  role: string;
}

interface WorkspaceProps {
  onBack: () => void;
  onOpenWorkspace: (workspaceId: number) => void;
}

function Workspaces({
  onBack,
  onOpenWorkspace,
}: WorkspaceProps) {
  const [workspaces, setWorkspaces] =
    useState<Workspace[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [showCreate, setShowCreate] =
    useState(false);

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [search, setSearch] =
    useState("");

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/workspaces");

      setWorkspaces(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err: any) {
      console.error(
        "WORKSPACES ERROR:",
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
          "Failed to load workspaces."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleCreate = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      setError(
        "Workspace name is required."
      );
      return;
    }

    try {
      setCreating(true);
      setError("");
      setMessage("");

      await api.post("/workspaces", {
        name: name.trim(),
        description:
          description.trim() || null,
      });

      setName("");
      setDescription("");
      setShowCreate(false);

      setMessage(
        "Workspace created successfully."
      );

      await loadWorkspaces();
    } catch (err: any) {
      console.error(
        "CREATE WORKSPACE ERROR:",
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
          "Failed to create workspace."
        );
      }
    } finally {
      setCreating(false);
    }
  };

  const filteredWorkspaces =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return workspaces;
      }

      return workspaces.filter(
        (workspace) => {
          const text =
            `${workspace.name} ${
              workspace.description || ""
            }`.toLowerCase();

          return text.includes(value);
        }
      );
    }, [workspaces, search]);

  const closeCreateForm = () => {
    setShowCreate(false);
    setName("");
    setDescription("");
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
            Dashboard
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-7">
          <div>
            <p className="text-xs text-slate-400 mb-1">
              Workspace Management
            </p>

            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800">
              My Workspaces
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Create and manage the spaces where your documents are stored.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadWorkspaces}
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
                : "Create Workspace"}
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
                Create Workspace
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Add a name and optional description for your new workspace.
              </p>
            </div>

            <form
              onSubmit={handleCreate}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Workspace Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. College Project"
                  autoFocus
                  className="w-full border border-slate-300 rounded-md px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="What will you use this workspace for?"
                  rows={4}
                  className="w-full border border-slate-300 rounded-md px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
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
                    : "Create Workspace"}
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
              placeholder="Search workspaces..."
              className="flex-1 border border-slate-300 rounded-md px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="flex items-center justify-center sm:min-w-[120px] bg-slate-50 border border-slate-200 rounded-md px-4 py-3">
              <span className="text-sm text-slate-500">
                {filteredWorkspaces.length}{" "}
                {filteredWorkspaces.length ===
                1
                  ? "workspace"
                  : "workspaces"}
              </span>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white border border-slate-200 rounded-md p-10 text-center">
            <p className="text-sm text-slate-500">
              Loading workspaces...
            </p>
          </div>
        )}

        {!loading &&
          filteredWorkspaces.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-md p-8 sm:p-10 text-center">
              <h3 className="text-lg font-medium text-slate-800">
                {search
                  ? "No workspace found"
                  : "No workspaces yet"}
              </h3>

              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                {search
                  ? "Try searching with another name or description."
                  : "Create your first workspace to start organizing your documents."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={() =>
                    setShowCreate(true)
                  }
                  className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-medium transition"
                >
                  Create Workspace
                </button>
              )}
            </div>
          )}

        {!loading &&
          filteredWorkspaces.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredWorkspaces.map(
                (workspace) => (
                  <div
                    key={workspace.id}
                    className="bg-white border border-slate-200 rounded-md p-5 sm:p-6 hover:border-blue-300 hover:shadow-sm transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-slate-800 break-words">
                          {workspace.name}
                        </h3>

                        <p className="text-sm text-slate-500 mt-2 break-words min-h-[40px]">
                          {workspace.description ||
                            "No description available."}
                        </p>
                      </div>

                      <span className="self-start shrink-0 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">
                        {workspace.role ||
                          "active"}
                      </span>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <span className="text-xs text-slate-400">
                        Workspace ID:{" "}
                        {workspace.id}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          onOpenWorkspace(
                            workspace.id
                          )
                        }
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-medium transition"
                      >
                        Open Workspace
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

export default Workspaces;
