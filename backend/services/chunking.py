from typing import List, Dict

def chunk_files(file_objects: List[Dict], chunk_size: int = 1000, overlap: int = 200) -> List[Dict]:
    chunks = []
    chunk_id = 0

    for file_obj in file_objects:
        content = file_obj["content"]
        source = file_obj["source"]
        metadata = file_obj["metadata"]

        #if the file is smaller than chunk size, no need to chunk
        if len(content) <= chunk_size:
            chunks.append({
                "id": f"{source}_chunk_{chunk_id}",
                "content": content,
                "metadata": metadata
            })
            chunk_id += 1
            continue
    
        start = 0
        file_chunks = []

        #create chunks with overlap

        while start < len(content):
            end = start + chunk_size

            if end < len(content):
                newline_pos = content.rfind('\n', start, end)
                if newline_pos != -1 and newline_pos > start + chunk_size // 2:
                    end = newline_pos + 1

            chunk_text = content[start:end]
            file_chunks.append(chunk_text)
            start = end - overlap if end < len(content) else end

        for id, chunk_text in enumerate(file_chunks):
            chunks.append({
                "id": f"chunk_{chunk_id}",
                "document": chunk_text,
                "metadata": {
                    "file_path": source,
                    "chunk_index": id,
                    "total_chunks": len(file_chunks),
                    **metadata
                }
            })
            chunk_id += 1

    return chunks


