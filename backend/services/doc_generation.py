"""
Documentation generation service using LLM.
"""

from typing import List, Dict, Optional
import logging
import json
from datetime import datetime
from collections import defaultdict
from openai import OpenAI
from config import get_openai_settings
from services.retrieval import query_repository, get_all_files
from models.documentation import Section, FileNode, DocumentationMetadata, DocsData

logger = logging.getLogger(__name__)


def build_file_tree(repo_name: str) -> List[FileNode]:
    """
    Build a hierarchical file tree from indexed repository files.

    Args:
        repo_name: Name of the repository

    Returns:
        List of root FileNode objects representing the file tree
    """
    try:
        # Get all unique files from the repository
        files = get_all_files(repo_name)

        if not files:
            logger.warning(f"No files found for {repo_name}")
            return []

        # Build tree structure
        root = {}

        for file in files:
            file_path = file["file_path"]
            # Remove leading slash if present
            file_path = file_path.lstrip("/")
            parts = file_path.split("/")

            current = root
            for i, part in enumerate(parts):
                if part not in current:
                    is_file = i == len(parts) - 1
                    current[part] = {
                        "name": part,
                        "path": "/".join(parts[: i + 1]),
                        "type": "file" if is_file else "folder",
                        "children": {} if not is_file else None,
                    }

                if i < len(parts) - 1:
                    current = current[part]["children"]

        # Convert dict structure to list of FileNode objects
        def dict_to_file_nodes(node_dict: Dict) -> List[FileNode]:
            nodes = []
            # Sort: folders first, then files; alphabetically within each group
            sorted_items = sorted(
                node_dict.items(), key=lambda x: (x[1]["type"] == "file", x[0].lower())
            )

            for name, data in sorted_items:
                children = None
                if data["type"] == "folder" and data["children"]:
                    children = dict_to_file_nodes(data["children"])

                nodes.append(
                    FileNode(
                        name=data["name"],
                        path=data["path"],
                        type=data["type"],
                        children=children,
                    )
                )

            return nodes

        file_tree = dict_to_file_nodes(root)
        logger.info(f"Built file tree with {len(file_tree)} root nodes for {repo_name}")
        return file_tree

    except Exception as e:
        logger.error(f"Error building file tree: {type(e).__name__}: {e}")
        # Return empty tree on error
        return []


def gather_metadata(repo_name: str, file_tree: List[FileNode]) -> DocumentationMetadata:
    """
    Gather metadata about the indexed repository.

    Args:
        repo_name: Name of the repository
        file_tree: File tree structure

    Returns:
        DocumentationMetadata object
    """
    try:
        # Get all files
        files = get_all_files(repo_name)

        # Count files
        file_count = len(files)

        # Detect primary language (most common)
        language_counts = defaultdict(int)
        for file in files:
            lang = file.get("language", "unknown")
            if lang and lang != "unknown":
                language_counts[lang] += 1

        primary_language = (
            max(language_counts.items(), key=lambda x: x[1])[0]
            if language_counts
            else "Unknown"
        )

        # Detect framework by looking for common config files
        framework = None
        framework_indicators = {
            "package.json": ["Next.js", "React", "Node.js"],
            "requirements.txt": ["FastAPI", "Django", "Flask"],
            "Cargo.toml": ["Rust"],
            "go.mod": ["Go"],
            "pom.xml": ["Java", "Spring"],
        }

        file_names = [f["file_name"] for f in files]
        for config_file, possible_frameworks in framework_indicators.items():
            if config_file in file_names:
                framework = possible_frameworks[0]
                break

        # Estimate line count (rough estimate: 50 lines per file on average)
        # TODO: Could get actual line counts from metadata if available
        estimated_lines = file_count * 50

        # Current timestamp
        indexed_at = datetime.utcnow().isoformat() + "Z"

        metadata = DocumentationMetadata(
            repo_name=repo_name,
            repo_url=None,  # TODO: Could extract from git remote if available
            language=primary_language,
            framework=framework,
            file_count=file_count,
            line_count=estimated_lines,
            indexed_at=indexed_at,
        )

        logger.info(
            f"Gathered metadata for {repo_name}: {primary_language}, {file_count} files"
        )
        return metadata

    except Exception as e:
        logger.error(f"Error gathering metadata: {type(e).__name__}: {e}")
        # Return minimal metadata on error
        return DocumentationMetadata(
            repo_name=repo_name,
            language="Unknown",
            file_count=0,
            line_count=0,
            indexed_at=datetime.utcnow().isoformat() + "Z",
        )


