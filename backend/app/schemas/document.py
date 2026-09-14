from pydantic import BaseModel


class DocumentCreate(BaseModel):
    title: str
    content: str
    workspace_id: int
    folder_id: int | None = None


class DocumentUpdate(BaseModel):
    title: str
    content: str
    folder_id: int | None = None


class DocumentMove(BaseModel):
    folder_id: int