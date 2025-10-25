"""
Pydantic models for documentation generation.
These models match the frontend TypeScript interfaces.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime


class Section(BaseModel):
    """
    Documentation section with markdown content.
    Matches frontend Section interface.
    """

    id: int = Field(..., description="Unique section identifier")
    title: str = Field(..., description="Section title")
    content: str = Field(..., description="Markdown content for the section")

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "title": "Overview",
                "content": "# Overview\n\nThis is a project...",
            }
        }


class FileNode(BaseModel):
    """
    Represents a file or folder in the repository tree structure.
    Matches frontend FileNode interface.
    """

    name: str = Field(..., description="File or folder name")
    path: str = Field(..., description="Full path from repository root")
    type: Literal["file", "folder"] = Field(..., description="Node type")
    children: Optional[List["FileNode"]] = Field(
        None, description="Child nodes (only for folders)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "name": "src",
                "path": "src",
                "type": "folder",
                "children": [
                    {"name": "main.py", "path": "src/main.py", "type": "file"}
                ],
            }
        }


class DocumentationMetadata(BaseModel):
    """
    Metadata about the indexed repository.
    Matches frontend metadata interface.
    """

    repo_name: str = Field(..., description="Repository name")
    repo_url: Optional[str] = Field(None, description="Repository URL")
    language: str = Field(..., description="Primary programming language")
    framework: Optional[str] = Field(None, description="Primary framework used")
    file_count: int = Field(..., description="Total number of indexed files")
    line_count: int = Field(..., description="Estimated total lines of code")
    indexed_at: str = Field(..., description="ISO timestamp of indexing")

    class Config:
        json_schema_extra = {
            "example": {
                "repo_name": "slashdocs",
                "repo_url": "https://github.com/user/slashdocs",
                "language": "Python",
                "framework": "FastAPI",
                "file_count": 42,
                "line_count": 3500,
                "indexed_at": "2025-10-25T10:30:00Z",
            }
        }


class DocsData(BaseModel):
    """
    Complete documentation data structure.
    Matches frontend DocsData interface.
    """

    sections: List[Section] = Field(
        ..., description="Documentation sections", min_length=1
    )
    file_tree: List[FileNode] = Field(..., description="Repository file tree structure")
    metadata: DocumentationMetadata = Field(..., description="Repository metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "sections": [
                    {
                        "id": 1,
                        "title": "Overview",
                        "content": "# Overview\n\nProject description...",
                    }
                ],
                "file_tree": [
                    {"name": "src", "path": "src", "type": "folder", "children": []}
                ],
                "metadata": {
                    "repo_name": "myrepo",
                    "language": "Python",
                    "file_count": 10,
                    "line_count": 500,
                    "indexed_at": "2025-10-25T10:30:00Z",
                },
            }
        }


# Enable forward references for recursive FileNode model
FileNode.model_rebuild()
