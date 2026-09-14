import { useEffect, useState } from "react";
import api from "../services/api";
import Documents from "./Documents";
import Files from "./Files";
import Folders from "./Folders";

interface Workspace {
  id: number;
  name: string;
  description: string | null;
  role: string;
}

interface WorkspaceDetailsProps {
  workspaceId: number;
  onBack: () => void;
  onOpenDocument: (documentId: number) => void;
}

function WorkspaceDetails({
  workspaceId,
  onBack,
  onOpenDocument,
}: WorkspaceDetailsProps) {
  const [workspace, setWorkspace] =
    useState<Workspace | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [activeSection, setActiveSection] =
    useState("overview");

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/workspaces/${workspaceId}`
      );

      setWorkspace(response.data);
    } catch (err: any) {
      console.error(
        "WORKSPACE DETAILS ERROR:",
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
          "Failed to load workspace."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [workspaceId]);

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
              type="button"
              onClick={onBack}
              className="text-sm text-slate-600 hover:text-blue-600 transition"
            >
              Workspaces
            </button>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-6 py-10">
          <div className="bg-white border border-slate-200 rounded-md p-10 text-center">
            <p className="text-sm text-slate-500">
              Loading workspace...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !workspace) {
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
              type="button"
              onClick={onBack}
              className="text-sm text-slate-600 hover:text-blue-600 transition"
            >
              Workspaces
            </button>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-6 py-10">
          <div className="bg-white border border-red-200 rounded-md p-8">
            <h2 className="text-lg font-medium text-slate-800">
              Workspace unavailable
            </h2>

            <p className="text-sm text-red-600 mt-2">
              {error ||
                "Workspace could not be found."}
            </p>

            <button
              type="button"
              onClick={onBack}
              className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-medium transition"
            >
              Back to Workspaces
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (activeSection === "documents") {
    return (
      <Documents
        workspaceId={workspaceId}
        onOpenDocument={onOpenDocument}
        onBack={() =>
          setActiveSection("overview")
        }
      />
    );
  }

  if (activeSection === "files") {
    return (
      <Files
        workspaceId={workspaceId}
        onBack={() =>
          setActiveSection("overview")
        }
      />
    );
  }

  if (activeSection === "folders") {
    return (
      <Folders
        workspaceId={workspaceId}
        onBack={() =>
          setActiveSection("overview")
        }
      />
    );
  }

  if (activeSection === "members") {
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
              type="button"
              onClick={() =>
                setActiveSection("overview")
              }
              className="text-sm text-slate-600 hover:text-blue-600 transition"
            >
              Workspace
            </button>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-6 py-8">
          <button
            type="button"
            onClick={() =>
              setActiveSection("overview")
            }
            className="text-sm text-slate-500 hover:text-blue-600 transition mb-6"
          >
            Back to Workspace
          </button>

          <div className="bg-white border border-slate-200 rounded-md p-8">
            <h2 className="text-xl font-semibold text-slate-800">
              Members
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Workspace members and permissions will be
              managed here.
            </p>

            <button
              type="button"
              onClick={() =>
                alert(
                  "Member management is coming next."
                )
              }
              className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-medium transition"
            >
              Manage Members
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
            type="button"
            onClick={onBack}
            className="text-sm text-slate-600 hover:text-blue-600 transition"
          >
            Workspaces
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-blue-600 transition mb-6"
        >
          Back to Workspaces
        </button>

        <div className="bg-white border border-slate-200 rounded-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">
                {workspace.name}
              </h2>

              <p className="text-sm text-slate-500 mt-2 max-w-2xl">
                {workspace.description ||
                  "No description available for this workspace."}
              </p>
            </div>

            <span className="self-start text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full">
              owner
            </span>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <p className="text-xs text-slate-400">
                Workspace ID
              </p>

              <p className="text-sm font-medium text-slate-700 mt-1">
                {workspace.id}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Your Role
              </p>

              <p className="text-sm font-medium text-slate-700 mt-1 capitalize">
                {workspace.role || "Member"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Status
              </p>

              <p className="text-sm font-medium text-green-600 mt-1">
                Active
              </p>
            </div>
          </div>
        </div>

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

            <button
              type="button"
              onClick={() =>
                setActiveSection("files")
              }
              className={
                activeSection === "files"
                  ? "px-5 py-3 text-sm text-blue-600 border-b-2 border-blue-600"
                  : "px-5 py-3 text-sm text-slate-500 hover:text-slate-800"
              }
            >
              Files
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSection("folders")
              }
              className={
                activeSection === "folders"
                  ? "px-5 py-3 text-sm text-blue-600 border-b-2 border-blue-600"
                  : "px-5 py-3 text-sm text-slate-500 hover:text-slate-800"
              }
            >
              Folders
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSection("members")
              }
              className={
                activeSection === "members"
                  ? "px-5 py-3 text-sm text-blue-600 border-b-2 border-blue-600"
                  : "px-5 py-3 text-sm text-slate-500 hover:text-slate-800"
              }
            >
              Members
            </button>

          </div>
        </div>

        {activeSection === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="bg-white border border-slate-200 rounded-md p-6 hover:border-blue-300 hover:shadow-sm transition">
              <p className="text-sm text-slate-500">
                Documents
              </p>

              <p className="text-sm text-slate-700 mt-2">
                Create, edit, search and manage documents.
              </p>

              <button
                type="button"
                onClick={() =>
                  setActiveSection("documents")
                }
                className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
              >
                Open Documents
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-6 hover:border-blue-300 hover:shadow-sm transition">
              <p className="text-sm text-slate-500">
                Files
              </p>

              <p className="text-sm text-slate-700 mt-2">
                Upload, download, rename and delete files.
              </p>

              <button
                type="button"
                onClick={() =>
                  setActiveSection("files")
                }
                className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
              >
                Open Files
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-6 hover:border-blue-300 hover:shadow-sm transition">
              <p className="text-sm text-slate-500">
                Folders
              </p>

              <p className="text-sm text-slate-700 mt-2">
                Organize documents and files into folders.
              </p>

              <button
                type="button"
                onClick={() =>
                  setActiveSection("folders")
                }
                className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
              >
                Open Folders
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-6 hover:border-blue-300 hover:shadow-sm transition">
              <p className="text-sm text-slate-500">
                Members
              </p>

              <p className="text-sm text-slate-700 mt-2">
                Manage members and document permissions.
              </p>

              <button
                type="button"
                onClick={() =>
                  setActiveSection("members")
                }
                className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
              >
                Open Members
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default WorkspaceDetails;