def generate_overview_docs(repo_name: str) -> DocsData:
    """
    Generate high-level overview documentation for a repository with structured JSON output.

    Args:
        repo_name: Name of the repository

    Returns:
        DocsData object with sections, file_tree, and metadata
    """
    try:
        logger.info(f"Generating structured overview docs for {repo_name}")

        # Step 1: Build file tree
        logger.info("Building file tree...")
        file_tree = build_file_tree(repo_name)

        # Step 2: Gather metadata
        logger.info("Gathering metadata...")
        metadata = gather_metadata(repo_name, file_tree)

        # Step 3: Query for relevant code context
        overview_query = "What is the main purpose and structure of this codebase? What are the key components?"
        results = query_repository(repo_name, overview_query, n_results=15)

        if not results:
            logger.warning(f"No indexed content found for {repo_name}")
            # Return minimal documentation
            fallback_section = Section(
                id=1,
                title="Overview",
                content="# Overview\n\nNo documentation available. Repository may not be indexed.",
            )
            return DocsData(
                sections=[fallback_section], file_tree=file_tree, metadata=metadata
            )

        # Build context from top results
        context_parts = []
        for i, result in enumerate(results[:10], 1):
            file_path = result["metadata"].get("file_path", "unknown")
            language = result["metadata"].get("language", "")
            content = result["document"]
            context_parts.append(
                f"## File {i}: {file_path} ({language})\n{content[:400]}..."
            )

        context = "\n\n".join(context_parts)

        # Step 4: Generate structured documentation with LLM using JSON mode
        settings = get_openai_settings()
        client = OpenAI(api_key=settings.api_key)

        prompt = f"""You are a technical documentation expert. Generate comprehensive documentation for a codebase.

Repository: {repo_name}
Language: {metadata.language}
Framework: {metadata.framework or "N/A"}

Code Excerpts:
{context}

Generate a JSON object with exactly 10 documentation sections. Each section must have markdown content.

Required structure:
{{
  "sections": [
    {{"id": 1, "title": "Overview", "content": "# Overview\\n\\nMarkdown content..."}},
    {{"id": 2, "title": "Getting Started", "content": "# Getting Started\\n\\nMarkdown content..."}},
    {{"id": 3, "title": "Project Structure", "content": "# Project Structure\\n\\nMarkdown content..."}},
    {{"id": 4, "title": "Core Concepts", "content": "# Core Concepts\\n\\nMarkdown content..."}},
    {{"id": 5, "title": "Architecture", "content": "# Architecture\\n\\nMarkdown content..."}},
    {{"id": 6, "title": "API Reference", "content": "# API Reference\\n\\nMarkdown content..."}},
    {{"id": 7, "title": "Configuration", "content": "# Configuration\\n\\nMarkdown content..."}},
    {{"id": 8, "title": "Development", "content": "# Development\\n\\nMarkdown content..."}},
    {{"id": 9, "title": "Testing", "content": "# Testing\\n\\nMarkdown content..."}},
    {{"id": 10, "title": "Deployment", "content": "# Deployment\\n\\nMarkdown content..."}}
  ]
}}

Requirements:
- Each section must have valid markdown content starting with a heading
- Be comprehensive but concise (100-250 words per section)
- Base the documentation on the provided code excerpts
- Include code examples where relevant
- Use proper markdown formatting"""

        logger.info("Calling OpenAI API with JSON mode for structured documentation")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a technical documentation expert. You always respond with valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=4000,
        )

        # Parse JSON response
        json_content = response.choices[0].message.content
        parsed_data = json.loads(json_content)

        # Validate and convert to Pydantic models
        sections = [Section(**section_data) for section_data in parsed_data["sections"]]

        # Ensure we have exactly 10 sections
        if len(sections) != 10:
            logger.warning(
                f"Expected 10 sections, got {len(sections)}. Padding/truncating..."
            )
            # TODO: Could add logic to pad missing sections

        # Step 5: Construct final DocsData object
        docs_data = DocsData(sections=sections, file_tree=file_tree, metadata=metadata)

        logger.info(
            f"Successfully generated structured docs for {repo_name} with {len(sections)} sections"
        )
        return docs_data

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM JSON response: {e}")
        raise
    except Exception as e:
        logger.error(f"Error generating docs for {repo_name}: {type(e).__name__}: {e}")
        raise


