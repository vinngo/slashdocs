import os, tempfile, glob
from git import Repo
import shutil


def ingest_repo(repo_url: str):
    """
    Bare-bones version: clones a GitHub repo and lists files.
    """
    allowed_extensions = (".md", ".markdown", ".mdx", ".py", ".js", ".jsx", ".ts", ".tsx", ".json", ".yaml", ".yml", ".toml", ".txt", ".rst")
    tmp_dir = tempfile.mkdtemp()
    print(f"Cloning {repo_url} into {tmp_dir}")

    try:
        # Clone the repo
        Repo.clone_from(repo_url, tmp_dir)

        # Collect file paths
        repo_files = []
        for root, _, files in os.walk(tmp_dir):
            if ".git" in root or "node_modules" in root or "venv" in root:
                continue
            for f in files:
                if f.endswith(allowed_extensions):
                    repo_files.append(os.path.join(root, f))

        return repo_files

    except Exception as e:
        print(f"❌ Error during repo ingestion: {e}")
        raise e

    finally :
        shutil.rmtree(tmp_dir)