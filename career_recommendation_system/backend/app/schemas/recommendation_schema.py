from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class RoleRecommendation(BaseModel):
    role: str
    match_score: int  # 0 to 100
    why_recommended: str
    primary_skills_matched: List[str]

class SkillGapAnalysis(BaseModel):
    role: str
    missing_skills: List[str]
    importance: Dict[str, str]  # skill name -> High/Medium/Low

class LearningRoadmap(BaseModel):
    role: str
    steps: List[Dict[str, Any]]  # Step number, description, topics, resources
    recommended_certifications: List[str]
    suggested_projects: List[Dict[str, Any]]

class CareerRecommendationResponse(BaseModel):
    id: int
    user_id: int
    recommended_roles: List[RoleRecommendation]
    skill_gaps: List[SkillGapAnalysis]
    roadmap: List[LearningRoadmap]
    explanation: str
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class GenerateRecommendationRequest(BaseModel):
    # Optional parameters to override profile
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
