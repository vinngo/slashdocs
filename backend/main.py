from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Load .env from backend directory
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

import sys
from pathlib import Path as _Path

sys.path.append(str(_Path(__file__).resolve().parent))
from services.repo_handler import ingest_repo
from services.preprocessing import load_files
from services.chunking import chunk_files
from services.chromadb_service import index_repository
from services.retrieval import query_repository, get_all_files
from services.doc_generation import (
    generate_overview_docs,
    generate_file_docs,
    answer_question,
)
from models.documentation import DocsData


app = FastAPI(title="SlashDocs Backend")

# --- CORS ---
origins = ["http://localhost:3000", "https://your-vercel-app.vercel.app"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "SlashDocs backend running."}


@app.post("/api/ingest")
async def ingest(repo_url: str):
    """
    Ingests a GitHub repo → preprocess → embed → store in ChromaDB
    """
    try:
        # Step 1: Clone & scrape repo files
        repo_files = ingest_repo(repo_url)

        # Step 2: Load + extract metadata
        docs = load_files(repo_files)

        # Extract repo name for deterministic chunk IDs
        repo_name = repo_url.split("/")[-1].replace(".git", "")

        # Step 2.5: Create Chunks at the file level
        chunks = chunk_files(docs, repo_name)

        result = index_repository(repo_name, chunks)

        return {"status": "success", "indexed": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/repos/{repo_name}/docs", response_model=DocsData)
async def get_repo_docs(repo_name: str) -> DocsData:
    """
    Generate structured overview documentation for a repository.

    Returns:
        DocsData object with sections, file_tree, and metadata
    """
    try:
        docs = generate_overview_docs(repo_name)
        return docs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/repos/{repo_name}/files")
async def list_repo_files(repo_name: str):
    """
    List all files in an indexed repository.
    """
    try:
        files = get_all_files(repo_name)
        return {"repo_name": repo_name, "files": files, "count": len(files)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/repos/{repo_name}/files/{file_path:path}/docs")
async def get_file_docs(repo_name: str, file_path: str):
    """
    Generate documentation for a specific file.
    """
    try:
        docs = generate_file_docs(repo_name, file_path)
        return docs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/repos/{repo_name}/query")
async def query_repo(repo_name: str, question: str, n_results: int = 10):
    """
    Query a repository using semantic search.
    Returns relevant code chunks without LLM generation.
    """
    try:
        results = query_repository(repo_name, question, n_results=n_results)
        return {"repo_name": repo_name, "query": question, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/repos/{repo_name}/ask")
async def ask_question(repo_name: str, question: str):
    """
    Ask a question about the repository and get an AI-generated answer.
    Uses RAG (Retrieval-Augmented Generation).
    """
    try:
        result = answer_question(repo_name, question)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
