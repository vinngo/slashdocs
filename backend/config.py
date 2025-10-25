from dataclasses import dataclass
from functools import lru_cache
import os


class MissingConfigError(KeyError):
    """Raised when an expected environment variable is absent."""


@dataclass(frozen=True)
class ChromaSettings:
    api_key: str
    tenant: str
    database: str


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise MissingConfigError(f"Missing required environment variable: {name}")
    return value


@lru_cache(maxsize=1)
def get_chroma_settings() -> ChromaSettings:
    """Return validated configuration for the Chroma cloud client."""
    return ChromaSettings(
        api_key=_require_env("CHROMA_API_KEY"),
        tenant=_require_env("CHROMA_TENANT_ID"),
        database=_require_env("CHROMA_DATABASE"),
    )
