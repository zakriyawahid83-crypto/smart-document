from pydantic import BaseModel


class FolderCreate(BaseModel):
    name: str
    workspace_id: int
    parent_id: int | None = None


class FolderResponse(BaseModel):
    id: int
    name: str
    workspace_id: int
    parent_id: int | None

    class Config:
        from_attributes = True
