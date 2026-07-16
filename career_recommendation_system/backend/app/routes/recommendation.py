import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.recommendation import Recommendation
from app.schemas.recommendation_schema import CareerRecommendationResponse, GenerateRecommendationRequest
from app.services.recommendation_service import RecommendationService
from app.dependencies import get_current_user

router = APIRouter(tags=["Recommendations"])

def map_db_to_recommendation_response(rec: Recommendation) -> CareerRecommendationResponse:
    return CareerRecommendationResponse(
        id=rec.id,
        user_id=rec.user_id,
        recommended_roles=json.loads(rec.recommended_roles) if rec.recommended_roles else [],
        skill_gaps=json.loads(rec.skill_gaps) if rec.skill_gaps else [],
        roadmap=json.loads(rec.roadmap) if rec.roadmap else [],
        explanation=rec.explanation,
        created_at=rec.created_at
    )

@router.post("/recommend-career", response_model=CareerRecommendationResponse)
def generate_career_recommendations(
    request: GenerateRecommendationRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    skills_override = request.skills if request else None
    interests_override = request.interests if request else None

    # Call recommendation service
    try:
        rec_data = RecommendationService.generate_recommendations(
            user_id=current_user.id,
            db=db,
            manual_skills=skills_override,
            manual_interests=interests_override
        )
        # Fetch the newly created database record to map it correctly
        db_rec = db.query(Recommendation).filter(Recommendation.id == rec_data["id"]).first()
        return map_db_to_recommendation_response(db_rec)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate career recommendations: {e}"
        )

@router.get("/recommendations", response_model=List[CareerRecommendationResponse])
def get_user_recommendations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recs = db.query(Recommendation).filter(Recommendation.user_id == current_user.id).order_by(Recommendation.created_at.desc()).all()
    return [map_db_to_recommendation_response(r) for r in recs]

@router.get("/recommendations/{id}", response_model=CareerRecommendationResponse)
def get_recommendation(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rec = db.query(Recommendation).filter(Recommendation.id == id).first()
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recommendation with ID {id} not found."
        )
    if rec.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this recommendation details."
        )
    return map_db_to_recommendation_response(rec)
