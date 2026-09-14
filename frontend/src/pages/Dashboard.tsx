import { useEffect, useState } from "react";
import api from "../services/api";

interface Workspace {
  id: number;
  name: string;
  description: string | null;
  role: string;
}

interface DocumentData {
  id: number;
  workspace_id: number;
  owner_id: number;
  title: string;
  content: string | null;
  folder_id: number | null;
}

interface DashboardProps {
  onLogout: () => void;
  onWorkspaces: () => void;
}

function Dashboard({
  onLogout,
  onWorkspaces,
}: DashboardProps) {
  const [showMenu, setShowMenu] =
    useState(false);

  const [activeSection, setActiveSection] =
    useState("overview");

  const [workspaces, setWorkspaces] =
    useState<Workspace[]>([]);

  const [documents, setDocuments] =
    useState<DocumentData[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const workspaceResponse =
        await api.get("/workspaces");

      const workspaceData =
        Array.isArray(
          workspaceResponse.data
        )
          ? workspaceResponse.data
          : [];

      setWorkspaces(workspaceData);

      const documentResults =
        await Promise.all(
          workspaceData.map(
            async (workspace: Workspace) => {
              try {
                const response =
                  await api.get(
                    `/documents/?workspace_id=${workspace.id}`
                  );

                return Array.isArray(
                  response.data
                )
                  ? response.data
                  : [];
              } catch {
                return [];
              }
            }
          )
        );

      const allDocuments =
        documentResults.flat();

      setDocuments(allDocuments);
    } catch (err: any) {
      console.error(
        "DASHBOARD ERROR:",
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
          "Failed to load dashboard."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleRefresh = () => {
    loadDashboard();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
              SmartDocs
            </h1>

            <p className="hidden sm:block text-xs text-slate-400">
              Document Management Platform
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setShowMenu(!showMenu)
              }
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-50 transition"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                Z
              </div>

              <span className="hidden sm:block text-sm text-slate-700">
                Zakriya
              </span>

              <span className="text-xs text-slate-400">
                {showMenu ? "▲" : "▼"}
              </span>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-12 z-30 w-44 bg-white border border-slate-200 rounded-md shadow-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setActiveSection(
                      "profile"
                    );
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Profile
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setActiveSection(
                      "settings"
                    );
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Settings
                </button>

                <div className="border-t border-slate-200" />

                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-7">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800">
              Dashboard
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Manage your workspaces and documents from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="self-start border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 px-4 py-2.5 rounded-md text-sm font-medium transition"
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md px-4 py-3">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-md mb-6 overflow-x-auto">
          <div className="flex min-w-max border-b border-slate-200">
            <button
              type="button"
              onClick={() =>
                setActiveSection("overview")
              }
              className={
                activeSection === "overview"
                  ? "px-5 py-3 text-sm text-blue-600 border-b-2 border-blue-600"
                  : "px-5 py-3 text-sm text-slate-500 hover:text-slate-800"
              }
            >
              Overview
            </button>

            <button
              type="button"
              onClick={onWorkspaces}
              className="px-5 py-3 text-sm text-slate-500 hover:text-blue-600"
            >
              Workspaces
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSection("documents")
              }
              className={
                activeSection === "documents"
                  ? "px-5 py-3 text-sm text-blue-600 border-b-2 border-blue-600"
                  : "px-5 py-3 text-sm text-slate-500 hover:text-slate-800"
              }
            >
              Documents
            </button>
          </div>
        </div>

        {activeSection === "profile" && (
          <div className="bg-white border border-slate-200 rounded-md p-6">
            <h3 className="text-lg font-medium text-slate-800">
              Profile
            </h3>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs text-slate-400">
                  Name
                </p>

                <p className="text-sm text-slate-700 mt-1">
                  Zakriya Wahid
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Role
                </p>

                <p className="text-sm text-slate-700 mt-1">
                  Developer
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === "settings" && (
          <div className="bg-white border border-slate-200 rounded-md p-6">
            <h3 className="text-lg font-medium text-slate-800">
              Settings
            </h3>

            <p className="text-sm text-slate-500 mt-2">
              Application settings will be available here.
            </p>

            <div className="mt-5 border border-slate-200 rounded-md p-4 bg-slate-50">
              <p className="text-sm text-slate-600">
                Your application is currently using the
                default SmartDocs settings.
              </p>
            </div>
          </div>
        )}

        {activeSection === "documents" && (
          <div className="bg-white border border-slate-200 rounded-md p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium text-slate-800">
                  Documents
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  You currently have{" "}
                  {documents.length}{" "}
                  {documents.length === 1
                    ? "document"
                    : "documents"}{" "}
                  across your workspaces.
                </p>
              </div>

              <button
                type="button"
                onClick={onWorkspaces}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md text-sm font-medium transition"
              >
                Open Workspaces
              </button>
            </div>

            {documents.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-5 space-y-3">
                {documents
                  .slice(0, 5)
                  .map((document) => (
                    <div
                      key={document.id}
                      className="border border-slate-200 rounded-md p-4 hover:border-blue-300 transition"
                    >
                      <p className="text-sm font-medium text-slate-800">
                        {document.title}
                      </p>

                      <p className="text-xs text-slate-400 mt-1">
                        Workspace ID:{" "}
                        {document.workspace_id}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeSection === "overview" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              <div className="bg-white border border-slate-200 rounded-md p-5 hover:border-blue-300 hover:shadow-sm transition">
                <p className="text-sm text-slate-500">
                  Workspaces
                </p>

                <p className="text-3xl font-semibold text-slate-800 mt-2">
                  {loading
                    ? "—"
                    : workspaces.length}
                </p>

                <button
                  type="button"
                  onClick={onWorkspaces}
                  className="text-sm text-blue-600 hover:text-blue-700 mt-3"
                >
                  View workspaces
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-md p-5 hover:border-blue-300 hover:shadow-sm transition">
                <p className="text-sm text-slate-500">
                  Documents
                </p>

                <p className="text-3xl font-semibold text-slate-800 mt-2">
                  {loading
                    ? "—"
                    : documents.length}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setActiveSection(
                      "documents"
                    )
                  }
                  className="text-sm text-blue-600 hover:text-blue-700 mt-3"
                >
                  View documents
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-md p-5 hover:border-blue-300 hover:shadow-sm transition">
                <p className="text-sm text-slate-500">
                  Active Workspaces
                </p>

                <p className="text-3xl font-semibold text-green-600 mt-2">
                  {loading
                    ? "—"
                    : workspaces.filter(
                        (workspace) =>
                          workspace.role
                      ).length}
                </p>

                <button
                  type="button"
                  onClick={onWorkspaces}
                  className="text-sm text-blue-600 hover:text-blue-700 mt-3"
                >
                  Manage workspaces
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-6">
              <div className="bg-white border border-slate-200 rounded-md p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-slate-800">
                      My Workspaces
                    </h3>

                    <p className="text-sm text-slate-500 mt-1">
                      Your recently available workspaces.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onWorkspaces}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {loading && (
                    <div className="border border-slate-200 rounded-md p-4">
                      <p className="text-sm text-slate-500">
                        Loading workspaces...
                      </p>
                    </div>
                  )}

                  {!loading &&
                    workspaces.length ===
                      0 && (
                      <div className="border border-slate-200 rounded-md p-5 text-center">
                        <p className="text-sm text-slate-500">
                          No workspaces yet.
                        </p>

                        <button
                          type="button"
                          onClick={
                            onWorkspaces
                          }
                          className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                        >
                          Create Workspace
                        </button>
                      </div>
                    )}

                  {!loading &&
                    workspaces
                      .slice(0, 4)
                      .map(
                        (workspace) => (
                          <div
                            key={
                              workspace.id
                            }
                            className="border border-slate-200 rounded-md p-4 hover:border-blue-300 transition"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 break-words">
                                  {
                                    workspace.name
                                  }
                                </p>

                                <p className="text-xs text-slate-400 mt-1">
                                  {workspace.description ||
                                    "No description"}
                                </p>
                              </div>

                              <span className="shrink-0 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full">
                                {workspace.role ||
                                  "active"}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-md p-6">
                <h3 className="text-lg font-medium text-slate-800">
                  Quick Actions
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  Common actions for managing your project.
                </p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={onWorkspaces}
                    className="border border-slate-300 rounded-md p-4 text-left hover:border-blue-300 hover:bg-slate-50 transition"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      Open Workspaces
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Manage your workspaces.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveSection(
                        "documents"
                      )
                    }
                    className="border border-slate-300 rounded-md p-4 text-left hover:border-blue-300 hover:bg-slate-50 transition"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      View Documents
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Check your recent documents.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="border border-slate-300 rounded-md p-4 text-left hover:border-blue-300 hover:bg-slate-50 transition"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      Refresh Data
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Load the latest information.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveSection(
                        "profile"
                      )
                    }
                    className="border border-slate-300 rounded-md p-4 text-left hover:border-blue-300 hover:bg-slate-50 transition"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      View Profile
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      View your account information.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
