from pathlib import Path

LANGUAGE_BY_EXTENSION = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".json": "json",
    ".md": "markdown",
    ".markdown": "markdown",
    ".mdx": "markdown",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".txt": "text",
    ".rst": "rst",
}

def load_files(file_paths):
    docs = []
    for path in file_paths:
        text = Path(path).read_text(encoding="utf-8", errors="ignore")

        # --- Add metadata here ---
        extension = Path(path).suffix.lower()
        metadata = {
            "file_path": str(path),
            "file_name": Path(path).name,
            "extension": extension,
            "directory": str(Path(path).parent),
            "lines": len(text.splitlines()),
            "chars": len(text),
            "language": LANGUAGE_BY_EXTENSION.get(extension, "unknown"),
        }

        docs.append({
            "source": str(path),
            "content": text,
            "metadata": metadata
        })
    return docs
