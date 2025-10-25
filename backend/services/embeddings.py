from typing import List
from openai import OpenAI
from config import get_openai_settings

_SETTINGS = get_openai_settings()
_client: OpenAI | None = None


def get_openai_client() -> OpenAI:
    """
    Return a singleton OpenAI client.
    """
    global _client
    if _client is None:
        _client = OpenAI(api_key=_SETTINGS.api_key)
    return _client


def generate_embeddings(
    texts: List[str], model: str = "text-embedding-3-small"
) -> List[List[float]]:
    """
    Generate embeddings for a list of text chunks using OpenAI's embedding API.

    Args:
        texts: List of text strings to embed
        model: OpenAI embedding model to use (default: text-embedding-3-small)

    Returns:
        List of embedding vectors (each vector is a list of floats)
    """
    client = get_openai_client()

    # OpenAI API accepts up to 2048 texts per request for embedding models
    # For safety, we'll batch in chunks of 100
    batch_size = 100
    all_embeddings = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        response = client.embeddings.create(input=batch, model=model)

        # Extract embeddings from response
        batch_embeddings = [item.embedding for item in response.data]
        all_embeddings.extend(batch_embeddings)

    return all_embeddings
