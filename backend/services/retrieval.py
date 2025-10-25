"""
Retrieval service for querying indexed repositories.
"""

from typing import List, Dict, Optional
import logging
from services.chromadb_service import get_repo_collection
from services.embeddings import generate_embeddings

logger = logging.getLogger(__name__)


def query_repository(
    repo_name: str,
    query: str,
    n_results: int = 10,
    filter_metadata: Optional[Dict] = None,
) -> List[Dict]:
    """
    Query a repository's indexed chunks using semantic search.

    Args:
        repo_name: Name of the repository to query
        query: Search query text
        n_results: Number of results to return (default: 10)
        filter_metadata: Optional metadata filters (e.g., {"language": "python"})

    Returns:
        List of matching chunks with metadata and similarity scores

    Example:
        results = query_repository("myrepo", "how does authentication work?", n_results=5)
    """
    try:
        # Get the collection for this repo
        collection = get_repo_collection(repo_name)

        # Generate embedding for the query
        logger.info(f"Generating embedding for query: {query[:50]}...")
        query_embedding = generate_embeddings([query])[0]

        # Query ChromaDB
        logger.info(f"Querying collection repo_{repo_name} with n_results={n_results}")
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=filter_metadata,
            include=["documents", "metadatas", "distances"],
        )

        # Format results
        formatted_results = []
        if results and results["ids"]:
            for i in range(len(results["ids"][0])):
                formatted_results.append(
                    {
                        "id": results["ids"][0][i],
                        "document": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i],
                        "distance": results["distances"][0][i],
                        "similarity": 1
                        - results["distances"][0][i],  # Convert distance to similarity
                    }
                )

        logger.info(f"Found {len(formatted_results)} results for query")
        return formatted_results

    except Exception as e:
        logger.error(f"Error querying repository {repo_name}: {type(e).__name__}: {e}")
        raise


def get_all_files(repo_name: str) -> List[Dict]:
    """
    Get a list of all unique files in the indexed repository.

    Args:
        repo_name: Name of the repository

    Returns:
        List of unique file paths with metadata
    """
    try:
        collection = get_repo_collection(repo_name)

        # Get all items from collection
        results = collection.get(include=["metadatas"])

        # Extract unique file paths
        files_dict = {}
        if results and results["metadatas"]:
            for metadata in results["metadatas"]:
                file_path = metadata.get("file_path")
                if file_path and file_path not in files_dict:
                    files_dict[file_path] = {
                        "file_path": file_path,
                        "file_name": metadata.get("file_name", ""),
                        "language": metadata.get("language", "unknown"),
                        "extension": metadata.get("extension", ""),
                    }

        logger.info(f"Found {len(files_dict)} unique files in {repo_name}")
        return list(files_dict.values())

    except Exception as e:
        logger.error(f"Error getting files for {repo_name}: {type(e).__name__}: {e}")
        raise


def get_file_content(repo_name: str, file_path: str) -> str:
    """
    Reconstruct full file content from chunks.

    Args:
        repo_name: Name of the repository
        file_path: Path to the file

    Returns:
        Reconstructed file content
    """
    try:
        collection = get_repo_collection(repo_name)

        # Query for all chunks of this file
        results = collection.get(
            where={"file_path": file_path}, include=["documents", "metadatas"]
        )

        if not results or not results["documents"]:
            logger.warning(f"No chunks found for file {file_path}")
            return ""

        # Sort chunks by chunk_index
        chunks_with_index = []
        for i, doc in enumerate(results["documents"]):
            metadata = results["metadatas"][i]
            chunk_index = metadata.get("chunk_index", 0)
            chunks_with_index.append((chunk_index, doc))

        chunks_with_index.sort(key=lambda x: x[0])

        # If only one chunk, return it directly
        if len(chunks_with_index) == 1:
            return chunks_with_index[0][1]

        # For multiple chunks, we need to handle overlap
        # Simple approach: just concatenate (overlap will cause some duplication)
        # TODO: Could implement smart overlap removal
        full_content = "".join([chunk[1] for chunk in chunks_with_index])

        logger.info(f"Reconstructed {len(chunks_with_index)} chunks for {file_path}")
        return full_content

    except Exception as e:
        logger.error(
            f"Error getting file content for {file_path}: {type(e).__name__}: {e}"
        )
        raise
