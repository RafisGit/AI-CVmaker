from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.cv import CVDraft
from app.services.draft_service import DraftService

router = APIRouter(prefix="/drafts", tags=["drafts"])

@router.get("", response_model=List[dict])
def list_drafts():
    """Retrieve all saved CV drafts."""
    return DraftService.get_all_drafts()

@router.get("/{draft_id}", response_model=dict)
def get_draft(draft_id: str):
    """Retrieve a specific draft by ID."""
    draft = DraftService.get_draft_by_id(draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft

@router.post("", response_model=dict)
def save_draft(draft: CVDraft):
    """Save or update a CV draft."""
    return DraftService.save_draft(draft)

@router.delete("/{draft_id}")
def delete_draft(draft_id: str):
    """Delete a draft by ID."""
    success = DraftService.delete_draft(draft_id)
    if not success:
        raise HTTPException(status_code=404, detail="Draft not found")
    return {"message": "Draft deleted successfully"}
