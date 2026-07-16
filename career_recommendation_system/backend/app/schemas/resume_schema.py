from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class ResumeResponse(BaseModel):
    id: int
    user_id: int
    resume_path: str
    extracted_skills: List[str] = []
    extracted_projects: List[Dict[str, Any]] = []
    extracted_experience: List[Dict[str, Any]] = []
    uploaded_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class ResumeAnalysisResult(BaseModel):
    skills: List[str]
    projects: List[Dict[str, Any]]
    experience: List[Dict[str, Any]]
    certifications: List[str] = []
