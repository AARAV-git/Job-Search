from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    resume_path = Column(String)
    extracted_skills = Column(Text)         # Stored as JSON or text
    extracted_projects = Column(Text)       # Stored as JSON or text
    extracted_experience = Column(Text)     # Stored as JSON or text
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="resumes")
