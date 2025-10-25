from typing import List, Dict
from pathlib import Path


def chunk_files(
    file_objects: List[Dict],
    repo_name: str,
    chunk_size: int = 1000,
    overlap: int = 200,
) -> List[Dict]:
    """
    Chunk files into smaller pieces for embedding.

    Args:
        file_objects: List of file dictionaries with content and metadata
        repo_name: Name of the repository (for deterministic chunk IDs)
        chunk_size: Maximum size of each chunk in characters
        overlap: Number of characters to overlap between chunks

    Returns:
        List of chunk dictionaries with deterministic IDs
    """
    chunks = []

    for file_obj in file_objects:
        content = file_obj["content"]
        source = file_obj["source"]
        metadata = file_obj["metadata"]

        # Create a relative path for cleaner IDs (remove leading slash if present)
        file_path_relative = source.lstrip("/")

        # if the file is smaller than chunk size, no need to chunk
        if len(content) <= chunk_size:
            chunk_id = f"{repo_name}::{file_path_relative}::chunk_0"
            chunks.append(
                {
                    "id": chunk_id,
                    "document": content,
                    "metadata": {
                        "file_path": source,
                        "chunk_index": 0,
                        "total_chunks": 1,
                        **metadata,
                    },
                }
            )
            continue

        start = 0
        file_chunks = []

        # create chunks with overlap

        while start < len(content):
            end = start + chunk_size

            if end < len(content):
                newline_pos = content.rfind("\n", start, end)
                if newline_pos != -1 and newline_pos > start + chunk_size // 2:
                    end = newline_pos + 1

            chunk_text = content[start:end]
            file_chunks.append(chunk_text)
            start = end - overlap if end < len(content) else end

        for idx, chunk_text in enumerate(file_chunks):
            chunk_id = f"{repo_name}::{file_path_relative}::chunk_{idx}"
            chunks.append(
                {
                    "id": chunk_id,
                    "document": chunk_text,
                    "metadata": {
                        "file_path": source,
                        "chunk_index": idx,
                        "total_chunks": len(file_chunks),
                        **metadata,
                    },
                }
            )

    return chunks
