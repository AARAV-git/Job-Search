from sqlalchemy import Column, Integer, Text, DateTime
from datetime import datetime
from app.database import Base

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    top_skills = Column(Text)       # Stored as JSON string
    top_roles = Column(Text)        # Stored as JSON string
    salary_trends = Column(Text)     # Stored as JSON string
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
