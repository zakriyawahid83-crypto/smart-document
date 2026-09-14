import { useState } from "react";

import Login from "./pages/login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Workspaces from "./pages/Workspace";
import WorkspaceDetails from "./pages/WorkspaceDetails";
import DocumentEditor from "./pages/DocumentEditor";

type Page =
  | "login"
  | "register"
  | "dashboard"
  | "workspaces"
  | "workspace"
  | "document";

function App() {
  const [page, setPage] =
    useState<Page>("login");

  const [selectedWorkspaceId, setSelectedWorkspaceId] =
    useState<number | null>(null);

  const [selectedDocumentId, setSelectedDocumentId] =
    useState<number | null>(null);

  const handleLogin = () => {
    setPage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");

    setSelectedWorkspaceId(null);
    setSelectedDocumentId(null);

    setPage("login");
  };

  const handleRegister = () => {
    setPage("register");
  };

  const handleBackToLogin = () => {
    setPage("login");
  };

  const handleOpenWorkspace = (
    workspaceId: number
  ) => {
    setSelectedWorkspaceId(
      workspaceId
    );

    setSelectedDocumentId(null);

    setPage("workspace");
  };

  const handleOpenDocument = (
    documentId: number
  ) => {
    setSelectedDocumentId(
      documentId
    );

    setPage("document");
  };

  const handleBackToWorkspaces = () => {
    setSelectedWorkspaceId(null);
    setSelectedDocumentId(null);

    setPage("workspaces");
  };

  const handleBackToWorkspace = () => {
    setSelectedDocumentId(null);

    setPage("workspace");
  };

  if (page === "login") {
    return (
      <Login
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  if (page === "register") {
    return (
      <Register
        onRegisterSuccess={() =>
          setPage("login")
        }
        onLogin={handleBackToLogin}
      />
    );
  }

  if (page === "dashboard") {
    return (
      <Dashboard
        onLogout={handleLogout}
        onWorkspaces={() =>
          setPage("workspaces")
        }
      />
    );
  }

  if (page === "workspaces") {
    return (
      <Workspaces
        onBack={() =>
          setPage("dashboard")
        }
        onOpenWorkspace={
          handleOpenWorkspace
        }
      />
    );
  }

  if (page === "workspace") {
    if (
      selectedWorkspaceId === null
    ) {
      return (
        <Workspaces
          onBack={() =>
            setPage("dashboard")
          }
          onOpenWorkspace={
            handleOpenWorkspace
          }
        />
      );
    }

    return (
      <WorkspaceDetails
        workspaceId={
          selectedWorkspaceId
        }
        onBack={
          handleBackToWorkspaces
        }
        onOpenDocument={
          handleOpenDocument
        }
      />
    );
  }

  if (page === "document") {
    if (
      selectedDocumentId === null
    ) {
      return (
        <Dashboard
          onLogout={handleLogout}
          onWorkspaces={() =>
            setPage("workspaces")
          }
        />
      );
    }

    return (
      <DocumentEditor
        documentId={
          selectedDocumentId
        }
        onBack={
          handleBackToWorkspace
        }
      />
    );
  }

  return null;
}

export default App;
