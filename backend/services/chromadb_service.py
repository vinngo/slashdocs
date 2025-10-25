from typing import Any, Mapping, Sequence

import chromadb
from chromadb.api import ClientAPI
from chromadb.api.models.Collection import Collection

from ..config import get_chroma_settings

_SETTINGS = get_chroma_settings()
_client: ClientAPI | None = None


def get_chroma_client() -> ClientAPI:
    """
    Return a singleton Chroma Cloud client.
    """
    global _client
    if _client is None:
        _client = chromadb.CloudClient(
            api_key=_SETTINGS.api_key,
            tenant=_SETTINGS.tenant,
            database=_SETTINGS.database,
        )
    return _client


def get_repo_collection(repo_id: str, *, client: ClientAPI | None = None) -> Collection:
    """
    Lazy-create a per-repo collection following the `repo_{id}` convention.
    """
    active_client = client or get_chroma_client()
    name = f"repo_{repo_id}"
    return active_client.get_or_create_collection(name=name)


def upsert_documents(
    collection: Collection,
    *,
    ids: Sequence[str],
    embeddings: Sequence[Sequence[float]],
    documents: Sequence[str],
    metadatas: Sequence[Mapping[str, Any]],
) -> None:
    """
    Persist embedding payloads into the provided Chroma collection.
    """
    collection.upsert(
        ids=list(ids),
        embeddings=list(embeddings),
        documents=list(documents),
        metadatas=[dict(metadata) for metadata in metadatas],
    )
