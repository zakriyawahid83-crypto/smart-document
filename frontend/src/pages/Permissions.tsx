import { useState } from "react";
import api from "../services/api";

interface PermissionsProps {
  documentId: number;
  workspaceId: number;
  onClose: () => void;
}

type PermissionRole =
  | "editor"
  | "viewer"
  | "commenter";

type SharingMode =
  | "private"
  | "workspace"
  | "link";

function Permissions({
  documentId,
  workspaceId,
  onClose,
}: PermissionsProps) {
  const [sharingMode, setSharingMode] =
    useState<SharingMode>("private");

  const [userId, setUserId] =
    useState("");

  const [role, setRole] =
    useState<PermissionRole>("viewer");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const handlePermissionSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!userId.trim()) {
      setError("User ID is required.");
      return;
    }

    const parsedUserId = Number(
      userId.trim()
    );

    if (!Number.isInteger(parsedUserId)) {
      setError(
        "User ID must be a valid number."
      );
      return;
    }

    try {
      setLoading(true);

      await api.post(
        "/permissions/",
        null,
        {
          params: {
            document_id: documentId,
            user_id: parsedUserId,
            role,
            workspace_id: workspaceId,
          },
        }
      );

      setMessage(
        "Permission updated successfully."
      );

      setUserId("");
    } catch (err: any) {
      console.error(
        "PERMISSION ERROR:",
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
          "Failed to update permission."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 px-4 py-6 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white rounded-lg border border-slate-200 shadow-lg">

          <div className="p-5 sm:p-6 border-b border-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Sharing & Permissions
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Control who can access this document.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-6">

            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 rounded-md px-4 py-3">
                <p className="text-sm text-red-600">
                  {error}
                </p>
              </div>
            )}

            {message && (
              <div className="mb-5 bg-green-50 border border-green-200 rounded-md px-4 py-3">
                <p className="text-sm text-green-700">
                  {message}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-slate-700">
                Sharing Access
              </h3>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setSharingMode(
                      "private"
                    )
                  }
                  className={
                    sharingMode === "private"
                      ? "text-left rounded-md border border-blue-500 bg-blue-50 p-4"
                      : "text-left rounded-md border border-slate-200 hover:border-blue-300 p-4 transition"
                  }
                >
                  <p className="text-sm font-medium text-slate-800">
                    Private
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Only you and explicitly shared users.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSharingMode(
                      "workspace"
                    )
                  }
                  className={
                    sharingMode === "workspace"
                      ? "text-left rounded-md border border-blue-500 bg-blue-50 p-4"
                      : "text-left rounded-md border border-slate-200 hover:border-blue-300 p-4 transition"
                  }
                >
                  <p className="text-sm font-medium text-slate-800">
                    Workspace Only
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Available to members of this workspace.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSharingMode(
                      "link"
                    )
                  }
                  className={
                    sharingMode === "link"
                      ? "text-left rounded-md border border-blue-500 bg-blue-50 p-4"
                      : "text-left rounded-md border border-slate-200 hover:border-blue-300 p-4 transition"
                  }
                >
                  <p className="text-sm font-medium text-slate-800">
                    Anyone with Link
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Link-based access can be enabled later.
                  </p>
                </button>

              </div>
            </div>

            <div className="mt-7 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-medium text-slate-700">
                Share with a User
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Enter the user's ID and select their permission.
              </p>

              <form
                onSubmit={
                  handlePermissionSubmit
                }
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    User ID
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={userId}
                    onChange={(event) =>
                      setUserId(
                        event.target.value
                      )
                    }
                    placeholder="Enter user ID"
                    className="w-full border border-slate-300 rounded-md px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Permission
                  </label>

                  <select
                    value={role}
                    onChange={(event) =>
                      setRole(
                        event.target
                          .value as PermissionRole
                      )
                    }
                    className="w-full border border-slate-300 rounded-md px-4 py-3 text-sm text-slate-800 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="viewer">
                      Viewer
                    </option>

                    <option value="commenter">
                      Commenter
                    </option>

                    <option value="editor">
                      Editor
                    </option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2.5 rounded-md text-sm font-medium transition"
                  >
                    {loading
                      ? "Saving..."
                      : "Save Permission"}
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="border border-slate-300 hover:bg-slate-50 text-slate-600 px-5 py-2.5 rounded-md text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-7 pt-6 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                <div className="border border-slate-200 rounded-md p-4">
                  <p className="text-xs text-slate-400">
                    Document
                  </p>

                  <p className="text-sm font-medium text-slate-700 mt-1">
                    #{documentId}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-md p-4">
                  <p className="text-xs text-slate-400">
                    Workspace
                  </p>

                  <p className="text-sm font-medium text-slate-700 mt-1">
                    #{workspaceId}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-md p-4">
                  <p className="text-xs text-slate-400">
                    Current Access
                  </p>

                  <p className="text-sm font-medium text-slate-700 mt-1 capitalize">
                    {sharingMode ===
                    "workspace"
                      ? "Workspace Only"
                      : sharingMode ===
                        "link"
                      ? "Anyone with Link"
                      : "Private"}
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Permissions;
