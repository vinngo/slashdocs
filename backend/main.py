from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


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
    return {"message": "POST API /ingest called."}
    #return ingest_repo(repo_url)

@app.post("/api/chat")
def chat(query: str):
    return {"message": "POST API /chat called."}
    #return {"answer": chat_with_repo(query)}