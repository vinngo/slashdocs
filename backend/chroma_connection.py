import chromadb
from chromadb.api import ClientAPI
from chromadb.api.models.Collection import Collection
from fastapi import Depends

from .config import get_chroma_settings

_client: ClientAPI | None = None
_collection: Collection | None = None
_SETTINGS = get_chroma_settings()


def get_chroma_client() -> ClientAPI:
    global _client
    if _client is None:
        _client = chromadb.CloudClient(
            api_key=_SETTINGS.api_key,
            tenant=_SETTINGS.tenant,
            database=_SETTINGS.database,
        )
    return _client


def get_chroma_collection(client: ClientAPI = Depends(get_chroma_client)) -> Collection:
    global _collection
    if _collection is None:
        _collection = client.get_or_create_collection(name="my_collection")
    return _collection
