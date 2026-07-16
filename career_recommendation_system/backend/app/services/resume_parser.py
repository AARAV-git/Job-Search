import re
import io
import json
import logging
from typing import Dict, Any, List
import PyPDF2
import docx
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)

# Predefined dictionary of popular technical skills to assist keyword scanner
COMMON_SKILLS = [
    "python", "javascript", "java", "c++", "c#", "ruby", "php", "swift", "kotlin", "typescript",
    "html", "css", "react", "angular", "vue", "node", "express", "django", "flask", "fastapi",
    "spring", "asp.net", "laravel", "rails", "sql", "postgresql", "mysql", "mongodb", "redis",
    "sqlite", "cassandra", "neo4j", "aws", "azure", "gcp", "docker", "kubernetes", "jenkins",
    "terraform", "ansible", "git", "github", "gitlab", "ci/cd", "linux", "unix", "bash",
    "machine learning", "deep learning", "ai", "artificial intelligence", "data science",
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras", "opencv", "nlp",
    "spark", "hadoop", "tableau", "power bi", "cybersecurity", "penetration testing",
    "firewall", "network security", "cryptography", "agile", "scrum", "jira"
]

class ResumeParser:
    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        text = ""
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        except Exception as e:
            logger.error(f"Error reading PDF: {e}")
        return text

    @staticmethod
    def extract_text_from_docx(file_bytes: bytes) -> str:
        text = ""
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                text += para.text + "\n"
        except Exception as e:
            logger.error(f"Error reading DOCX: {e}")
        return text

    @staticmethod
    def parse_resume(file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Parses resume from bytes using extension to decide format.
        Combines keyword scanning with LLM analysis for clean extraction.
        """
        ext = filename.split(".")[-1].lower()
        raw_text = ""
        
        if ext == "pdf":
            raw_text = ResumeParser.extract_text_from_pdf(file_bytes)
        elif ext in ["docx", "doc"]:
            raw_text = ResumeParser.extract_text_from_docx(file_bytes)
        else:
            # Fallback treat as text
            try:
                raw_text = file_bytes.decode("utf-8")
            except Exception:
                raw_text = str(file_bytes)

        if not raw_text.strip():
            return {
                "skills": [],
                "projects": [],
                "experience": [],
                "certifications": []
            }

        # 1. Standard text scanning using Regex to get basic skills and certifications
        scanned_skills = []
        for skill in COMMON_SKILLS:
            # Match boundary word cases, e.g., \bpython\b
            pattern = r"\b" + re.escape(skill) + r"\b"
            if re.search(pattern, raw_text.lower()):
                # Keep capitalizations nice
                title_skill = skill.title()
                if skill == "sql": title_skill = "SQL"
                elif skill == "aws": title_skill = "AWS"
                elif skill == "gcp": title_skill = "GCP"
                elif skill == "nlp": title_skill = "NLP"
                elif skill == "ai": title_skill = "AI"
                elif skill == "html": title_skill = "HTML"
                elif skill == "css": title_skill = "CSS"
                elif skill == "ci/cd": title_skill = "CI/CD"
                elif skill == "api": title_skill = "API"
                scanned_skills.append(title_skill)

        # Look for certifications using basic patterns
        scanned_certs = []
        cert_keywords = ["certified", "certification", "license", "aws certified", "microsoft certified", "google certified", "comptia"]
        lines = raw_text.split("\n")
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in cert_keywords):
                cleaned = line.strip(" *-•")
                if len(cleaned) > 5 and len(cleaned) < 100:
                    scanned_certs.append(cleaned)

        # 2. Leverage LLM to build structural JSON from raw text (extremely premium AI approach)
        prompt = f"""
You are a highly advanced Resume Parser. Extract key sections (Skills, Projects, Professional Experience, Certifications) from the raw resume text provided.

Raw Resume Text:
{raw_text[:4000]}

Format your output as a valid JSON object matching this structure:
{{
  "skills": ["Skill A", "Skill B"],
  "projects": [
    {{
      "name": "Project Title",
      "description": "Short description of project...",
      "technologies": ["Python", "Flask"]
    }}
  ],
  "experience": [
    {{
      "company": "Company Name",
      "role": "Job Title",
      "duration": "e.g., June 2022 - Present",
      "description": "Details of role and achievements..."
    }}
  ],
  "certifications": ["Certification Name"]
}}

Ensure that the output is standard JSON, and do NOT wrap it in ```json blocks or include any extra text. Output ONLY the raw JSON.
"""
        
        try:
            llm_response = LLMService.call_ollama(prompt)
            # Try to clean up code block wraps if LLM ignored instructions
            if "```" in llm_response:
                lines_res = llm_response.split("\n")
                cleaned_lines = [l for l in lines_res if not l.strip().startswith("```")]
                llm_response = "\n".join(cleaned_lines)
            
            parsed_json = json.loads(llm_response.strip())
            
            # Combine scanner and LLM results to avoid missing obvious details
            all_skills = list(set(parsed_json.get("skills", []) + scanned_skills))
            all_certs = list(set(parsed_json.get("certifications", []) + scanned_certs))
            
            return {
                "skills": all_skills,
                "projects": parsed_json.get("projects", []),
                "experience": parsed_json.get("experience", []),
                "certifications": all_certs
            }
        except Exception as e:
            logger.error(f"Error parsing resume via LLM, falling back to regex scans: {e}")
            # Fallback simple structure using scanning results
            return {
                "skills": scanned_skills,
                "projects": [{"name": "Extracted Project", "description": "Please enter project details manually.", "technologies": []}],
                "experience": [{"company": "Previous Company", "role": "Software Developer", "duration": "N/A", "description": "Please enter experience details manually."}],
                "certifications": scanned_certs
            }
