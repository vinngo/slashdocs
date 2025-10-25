"""Backend package initialization."""

from pathlib import Path

from dotenv import load_dotenv

# Load environment variables from the project-level .env when the backend package is imported.
_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH, override=False)
