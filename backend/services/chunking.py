from typing import List, Dict
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class ChunkingError(Exception):
    """Raised when chunking fails for a specific file."""

    pass


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

    Raises:
        ValueError: If parameters are invalid (chunk_size, overlap, repo_name)

    Note:
        Files with errors are logged and skipped rather than failing the entire batch.
    """
    # Validate parameters
    if not file_objects:
        logger.warning("Empty file_objects list provided to chunk_files")
        return []

    if not repo_name or not isinstance(repo_name, str):
        raise ValueError("repo_name must be a non-empty string")

    if chunk_size <= 0:
        raise ValueError(f"chunk_size must be positive, got {chunk_size}")

    if overlap < 0:
        raise ValueError(f"overlap must be non-negative, got {overlap}")

    if overlap >= chunk_size:
        raise ValueError(
            f"overlap ({overlap}) must be less than chunk_size ({chunk_size})"
        )

    chunks = []
    skipped_files = []

    for file_index, file_obj in enumerate(file_objects):
        source = None  # Initialize to avoid UnboundLocalError in exception handlers
        try:
            # Validate file_obj structure
            if not isinstance(file_obj, dict):
                raise ChunkingError(f"File object at index {file_index} is not a dict")

            # Extract with error handling
            content = file_obj.get("content")
            source = file_obj.get("source")
            metadata = file_obj.get("metadata", {})

            # Validate required fields
            if content is None:
                raise ChunkingError(
                    f"Missing 'content' field in file object at index {file_index}"
                )

            if not source:
                raise ChunkingError(
                    f"Missing or empty 'source' field in file object at index {file_index}"
                )

            # Validate content type
            if not isinstance(content, str):
                raise ChunkingError(
                    f"Content must be a string, got {type(content).__name__} for {source}"
                )

            # Skip empty files
            if len(content.strip()) == 0:
                logger.warning(f"Skipping empty file: {source}")
                skipped_files.append(source)
                continue

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

        except ChunkingError as e:
            logger.error(f"Chunking error: {e}")
            skipped_files.append(source or f"file_index_{file_index}")
            continue

        except KeyError as e:
            logger.error(f"Missing key {e} in file object at index {file_index}")
            skipped_files.append(source or f"file_index_{file_index}")
            continue

        except Exception as e:
            logger.error(
                f"Unexpected error processing file {source or file_index}: {type(e).__name__}: {e}"
            )
            skipped_files.append(source or f"file_index_{file_index}")
            continue

    # Log summary
    if skipped_files:
        logger.warning(
            f"Skipped {len(skipped_files)} files during chunking: {skipped_files[:5]}{'...' if len(skipped_files) > 5 else ''}"
        )

    logger.info(
        f"Successfully created {len(chunks)} chunks from {len(file_objects) - len(skipped_files)} files"
    )

    return chunks
