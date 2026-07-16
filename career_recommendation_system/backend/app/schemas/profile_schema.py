from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

class UserProfileCreate(BaseModel):
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    projects: List[dict] = Field(default_factory=list)     # List of project objects (name, description, tech_used)
    experience: List[dict] = Field(default_factory=list)   # List of experience objects (company, role, duration, description)

class UserProfileUpdate(BaseModel):
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    projects: Optional[List[dict]] = None
    experience: Optional[List[dict]] = None

class UserProfileResponse(BaseModel):
    id: int
    user_id: int
    skills: List[str] = []
    interests: List[str] = []
    certifications: List[str] = []
    projects: List[dict] = []
    experience: List[dict] = []
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
