from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.documents import router as documents_router
from app.routes.workspace_member import router as workspace_member_router
from app.routes.workspaces import router as workspaces_router
from app.routes.upload import router as upload_router
from app.routes.permissions import router as permissions_router
from app.routes.folder import router as folders_router
from app.routes.comments import router as comments_router

from app.models.document_version import DocumentVersion
from app.models.folder import Folder


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="Smart Document Platform API",
    version="1.0.0",
    description="Smart Document Collaboration Platform API"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(auth_router)

app.include_router(documents_router)

app.include_router(workspace_member_router)

app.include_router(workspaces_router)

app.include_router(upload_router)

app.include_router(permissions_router)

app.include_router(folders_router)

# Comments + Real-time WebSocket
app.include_router(comments_router)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Smart Document Platform API is running",
        "status": "ok",
        "version": "1.0.0"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
