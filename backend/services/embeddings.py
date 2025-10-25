from typing import List
import time
import logging
from openai import OpenAI, RateLimitError
from config import get_openai_settings

logger = logging.getLogger(__name__)
_client: OpenAI | None = None


def get_openai_client() -> OpenAI:
    """
    Return a singleton OpenAI client.
    """
    global _client
    if _client is None:
        settings = get_openai_settings()
        _client = OpenAI(api_key=settings.api_key)
    return _client


def generate_embeddings(
    texts: List[str], model: str = "text-embedding-3-small", max_retries: int = 5
) -> List[List[float]]:
    """
    Generate embeddings for a list of text chunks using OpenAI's embedding API.
    Includes retry logic with exponential backoff for rate limiting.

    Args:
        texts: List of text strings to embed
        model: OpenAI embedding model to use (default: text-embedding-3-small)
        max_retries: Maximum number of retries for rate limit errors

    Returns:
        List of embedding vectors (each vector is a list of floats)

    Raises:
        RateLimitError: If rate limit persists after all retries
    """
    client = get_openai_client()

    # OpenAI API accepts up to 2048 texts per request for embedding models
    # For safety, we'll batch in chunks of 100
    batch_size = 100
    all_embeddings = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]

        # Retry logic with exponential backoff
        for attempt in range(max_retries):
            try:
                response = client.embeddings.create(input=batch, model=model)

                # Extract embeddings from response
                batch_embeddings = [item.embedding for item in response.data]
                all_embeddings.extend(batch_embeddings)

                # Success - break retry loop
                break

            except RateLimitError as e:
                if attempt == max_retries - 1:
                    # Last attempt failed
                    logger.error(f"Rate limit exceeded after {max_retries} attempts")
                    raise

                # Calculate exponential backoff: 1s, 2s, 4s, 8s, 16s
                wait_time = 2**attempt
                logger.warning(
                    f"Rate limit hit on batch {i // batch_size + 1}. "
                    f"Retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})"
                )
                time.sleep(wait_time)

            except Exception as e:
                # For non-rate-limit errors, fail immediately
                logger.error(f"Error generating embeddings: {type(e).__name__}: {e}")
                raise

    logger.info(f"Successfully generated {len(all_embeddings)} embeddings")
    return all_embeddings
