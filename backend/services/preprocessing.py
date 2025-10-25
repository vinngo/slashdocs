from pathlib import Path

def load_files(file_paths):
    docs = []
    for path in file_paths:
        text = Path(path).read_text(encoding="utf-8", errors="ignore")

        # --- Add metadata here ---
        metadata = {
            "file_path": str(path),
            "file_name": Path(path).name,
            "extension": Path(path).suffix,
            "directory": str(Path(path).parent),
            "lines": len(text.splitlines()),
            "chars": len(text),
        }

        docs.append({
            "source": str(path),
            "content": text,
            "metadata": metadata
        })
    return docs