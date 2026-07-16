from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    skills = Column(Text)              # Stored as comma-separated or JSON array of strings
    interests = Column(Text)           # Stored as comma-separated or JSON array of strings
    certifications = Column(Text)      # Stored as JSON or text
    projects = Column(Text)            # Stored as JSON or text
    experience = Column(Text)          # Stored as JSON or text
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="profile")
