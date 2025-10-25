from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Mapping, MutableMapping, Sequence

from chromadb.api import ClientAPI
from openai import OpenAI

from . import chromadb_service

DEFAULT_CHUNK_SIZE = 1000
DEFAULT_CHUNK_OVERLAP = 200


def chunk_texts(
    text: str,
    source: str,
    *,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> List[MutableMapping[str, Any]]:
    """Split a single document into overlapping character chunks."""
    if chunk_size <= overlap:
        raise ValueError("chunk_size must be greater than overlap to make progress.")

    chunks: List[MutableMapping[str, Any]] = []
    start = 0
    idx = 0
    text_length = len(text)

    while start < text_length:
        end = min(start + chunk_size, text_length)
        chunk_content = text[start:end]
        chunk_record: MutableMapping[str, Any] = {
            "source": source,
            "chunk_id": f"{source}#chunk-{idx}",
            "content": chunk_content,
        }
        chunks.append(chunk_record)

        if end == text_length:
            break

        start = end - overlap
        idx += 1

    return chunks


def chunk_repo_files(
    repo_files: Sequence[Mapping[str, object]],
    *,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> List[MutableMapping[str, Any]]:
    """Chunk each entry returned by repo_handler.ingest_repo or preprocessing.load_files."""
    chunk_results: List[MutableMapping[str, Any]] = []

    for entry in repo_files:
        file_name = _extract_name(entry)
        file_content = _extract_content(entry)
        metadata = _extract_metadata(entry, file_name)
        if not file_name or not file_content:
            continue

        file_chunks = chunk_texts(
            file_content,
            file_name,
            chunk_size=chunk_size,
            overlap=overlap,
        )
        if metadata:
            for chunk in file_chunks:
                chunk["metadata"] = dict(metadata)
        chunk_results.extend(file_chunks)

    return chunk_results


def _extract_name(entry: Mapping[str, object]) -> str:
    for key in ("name", "file_path", "path", "source"):
        value = entry.get(key)
        if isinstance(value, str):
            return value

    metadata = entry.get("metadata")
    if isinstance(metadata, Mapping):
        for key in ("name", "file_path", "path", "source"):
            value = metadata.get(key)
            if isinstance(value, str):
                return value

    return ""


def _extract_content(entry: Mapping[str, object]) -> str:
    content = entry.get("content")
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, Sequence):
        return "\n".join(str(part) for part in content)
    return ""


def _extract_metadata(entry: Mapping[str, object], file_name: str) -> Mapping[str, Any]:
    metadata = entry.get("metadata")
    metadata_map: dict[str, Any] = {}

    if isinstance(metadata, Mapping):
        metadata_map.update(metadata)

    if file_name:
        metadata_map.setdefault("path", file_name)
        metadata_map.setdefault("file_name", Path(file_name).name)
        metadata_map.setdefault("extension", Path(file_name).suffix)

    return metadata_map


@dataclass(slots=True)
class CodeChunk:
    repo_id: str
    file_path: str
    chunk_id: str
    content: str
    metadata: Dict[str, str | int]


@dataclass(slots=True)
class ChunkEmbedding:
    repo_id: str
    chunk_id: str
    embedding: List[float]
    metadata: Dict[str, str | int]
    content: str


def build_code_chunks(
    repo_id: str,
    repo_files: Sequence[Mapping[str, object]],
    *,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> List[CodeChunk]:
    """Transform the teammate's repo ingestion output into CodeChunk records."""
    raw_chunks = chunk_repo_files(
        repo_files,
        chunk_size=chunk_size,
        overlap=overlap,
    )

    prepared: List[CodeChunk] = []
    for idx, chunk in enumerate(raw_chunks):
        source = chunk.get("source", "")
        content = chunk.get("content", "")
        chunk_identifier = chunk.get("chunk_id") or f"{source}#chunk-{idx}"
        if not source or not content:
            continue

        metadata_payload = _merge_chunk_metadata(chunk, source, idx, content)

        prepared.append(
            CodeChunk(
                repo_id=repo_id,
                file_path=source,
                chunk_id=f"{repo_id}:{chunk_identifier}",
                content=content,
                metadata=metadata_payload,
            )
        )

    return prepared


async def index_repo_files(
    repo_id: str,
    repo_files: Sequence[Mapping[str, object]],
    *,
    openai_client: OpenAI | None = None,
    chroma_client: ClientAPI | None = None,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> None:
    """Convenience wrapper that builds chunks from repo files and indexes them."""
    chunks = build_code_chunks(
        repo_id,
        repo_files,
        chunk_size=chunk_size,
        overlap=overlap,
    )
    await index_clean_chunks(
        chunks,
        openai_client=openai_client,
        chroma_client=chroma_client,
    )


async def index_clean_chunks(
    chunks: Sequence[CodeChunk],
    *,
    openai_client: OpenAI | None = None,
    chroma_client: ClientAPI | None = None,
) -> None:
    """Given a pre-cleaned list of CodeChunk entries, embed and store them in Chroma."""
    cluster_id = chunks[0].repo_id if chunks else None
    if not cluster_id:
        return

    embeddings = await embed_chunks(chunks, client=openai_client)
    persist_embeddings_to_chroma(cluster_id, embeddings, client=chroma_client)


async def embed_chunks(
    chunks: Sequence[CodeChunk],
    *,
    model: str = "text-embedding-3-small",
    client: OpenAI | None = None,
) -> List[ChunkEmbedding]:
    """Generate OpenAI embeddings for the provided chunks without blocking the event loop."""
    if not chunks:
        return []

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _embed_chunks_sync, chunks, model, client)


def _embed_chunks_sync(
    chunks: Sequence[CodeChunk],
    model: str,
    client: OpenAI | None,
) -> List[ChunkEmbedding]:
    local_client = client or _create_openai_client()
    inputs = [chunk.content for chunk in chunks]
    response = local_client.embeddings.create(model=model, input=inputs)

    if len(response.data) != len(chunks):
        raise RuntimeError("Embedding response size mismatch.")

    return [
        ChunkEmbedding(
            repo_id=chunk.repo_id,
            chunk_id=chunk.chunk_id,
            embedding=record.embedding,
            metadata=chunk.metadata,
            content=chunk.content,
        )
        for chunk, record in zip(chunks, response.data)
    ]


def persist_embeddings_to_chroma(
    repo_id: str,
    chunk_embeddings: Sequence[ChunkEmbedding],
    *,
    client: ClientAPI | None = None,
) -> None:
    if not chunk_embeddings:
        return

    collection = chromadb_service.get_repo_collection(repo_id, client=client)
    chromadb_service.upsert_documents(
        collection,
        ids=[embedding.chunk_id for embedding in chunk_embeddings],
        embeddings=[embedding.embedding for embedding in chunk_embeddings],
        documents=[embedding.content for embedding in chunk_embeddings],
        metadatas=[
            dict(embedding.metadata, repo_id=repo_id) for embedding in chunk_embeddings
        ],
    )


def _merge_chunk_metadata(
    chunk: Mapping[str, Any],
    source: str,
    idx: int,
    content: str,
) -> Dict[str, str | int]:
    metadata: Dict[str, Any] = {}

    chunk_metadata = chunk.get("metadata")
    if isinstance(chunk_metadata, Mapping):
        metadata.update(chunk_metadata)

    metadata.setdefault("path", source)
    metadata.setdefault("chunk_id", chunk.get("chunk_id", f"{source}#chunk-{idx}"))
    metadata["chunk_index"] = idx
    metadata["char_count"] = len(content)

    return metadata


def _create_openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_KEY")
    if api_key:
        return OpenAI(api_key=api_key)
    return OpenAI()
