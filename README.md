# 🚀 AI-Powered Career Recommendation System

[![Python Version](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.95%2B-009688.svg?style=flat&logo=FastAPI)](https://fastapi.tiangolo.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57.svg?style=flat&logo=SQLite)](https://www.sqlite.org/)
[![Ollama](https://img.shields.io/badge/LLM-Ollama%20(Llama3)-orange.svg)](https://ollama.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg?logo=docker)](https://www.docker.com/)

An ultra-modern, end-to-end FastAPI backend coupled with local Large Language Models (LLM) and live market index endpoints to deliver hyper-personalized career roadmaps, automated resume scans, skill gap matrices, and salary analytics.

---

## 🗺️ System Data Flow & Architecture

```mermaid
graph TD
    Client[React Frontend / TestClient] -->|JWT Auth| Router[FastAPI Routers]
    Router -->|Check Token| Auth[JWT & Hashing Middleware]
    
    %% Resume Path
    Router -->|Upload File| ResumeSvc[Resume Parser Service]
    ResumeSvc -->|Regex Scanner / PDF & Docx| ParsingResult[Extracted Skills & Projects]
    
    %% Profile Path
    Router -->|Create/Update| ProfileSvc[Profile Manager]
    ParsingResult -->|Merge| ProfileSvc
    
    %% Recommendation Path
    Router -->|Trigger Recommendations| RecSvc[Recommendation Service]
    ProfileSvc -->|Read Skills/Interests| RecSvc
    
    RecSvc -->|System Prompts| LLMSvc[LLM Service / Ollama Client]
    LLMSvc -->|API Port 11434 / Llama3| LocalOllama[Local Ollama Runtime]
    LLMSvc -->|Timeout/Error Fallback| SmartMocks[Smart Mock JSON Heuristics]
    
    RecSvc -->|Role Matching| GapSvc[Skill Gap Analyzer]
    
    Router -->|Query Jobs| AdzunaSvc[Adzuna API Service]
    AdzunaSvc -->|HTTPS Request| LiveAdzuna[Adzuna Live API]
    AdzunaSvc -->|Timeout/API Fail Fallback| MockJobs[Mock Vacancies & Wage Metrics]
    
    %% Database persistence
    ProfileSvc -->|Sync| DB[(SQLite Database)]
    RecSvc -->|Save Analytics & Blueprints| DB
    Auth -->|Register/Fetch Users| DB
    
    style Client fill:#eef2ff,stroke:#6366f1,stroke-width:2px;
    style LocalOllama fill:#fef3c7,stroke:#d97706,stroke-width:2px;
    style LiveAdzuna fill:#f0fdf4,stroke:#16a34a,stroke-width:2px;
    style DB fill:#ecfeff,stroke:#0891b2,stroke-width:2px;
```

---

## 📂 Project Directory Structure

```text
career_recommendation_system/
│
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI entry point
│   │   ├── config.py             # Settings configurations (.env)
│   │   ├── database.py           # SQLAlchemy SQLite connection
│   │   ├── dependencies.py       # JWT session auth dependency
│   │   │
│   │   ├── models/               # SQLAlchemy Database Schemas (Physical Tables)
│   │   │   ├── user.py           # Users model (authentication data, relations)
│   │   │   ├── profile.py        # User profiles (skills, experience, interest strings)
│   │   │   ├── resume.py         # Ingested resume structures & text extracts
│   │   │   ├── recommendation.py # Stored AI career recommendations, roadmaps, and gap JSONs
│   │   │   ├── jobs.py           # Job cache listings schema
│   │   │   └── analytics.py      # Aggregated metrics database schema
│   │   │
│   │   ├── schemas/              # Pydantic Request/Response validation layers
│   │   │   ├── auth_schema.py    # Login, registration, token payload parameters
│   │   │   ├── profile_schema.py # User profile setup structures
│   │   │   ├── resume_schema.py  # Binary parsing feedback models
│   │   │   ├── recommendation_schema.py # AI roadmap & career projection structures
│   │   │   └── jobs_schema.py    # Adzuna job entries and salary statistics
│   │   │
│   │   ├── routes/               # API Controllers (Endpoint Handlers)
│   │   │   ├── auth.py           # User access: /auth/register, /auth/login, /auth/me
│   │   │   ├── profile.py        # Portfolio setup: /profile/create, /profile/update, /profile/{id}
│   │   │   ├── resume.py         # File inputs: /resume/upload, /resume/{id}
│   │   │   ├── recommendation.py # Core engine: /recommend-career, /recommendations/{id}
│   │   │   ├── jobs.py           # External vacancies: /jobs/search, /jobs/trending
│   │   │   └── analytics.py      # Insights: /analytics/top-skills, /analytics/salary-trends
│   │   │
│   │   ├── services/             # Core Core Logic (Third-Party APIs & File Parsers)
│   │   │   ├── llm_service.py    # Local Ollama client with fallback mock JSON heuristics
│   │   │   ├── resume_parser.py  # Binary PDF / DOCX scanner and parser
│   │   │   ├── adzuna_service.py # Live job listing aggregator and salary stats crawler
│   │   │   ├── recommendation_service.py # Career intelligence workflow manager
│   │   │   ├── skill_gap_service.py # Core logic mapping missing skills and importance
│   │   │   └── analytics_service.py # Platform aggregation stats computer
│   │   │
│   │   ├── prompts/              # LLM System Prompts
│   │   │   ├── career_prompt.txt     # Main career prompt using profile inputs
│   │   │   ├── roadmap_prompt.txt    # Step-by-step roadmap template
│   │   │   └── skill_gap_prompt.txt  # Profile comparative gap prompt
│   │   │
│   │   └── utils/                # General Helpers
│   │       ├── hashing.py            # Password hashing functions using raw bcrypt
│   │       ├── jwt_handler.py        # Signed JWT encoders and token decoders
│   │       ├── validators.py         # Input parsing constraints (email/password format)
│   │       └── helpers.py            # String parsers and JSON conversions
│   │
│   ├── database/
│   │   └── career_system.db      # Automatically initialized SQLite database
│   │
│   ├── tests/
│   │   └── test_backend.py       # Complete integration testing suite (All 5 suites)
│   │
│   ├── .env                      # Application secret configurations & API Keys
│   ├── requirements.txt          # Third-party Python dependencies
│   ├── vercel.json               # Serverless host configurations (FastAPI + Vercel)
│   ├── Dockerfile                # Production container specifications
│   └── run.py                    # Dev server launcher
│
└── README.md                     # Single Source of Truth setup and API Guide
