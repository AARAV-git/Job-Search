import os
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.resume import Resume
from app.models.profile import UserProfile
from app.models.user import User
from app.schemas.resume_schema import ResumeResponse, ResumeAnalysisResult
from app.services.resume_parser import ResumeParser
from app.dependencies import get_current_user
from app.utils.helpers import parse_comma_separated

router = APIRouter(prefix="/resume", tags=["Resumes"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ResumeAnalysisResult, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate extension
    filename = file.filename
    ext = filename.split(".")[-1].lower()
    if ext not in ["pdf", "docx", "doc", "txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload PDF, DOCX, or TXT."
        )

    # Read bytes and parse
    file_bytes = await file.read()
    parsed_data = ResumeParser.parse_resume(file_bytes, filename)

    # Save file to uploads folder
    unique_filename = f"{uuid.uuid4()}_{filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    try:
        with open(file_path, "wb") as f:
            f.write(file_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save resume file: {e}"
        )

    # Save resume data to SQLite
    db_resume = Resume(
        user_id=current_user.id,
        resume_path=file_path,
        extracted_skills=json.dumps(parsed_data["skills"]),
        extracted_projects=json.dumps(parsed_data["projects"]),
        extracted_experience=json.dumps(parsed_data["experience"])
    )
    db.add(db_resume)
    
    # Also update/create UserProfile automatically so user doesn't have to fill manually!
    # This creates a seamless, extremely premium user onboarding experience!
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if profile:
        profile.skills = json.dumps(parsed_data["skills"])
        profile.projects = json.dumps(parsed_data["projects"])
        profile.experience = json.dumps(parsed_data["experience"])
        profile.certifications = json.dumps(parsed_data.get("certifications", []))
    else:
        profile = UserProfile(
            user_id=current_user.id,
            skills=json.dumps(parsed_data["skills"]),
            projects=json.dumps(parsed_data["projects"]),
            experience=json.dumps(parsed_data["experience"]),
            certifications=json.dumps(parsed_data.get("certifications", []))
        )
        db.add(profile)
        
    db.commit()
    db.refresh(db_resume)
    
    return ResumeAnalysisResult(
        skills=parsed_data["skills"],
        projects=parsed_data["projects"],
        experience=parsed_data["experience"],
        certifications=parsed_data.get("certifications", [])
    )

@router.get("/{id}", response_model=ResumeResponse)
def get_resume(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    resume = db.query(Resume).filter(Resume.id == id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume with ID {id} not found."
        )
    if resume.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resume."
        )
        
    # Unpack JSON strings for schema mapping
    skills = parse_comma_separated(resume.extracted_skills)
    projects = json.loads(resume.extracted_projects) if resume.extracted_projects else []
    experience = json.loads(resume.extracted_experience) if resume.extracted_experience else []
    
    return ResumeResponse(
        id=resume.id,
        user_id=resume.user_id,
        resume_path=resume.resume_path,
        extracted_skills=skills,
        extracted_projects=projects,
        extracted_experience=experience,
        uploaded_at=resume.uploaded_at
    )
