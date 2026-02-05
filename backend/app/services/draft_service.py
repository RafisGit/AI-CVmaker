import json
import os
from pathlib import Path
from typing import List, Optional
from app.schemas.cv import CVDraft

# Define path relative to this file's directory
BASE_PATH = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_PATH / "storage"
STORAGE_PATH = STORAGE_DIR / "drafts.json"

if not STORAGE_DIR.exists():
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)

if not STORAGE_PATH.exists():
    with open(STORAGE_PATH, "w") as f:
        json.dump([], f)

class DraftService:
    @staticmethod
    def get_all_drafts() -> List[dict]:
        with open(STORAGE_PATH, "r") as f:
            return json.load(f)

    @staticmethod
    def get_draft_by_id(draft_id: str) -> Optional[dict]:
        drafts = DraftService.get_all_drafts()
        for draft in drafts:
            if draft["id"] == draft_id:
                return draft
        return None

    @staticmethod
    def save_draft(draft: CVDraft) -> dict:
        drafts = DraftService.get_all_drafts()
        draft_dict = json.loads(draft.json())
        
        # Update if exists, otherwise append
        index = -1
        for i, d in enumerate(drafts):
            if d["id"] == draft_dict["id"]:
                index = i
                break
        
        if index != -1:
            drafts[index] = draft_dict
        else:
            drafts.append(draft_dict)
            
        with open(STORAGE_PATH, "w") as f:
            json.dump(drafts, f, indent=4)
        
        return draft_dict

    @staticmethod
    def delete_draft(draft_id: str) -> bool:
        drafts = DraftService.get_all_drafts()
        initial_length = len(drafts)
        drafts = [d for d in drafts if d["id"] != draft_id]
        
        if len(drafts) == initial_length:
            return False
            
        with open(STORAGE_PATH, "w") as f:
            json.dump(drafts, f, indent=4)
        return True
