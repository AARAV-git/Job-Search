from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class JobListingResponse(BaseModel):
    id: Optional[int] = None
    role_name: str
    company: str
    location: str
    salary: str
    job_url: str
    source: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        from_attributes = True

class TrendingRoleResponse(BaseModel):
    role_name: str
    job_count: int
    average_salary: float
    market_demand: str  # High/Medium/Low
