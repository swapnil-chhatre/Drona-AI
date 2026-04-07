from typing import Annotated
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.upload_service import UploadService

router = APIRouter(prefix="/api", tags=["upload"])
upload_service = UploadService()

@router.post("/upload")
async def upload_file(file: Annotated[UploadFile, File()]):
    """Handles file uploads, extracts text, and ingests into the RAG system."""
    try:
        document_id = await upload_service.process_upload(file)
        return {
            "document_id": document_id,
            "filename": file.filename,
            "status": "success"
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Upload API Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during upload")
