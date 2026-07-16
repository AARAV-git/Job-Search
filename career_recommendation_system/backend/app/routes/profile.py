import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.profile import UserProfile
from app.models.user import User
from app.schemas.profile_schema import UserProfileCreate, UserProfileUpdate, UserProfileResponse
from app.utils.helpers import format_as_json_string, parse_comma_separated
from app.dependencies import get_current_user

router = APIRouter(prefix="/profile", tags=["Profiles"])

def map_db_to_schema(profile: UserProfile) -> UserProfileResponse:
    """Helper to convert db text columns back to lists and dicts for Pydantic"""
    skills = parse_comma_separated(profile.skills)
    interests = parse_comma_separated(profile.interests)
    
    certifications = parse_comma_separated(profile.certifications)
    
    projects = []
    if profile.projects:
        try:
            projects = json.loads(profile.projects)
        except Exception:
            projects = [{"name": "My Project", "description": profile.projects, "technologies": []}]
            
    experience = []
    if profile.experience:
        try:
            experience = json.loads(profile.experience)
        except Exception:
            experience = [{"company": "My Experience", "role": "Software Developer", "duration": "N/A", "description": profile.experience}]

    return UserProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        skills=skills,
        interests=interests,
        certifications=certifications,
        projects=projects,
        experience=experience,
        created_at=profile.created_at
    )

@router.post("/create", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(request: UserProfileCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if profile already exists
    existing = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User profile already exists. Please use the update endpoint."
        )

    db_profile = UserProfile(
        user_id=current_user.id,
        skills=json.dumps(request.skills),
        interests=json.dumps(request.interests),
        certifications=json.dumps(request.certifications),
        projects=json.dumps(request.projects),
        experience=json.dumps(request.experience)
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return map_db_to_schema(db_profile)

@router.put("/update", response_model=UserProfileResponse)
def update_profile(request: UserProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not db_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create a profile first."
        )

    if request.skills is not None:
        db_profile.skills = json.dumps(request.skills)
    if request.interests is not None:
        db_profile.interests = json.dumps(request.interests)
    if request.certifications is not None:
        db_profile.certifications = json.dumps(request.certifications)
    if request.projects is not None:
        db_profile.projects = json.dumps(request.projects)
    if request.experience is not None:
        db_profile.experience = json.dumps(request.experience)

    db.commit()
    db.refresh(db_profile)
    return map_db_to_schema(db_profile)

@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not db_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for this user."
        )
    return map_db_to_schema(db_profile)

@router.get("/{id}", response_model=UserProfileResponse)
def get_profile(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_profile = db.query(UserProfile).filter(UserProfile.id == id).first()
    if not db_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {id} not found."
        )
    # Check authorization (only owner can fetch)
    if db_profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this profile"
        )
    return map_db_to_schema(db_profile)
