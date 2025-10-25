def chunk_texts(text, source, chunk_size=1000, overlap=200):
    chunks = []
    for i in range(0, len(text), chunk_size - overlap):
        chunk = text[i:i + chunk_size]
        chunks.append({"source": source, "content": chunk})
    return chunks