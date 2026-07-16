import os
from dotenv import load_dotenv

# Load environment variables from .env file
# Move up one level from app/ to backend/ if necessary, or just search locally
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    load_dotenv()

class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default-fallback-super-secret-key-1234567890!")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Adzuna API
    ADZUNA_APP_ID: str = os.getenv("ADZUNA_APP_ID", "")
    ADZUNA_API_KEY: str = os.getenv("ADZUNA_API_KEY", "")

    # Ollama
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./database/career_system.db")

settings = Settings()
