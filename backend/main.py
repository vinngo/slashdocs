from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.repo_handler import ingest_repo
from services.preprocessing import load_files




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
def ingest(repo_url: str):
    try:
        repo_files = ingest_repo(repo_url)
        result = load_files(repo_files)
        return {"status": "success", "ingested_files": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    #return {"message": "POST API /ingest called."}

@app.post("/api/chat")
def chat(query: str):
    return {"message": "POST API /chat called."}
    #return {"answer": chat_with_repo(query)}
