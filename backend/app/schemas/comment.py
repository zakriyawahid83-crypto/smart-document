from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CommentCreate(BaseModel):
    content: str


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: int
    content: str
    user_id: int
    workspace_id: int
    document_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)