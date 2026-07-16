import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Database setup
from app.database import engine, Base
# Import models to ensure they register on Base
from app.models.user import User
from app.models.profile import UserProfile
from app.models.resume import Resume
from app.models.recommendation import Recommendation
from app.models.jobs import JobListing
from app.models.analytics import Analytics

# Routers
from app.routes import auth, profile, resume, recommendation, jobs, analytics

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize SQLite database tables
logger.info("Initializing database tables...")
Base.metadata.create_all(bind=engine)
logger.info("Database tables initialized successfully!")

# Initialize FastAPI app
app = FastAPI(
    title="AI-Powered Career Recommendation System",
    description="FastAPI Backend for LLM-Based Career Intelligence Platform",
    version="1.0.0"
)

# Set up CORS middleware for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(resume.router)
app.include_router(recommendation.router)
app.include_router(jobs.router)
app.include_router(analytics.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AI Career Intelligence Platform API",
        "documentation": "/docs",
        "endpoints": [
            "/auth/register",
            "/auth/login",
            "/auth/me",
            "/profile/create",
            "/profile/update",
            "/profile/{id}",
            "/resume/upload",
            "/resume/{id}",
            "/recommend-career",
            "/recommendations/{id}",
            "/jobs/search",
            "/jobs/trending",
            "/analytics/top-skills",
            "/analytics/salary-trends",
            "/analytics/top-roles"
        ]
    }
