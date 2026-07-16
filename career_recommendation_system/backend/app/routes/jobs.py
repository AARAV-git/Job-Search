from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.jobs_schema import JobListingResponse, TrendingRoleResponse
from app.services.adzuna_service import AdzunaService
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("/search", response_model=List[JobListingResponse])
def search_jobs(
    role: str = Query(..., description="Role title to search"),
    location: str = Query("London", description="Location name"),
    country: str = Query("gb", description="2-letter country code"),
    page: int = Query(1, description="Page index"),
    current_user: User = Depends(get_current_user)
):
    """
    Searches live job postings using the Adzuna service (with full mock backups).
    """
    jobs = AdzunaService.search_jobs(role=role, location=location, country=country, page=page)
    return [JobListingResponse(**j) for j in jobs]

@router.get("/trending", response_model=TrendingRoleResponse)
def get_trending_role_insights(
    role: str = Query(..., description="Role title for demand assessment"),
    country: str = Query("gb", description="Country code"),
    current_user: User = Depends(get_current_user)
):
    """
    Gathers salary ranges and demand metrics for a trending job title.
    """
    insights = AdzunaService.get_salary_insights(role=role, country=country)
    return TrendingRoleResponse(
        role_name=insights["role_name"],
        job_count=insights["active_postings_estimate"],
        average_salary=insights["average_salary"],
        market_demand=insights["market_demand"]
    )
