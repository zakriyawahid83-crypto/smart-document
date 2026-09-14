from typing import Dict, List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
)
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import SECRET_KEY, ALGORITHM
from app.database import get_db, SessionLocal
from app.models.comment import Comment
from app.models.document import Document
from app.models.user import User
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/comments",
    tags=["Comments"]
)


# =========================================================
# WEBSOCKET CONNECTION MANAGER
# =========================================================

class ConnectionManager:

    def __init__(self):
        self.active_connections: Dict[
            int,
            List[WebSocket]
        ] = {}

    async def connect(
        self,
        document_id: int,
        websocket: WebSocket
    ):
        await websocket.accept()

        if document_id not in self.active_connections:
            self.active_connections[document_id] = []

        self.active_connections[document_id].append(
            websocket
        )

    def disconnect(
        self,
        document_id: int,
        websocket: WebSocket
    ):
        connections = self.active_connections.get(
            document_id
        )

        if not connections:
            return

        if websocket in connections:
            connections.remove(websocket)

        if not connections:
            self.active_connections.pop(
                document_id,
                None
            )

    async def broadcast(
        self,
        document_id: int,
        message: dict
    ):
        connections = self.active_connections.get(
            document_id,
            []
        ).copy()

        for websocket in connections:
            try:
                await websocket.send_json(message)

            except Exception:
                self.disconnect(
                    document_id,
                    websocket
                )


manager = ConnectionManager()


# =========================================================
# CREATE COMMENT
# =========================================================

@router.post("/")
async def create_comment(
    document_id: int,
    content: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = content.strip()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Comment content is required"
        )

    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    comment = Comment(
        content=content,
        user_id=current_user.id,
        workspace_id=document.workspace_id,
        document_id=document_id
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    message = {
        "type": "comment_created",
        "comment": {
            "id": comment.id,
            "content": comment.content,
            "user_id": comment.user_id,
            "workspace_id": comment.workspace_id,
            "document_id": comment.document_id,
        }
    }

    await manager.broadcast(
        document_id,
        message
    )

    return comment


# =========================================================
# GET COMMENTS
# =========================================================

@router.get("/{document_id}")
async def get_comments(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    comments = db.query(Comment).filter(
        Comment.document_id == document_id
    ).order_by(
        Comment.id.asc()
    ).all()

    return comments


# =========================================================
# UPDATE COMMENT
# =========================================================

@router.put("/{comment_id}")
async def update_comment(
    comment_id: int,
    content: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = content.strip()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Comment content is required"
        )

    comment = db.query(Comment).filter(
        Comment.id == comment_id
    ).first()

    if not comment:
        raise HTTPException(
            status_code=404,
            detail="Comment not found"
        )

    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only comment owner can update comment"
        )

    comment.content = content

    db.commit()
    db.refresh(comment)

    message = {
        "type": "comment_updated",
        "comment": {
            "id": comment.id,
            "content": comment.content,
            "user_id": comment.user_id,
            "workspace_id": comment.workspace_id,
            "document_id": comment.document_id,
        }
    }

    await manager.broadcast(
        comment.document_id,
        message
    )

    return comment


# =========================================================
# DELETE COMMENT
# =========================================================

@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(
        Comment.id == comment_id
    ).first()

    if not comment:
        raise HTTPException(
            status_code=404,
            detail="Comment not found"
        )

    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only comment owner can delete comment"
        )

    document_id = comment.document_id

    db.delete(comment)
    db.commit()

    await manager.broadcast(
        document_id,
        {
            "type": "comment_deleted",
            "comment_id": comment_id
        }
    )

    return {
        "message": "Comment deleted successfully",
        "comment_id": comment_id
    }


# =========================================================
# SECURE WEBSOCKET
# =========================================================

@router.websocket("/ws/{document_id}")
async def comment_websocket(
    websocket: WebSocket,
    document_id: int
):
    """
    Secure WebSocket.

    Token:
    /comments/ws/{document_id}?token=JWT_TOKEN
    """

    token = websocket.query_params.get("token")

    # -----------------------------------------------------
    # TOKEN MISSING
    # -----------------------------------------------------

    if not token:
        print(
            "WebSocket rejected: token missing"
        )

        await websocket.close(
            code=1008
        )

        return

    # -----------------------------------------------------
    # VERIFY JWT
    # -----------------------------------------------------

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            print(
                "WebSocket rejected: user ID missing"
            )

            await websocket.close(
                code=1008
            )

            return

        user_id = int(user_id)

    except (
        JWTError,
        ValueError,
        TypeError
    ):
        print(
            "WebSocket rejected: invalid token"
        )

        await websocket.close(
            code=1008
        )

        return

    # -----------------------------------------------------
    # CHECK USER
    # -----------------------------------------------------

    db = SessionLocal()

    try:

        user = db.query(User).filter(
            User.id == user_id
        ).first()

        if not user:
            print(
                "WebSocket rejected: user not found"
            )

            await websocket.close(
                code=1008
            )

            return

        # -------------------------------------------------
        # CONNECTION ACCEPT
        # -------------------------------------------------

        await manager.connect(
            document_id,
            websocket
        )

        print(
            f"Secure WebSocket connected: "
            f"user={user.id}, "
            f"document={document_id}"
        )

        # Send authentication confirmation
        await websocket.send_json(
            {
                "type": "authenticated",
                "user_id": user.id
            }
        )

        # -------------------------------------------------
        # RECEIVE MESSAGES
        # -------------------------------------------------

        try:

            while True:

                data = await websocket.receive_json()

                # Ping/Pong
                if data.get("type") == "ping":

                    await websocket.send_json(
                        {
                            "type": "pong"
                        }
                    )

        except WebSocketDisconnect:

            manager.disconnect(
                document_id,
                websocket
            )

            print(
                f"WebSocket disconnected: "
                f"user={user.id}, "
                f"document={document_id}"
            )

    finally:
        db.close()