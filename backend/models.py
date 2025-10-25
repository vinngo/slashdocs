from pydantic import BaseModel

class IngestRequest(BaseModel):
    repo_url: str

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str