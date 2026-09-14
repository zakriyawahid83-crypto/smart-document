from pydantic import BaseModel


class WorkspaceCreate(BaseModel):
    name: str


class WorkspaceResponse(BaseModel):
    id: int
    name: str
    owner_id: int

    class Config:
        from_attributes = True