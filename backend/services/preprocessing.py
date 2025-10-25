from pathlib import Path

def load_files(file_paths):
    docs = []
    for path in file_paths:
        text = Path(path).read_text(encoding="utf-8", errors="ignore")
        docs.append({
            "source": str(path),
            "content": text
        })
    return docs