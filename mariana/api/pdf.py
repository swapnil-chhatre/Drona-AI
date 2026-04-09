import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from supabase import create_client

router = APIRouter(prefix="/api", tags=["pdf"])

BUCKET = "pdfs"


def _supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise HTTPException(status_code=500, detail="Supabase credentials not configured")
    return create_client(url, key)


@router.post("/pdf/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Uploads a generated PDF to Supabase Storage and returns a permanent public URL."""
    try:
        content = await file.read()
        filename = f"{uuid.uuid4().hex}.pdf"

        sb = _supabase()
        sb.storage.from_(BUCKET).upload(
            path=filename,
            file=content,
            file_options={"content-type": "application/pdf"},
        )

        public_url = sb.storage.from_(BUCKET).get_public_url(filename)
        return {"url": public_url}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ PDF Upload Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload PDF to storage")
