import hashlib
import io
import os
import uuid
import psycopg2
from fastapi import UploadFile, HTTPException
from services.rag_service import RagService

class UploadService:
    # 2MB Limit
    MAX_FILE_SIZE = 2 * 1024 * 1024 

    def __init__(self):
        """Initializes UploadService and its dependencies."""
        self.rag = RagService()
        self.db_url = os.getenv("DATABASE_URL")

    async def process_upload(self, file: UploadFile) -> dict:
        """Processes an uploaded file: checks for duplicates, extracts text, and ingests into RAG."""
        
        # 1. Read file content
        content = await file.read()
        file_size = len(content)

        # 2. Strict size check
        if file_size > self.MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large (Max 0.5MB)")

        # 3. Compute SHA-256 hash for deduplication
        file_hash = hashlib.sha256(content).hexdigest()

        # 4. Check for duplicates in DB
        existing_id = self._get_existing_file_id(file_hash)
        if existing_id:
            print(f"♻️  Duplicate found. Returning existing ID.")
            return {
                "document_id": existing_id,
                "is_duplicate": True
            }

        # 5. Extract text based on file type
        text = self._extract_text(file, content)
        if not text or not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from file")

        # Handle None filename by falling back to a UUID name
        filename = file.filename or f"uploaded_file_{uuid.uuid4().hex}"

        # 6. Save metadata to DB
        new_id = self._save_file_metadata(filename, file_size, file_hash)

        # 7. Ingest into RAG
        metadata = {
            "filename": filename,
            "document_id": new_id,
            "source": "upload",
            "file_size": file_size
        }
        self.rag.ingest(text, metadata)

        return {
            "document_id": new_id,
            "is_duplicate": False
        }

    def list_files(self) -> list[dict]:
        """Retrieves a list of all uploaded files from the database."""
        try:
            with psycopg2.connect(self.db_url) as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT id, filename, file_size, created_at FROM uploaded_files ORDER BY created_at DESC")
                    rows = cur.fetchall()
                    return [
                        {
                            "id": str(row[0]),
                            "filename": row[1],
                            "file_size": row[2],
                            "created_at": row[3].isoformat() if row[3] else None
                        }
                        for row in rows
                    ]
        except Exception as e:
            print(f"❌ DB List Error: {e}")
            return []

    def _get_existing_file_id(self, file_hash: str) -> str | None:
        """Checks if a file with the same hash already exists in the database."""
        try:
            with psycopg2.connect(self.db_url) as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT id FROM uploaded_files WHERE file_hash = %s", (file_hash,))
                    row = cur.fetchone()
                    return str(row[0]) if row else None
        except Exception as e:
            print(f"❌ DB Check Error: {e}")
            return None

    def _save_file_metadata(self, filename: str, size: int, file_hash: str) -> str:
        """Saves file metadata to the database and returns the new UUID."""
        with psycopg2.connect(self.db_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO uploaded_files (filename, file_size, file_hash) VALUES (%s, %s, %s) RETURNING id",
                    (filename, size, file_hash)
                )
                row = cur.fetchone()
                if row is None:
                    raise HTTPException(status_code=500, detail="Failed to save file metadata to database")
                new_id = row[0]
                conn.commit()
                return str(new_id)

    def _extract_text(self, file: UploadFile, content: bytes) -> str:
        """Extracts text from PDF or TXT bytes."""
        # Use fallback if filename is None for extension checking
        filename_lower = (file.filename or "").lower()
        
        if filename_lower.endswith(".txt"):
            return content.decode("utf-8", errors="ignore")
        
        elif filename_lower.endswith(".pdf"):
            try:
                from pypdf import PdfReader
                pdf_file = io.BytesIO(content)
                reader = PdfReader(pdf_file)
                pages = []
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        pages.append(text.strip())
                return "\n\n".join(pages)
            except Exception as e:
                print(f"❌ PDF Extraction Error: {e}")
                raise HTTPException(status_code=400, detail="Failed to process PDF file")
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF or TXT.")
