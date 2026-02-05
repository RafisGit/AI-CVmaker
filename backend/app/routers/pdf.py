from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.services.pdf_service import PDFService
import os
import uuid

router = APIRouter(prefix="/pdf", tags=["pdf"])

@router.post("/generate")
def generate_pdf(preview_url: str):
    """
    Triggers server-side PDF generation.
    In a real production app, preview_url would point to a specialized
    /preview/[id] route in the Next.js frontend.
    """
    try:
        filename = f"cv_{uuid.uuid4()}.pdf"
        output_path = os.path.join("backend/app/storage", filename)
        
        PDFService.generate_pdf(preview_url, output_path)
        
        return FileResponse(
            path=output_path,
            filename="my_resume.pdf",
            media_type="application/pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
