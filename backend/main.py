from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

import sys
from pathlib import Path as _Path

sys.path.append(str(_Path(__file__).resolve().parent))
from services.repo_handler import ingest_repo  # your clone/scraper
from services.preprocessing import load_files  # your file loader
from services.chunking import chunk_files  # your chunking logic
from services.chromadb_service import index_repository  # embedding + retrieval


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


@app.post("/api/chat")
def chat(query: str):
    return {"message": "POST API /chat called."}
    # return {"answer": chat_with_repo(query)}
