import chromadb

from .config import get_chroma_settings

_SETTINGS = get_chroma_settings()

# Global client reused across the app to avoid repeated auth handshakes.
client = chromadb.CloudClient(
    api_key=_SETTINGS.api_key,
    tenant=_SETTINGS.tenant,
    database=_SETTINGS.database,
)