def generate_file_docs(repo_name: str, file_path: str) -> Dict:
    """
    Generate documentation for a specific file.

    Args:
        repo_name: Name of the repository
        file_path: Path to the file

    Returns:
        Dictionary containing file documentation
    """
    try:
        logger.info(f"Generating docs for file: {file_path}")

        # Query for this specific file
        query = f"What does the file {file_path} do?"
        results = query_repository(
            repo_name, query, n_results=5, filter_metadata={"file_path": file_path}
        )

        if not results:
            return {
                "file_path": file_path,
                "documentation": "No documentation available for this file.",
            }

        # Build context from file chunks
        file_content = "\n\n".join([r["document"] for r in results])
        file_metadata = results[0]["metadata"]

        # Generate docs with LLM
        settings = get_openai_settings()
        client = OpenAI(api_key=settings.api_key)

        prompt = f"""Generate concise documentation for this code file.

File: {file_path}
Language: {file_metadata.get("language", "unknown")}

Code:
{file_content}

Please provide:
1. Brief description of the file's purpose
2. Key functions/classes and what they do
3. Any important dependencies or patterns

Be concise and focus on what developers need to know."""

        logger.info("Calling OpenAI API for file documentation")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a technical documentation expert who writes clear, concise documentation.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=800,
        )

        generated_docs = response.choices[0].message.content

        logger.info(f"Successfully generated docs for {file_path}")
        return {
            "file_path": file_path,
            "language": file_metadata.get("language", "unknown"),
            "documentation": generated_docs,
        }

    except Exception as e:
        logger.error(f"Error generating file docs: {type(e).__name__}: {e}")
        raise


def answer_question(repo_name: str, question: str) -> Dict:
    """
    Answer a specific question about the repository using RAG.

    Args:
        repo_name: Name of the repository
        question: User's question

    Returns:
        Dictionary with answer and source chunks
    """
    try:
        logger.info(f"Answering question for {repo_name}: {question[:50]}...")

        # Query for relevant chunks
        results = query_repository(repo_name, question, n_results=8)

        if not results:
            return {
                "question": question,
                "answer": "I couldn't find relevant information in the indexed repository.",
                "sources": [],
            }

        # Build context from results
        context_parts = []
        sources = []
        for i, result in enumerate(results, 1):
            file_path = result["metadata"].get("file_path", "unknown")
            content = result["document"]
            similarity = result.get("similarity", 0)

            context_parts.append(f"[Source {i}] {file_path}:\n{content}")
            sources.append(
                {
                    "file_path": file_path,
                    "chunk_id": result["id"],
                    "similarity": similarity,
                }
            )

        context = "\n\n".join(context_parts)

        # Generate answer with LLM
        settings = get_openai_settings()
        client = OpenAI(api_key=settings.api_key)

        prompt = f"""Answer the following question about the codebase based on the provided code excerpts.

Question: {question}

Code Excerpts:
{context}

Provide a clear, accurate answer based on the code. If the excerpts don't contain enough information, say so. Cite specific files when relevant."""

        logger.info("Calling OpenAI API to answer question")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful coding assistant who answers questions about codebases accurately based on provided context.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=1000,
        )

        answer = response.choices[0].message.content

        logger.info("Successfully generated answer")
        return {
            "question": question,
            "answer": answer,
            "sources": sources[:5],  # Top 5 sources
        }

    except Exception as e:
        logger.error(f"Error answering question: {type(e).__name__}: {e}")
        raise
