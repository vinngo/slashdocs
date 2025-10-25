from pydantic import BaseSettings

class Settings(BaseSettings):
    OPENAI_API_KEY: str
    CHROMA_PATH: str = "./chroma_store"
    TEMP_REPO_DIR: str = "./repos/temp_repo"

    class Config:
        env_file = ".env"

settings = Settings()