"""
Seed script — ingests .txt and .pdf files into Supabase vector store.

Usage:
    uv run scripts/seed_vectordb.py

Place your documents in the data/raw/ folder before running.
"""

from langchain_postgres.vectorstores import PGVector
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from dotenv import load_dotenv
from pathlib import Path
import os
import time

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────

DATA_DIR = Path(__file__).parent.parent / "data" / "raw"

# Metadata applied to all documents — edit per file if needed
DEFAULT_METADATA = {
    "grade": "Year 10",
    "subject": "History",
    "state": "NSW",
}

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

# ── File readers ──────────────────────────────────────────────────────────────

def read_txt(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def read_pdf(path: Path) -> str:
    """Extract text from PDF page by page using pypdf."""
    try:
        from pypdf import PdfReader
    except ImportError:
        raise ImportError("Run: uv add pypdf")

    reader = PdfReader(str(path))
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text and text.strip():
            pages.append(text.strip())
    return "\n\n".join(pages)


def load_documents(data_dir: Path) -> list[Document]:
    """Load all .txt and .pdf files from data_dir into LangChain Documents."""
    documents = []
    supported = {".txt": read_txt, ".pdf": read_pdf}

    files = sorted(data_dir.glob("*.*"))
    if not files:
        print(f"⚠️  No files found in {data_dir}")
        return documents

    for file in files:
        suffix = file.suffix.lower()
        if suffix not in supported:
            print(f"⏭️  Skipping unsupported file: {file.name}")
            continue

        print(f"📄 Reading: {file.name}")
        try:
            text = supported[suffix](file)
            doc = Document(
                page_content=text,
                metadata={**DEFAULT_METADATA, "filename": file.name, "source": str(file)},
            )
            documents.append(doc)
            print(f"   ✅ Loaded ({len(text):,} characters)")
        except Exception as e:
            print(f"   ❌ Failed to read {file.name}: {e}")

    return documents


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("\n🌱 Drona-AI — Vector DB Seed Script")
    print("=" * 50)

    # 1. Load raw documents
    print(f"\n📁 Loading files from: {DATA_DIR}")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    raw_docs = load_documents(DATA_DIR)

    if not raw_docs:
        print("\n❌ No documents loaded. Add .txt or .pdf files to data/raw/ and retry.")
        return

    print(f"\n✅ Loaded {len(raw_docs)} document(s)")

    # 2. Split into chunks
    print(f"\n✂️  Splitting into chunks (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )
    chunks = splitter.split_documents(raw_docs)
    print(f"   → {len(chunks)} chunks total")

    # Preview first 3 chunks
    print("\n📋 Preview (first 3 chunks):")
    for i, chunk in enumerate(chunks[:3]):
        print(f"\n--- Chunk {i+1} [{chunk.metadata.get('filename')}] ---")
        print(chunk.page_content[:200] + ("..." if len(chunk.page_content) > 200 else ""))

    # 3. Connect to Supabase and embed
    print("\n🔌 Connecting to Supabase...")
    embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
    vector_store = PGVector(
        embeddings=embeddings,
        collection_name="documents",
        connection=os.getenv("DATABASE_URL"),
    )

    # 4. Upload in batches to avoid rate limits
    print(f"\n⬆️  Uploading {len(chunks)} chunks to Supabase...")
    BATCH_SIZE = 20
    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i : i + BATCH_SIZE]
        vector_store.add_documents(batch)
        print(f"   Uploaded batch {i // BATCH_SIZE + 1} / {-(-len(chunks) // BATCH_SIZE)}")
        
        # Add a 3-second delay to keep Google API happy
        time.sleep(10)

    print(f"\n✅ Successfully uploaded {len(chunks)} chunks to Supabase")

    # 5. Quick retrieval test
    print("\n🔍 Running retrieval tests...")
    queries = [
        "What happened at Gallipoli?",
        "What were the main causes of World War I?",
        "How did the war end?",
    ]
    for query in queries:
        results = vector_store.similarity_search(query, k=2)
        print(f"\nQuery: '{query}'")
        for j, r in enumerate(results):
            source = r.metadata.get("filename", "unknown")
            print(f"  Result {j+1} [{source}]: {r.page_content[:150]}...")

    print("\n🎉 Seed complete!\n")


if __name__ == "__main__":
    main()