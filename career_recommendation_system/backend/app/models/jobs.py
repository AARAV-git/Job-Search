from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base

class JobListing(Base):
    __tablename__ = "job_listings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role_name = Column(String)
    company = Column(String)
    location = Column(String)
    salary = Column(String)
    job_url = Column(String)
    source = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
