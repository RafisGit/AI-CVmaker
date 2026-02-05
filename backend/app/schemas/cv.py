from pydantic import BaseModel, Field
from typing import List, Optional, Union
from datetime import datetime

class TechnicalSkills(BaseModel):
    languages: List[str]
    frameworks: List[str]
    tools: List[str]
    databases: List[str]

class Project(BaseModel):
    title: str
    start_month: str
    start_year: str
    end_month: str
    end_year: str
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    tech_stack: List[str]
    bullets: List[str]

class WorkExperience(BaseModel):
    role: str
    company: str
    employment_type: str
    location: str
    start_month: str
    start_year: str
    end_month: str
    end_year: str
    bullets: List[str]

class Education(BaseModel):
    institution: str
    degree: str
    start_year: str
    end_year: str
    coursework: List[str]

class CVData(BaseModel):
    full_name: str
    city: str
    country: str
    email: str
    phone: str
    portfolio_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    technical_skills: TechnicalSkills
    projects: List[Project]
    work_experience: List[WorkExperience]
    education: List[Education]

class CVDraft(BaseModel):
    id: str
    template_id: str
    last_modified: datetime = Field(default_factory=datetime.utcnow)
    data: CVData
