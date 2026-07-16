from fastapi import APIRouter, Depends, Query
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.analytics_service import AnalyticsService
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/top-skills", response_model=List[Dict[str, Any]])
def get_top_skills(
    limit: int = Query(10, description="Max skills to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the most common skills found in candidate profiles.
    """
    return AnalyticsService.get_top_skills(db, limit)

@router.get("/top-roles", response_model=List[Dict[str, Any]])
def get_top_roles(
    limit: int = Query(5, description="Max roles to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the most frequently recommended roles in the system.
    """
    return AnalyticsService.get_top_roles(db, limit)

@router.get("/salary-trends", response_model=List[Dict[str, Any]])
def get_salary_trends(
    limit: int = Query(5, description="Max trends to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns salary levels and demand estimations for popular roles.
    """
    return AnalyticsService.get_salary_trends(db, limit)
