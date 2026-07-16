import json
import logging
import requests
from app.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    @staticmethod
    def call_ollama(prompt: str) -> str:
        """
        Sends a request to local Ollama runtime. If Ollama is not running
        or returns an error, it falls back to a smart mock JSON builder
        matching the desired prompt format.
        """
        url = f"{settings.OLLAMA_HOST}/api/generate"
        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.2
            }
        }
        
        try:
            logger.info(f"Attempting to query Ollama model '{settings.OLLAMA_MODEL}' at {url}...")
            response = requests.post(url, json=payload, timeout=10)
            if response.status_code == 200:
                result_json = response.json()
                return result_json.get("response", "").strip()
            else:
                logger.warning(f"Ollama returned status code {response.status_code}. Using mock fallback.")
        except Exception as e:
            logger.warning(f"Failed to communicate with Ollama: {e}. Using mock fallback.")
            
        return LLMService.generate_mock_response(prompt)

    @staticmethod
    def generate_mock_response(prompt: str) -> str:
        """
        Intelligently builds a mock JSON response depending on the prompt type.
        """
        prompt_lower = prompt.lower()
        
        # 1. Career Recommendation Prompt
        if "recommend exactly 3 suitable career roles" in prompt_lower or "recommended_roles" in prompt_lower:
            # We can extract skills from the prompt if possible to customize the mock response!
            extracted_skills = []
            if "skills:" in prompt_lower:
                try:
                    skills_section = prompt.split("Skills:")[1].split("- Interests:")[0]
                    # Parse out skills by lines and commas
                    raw_skills = []
                    for line in skills_section.split("\n"):
                        if line.strip():
                            if "," in line:
                                raw_skills.extend([item.strip() for item in line.split(",")])
                            else:
                                raw_skills.append(line.strip())
                    extracted_skills = [s.strip(" -[]*\"'") for s in raw_skills if s.strip()]
                    extracted_skills = [s for s in extracted_skills if s]
                except Exception:
                    pass
            
            if not extracted_skills:
                extracted_skills = ["Python", "SQL", "Machine Learning"]
                
            # Customize recommendations based on extracted skills
            is_data_science = any(s.lower() in ["python", "machine learning", "ml", "data science", "pandas", "pytorch", "tensorflow"] for s in extracted_skills)
            is_cybersec = any(s.lower() in ["cybersecurity", "security", "firewall", "penetration", "network", "linux"] for s in extracted_skills)
            is_cloud = any(s.lower() in ["aws", "azure", "docker", "kubernetes", "cloud", "devops"] for s in extracted_skills)
            
            if is_data_science:
                roles = [
                    {
                        "role": "Data Scientist",
                        "match_score": 95,
                        "why_recommended": "Based on your strong foundation in Python, machine learning, and data structures.",
                        "primary_skills_matched": [s for s in extracted_skills if s.lower() in ["python", "machine learning", "ml", "pandas", "sql"]]
                    },
                    {
                        "role": "Machine Learning Engineer",
                        "match_score": 88,
                        "why_recommended": "You have solid skills in algorithm design and machine learning libraries, perfect for model deployment.",
                        "primary_skills_matched": [s for s in extracted_skills if s.lower() in ["python", "machine learning", "ml"]]
                    },
                    {
                        "role": "Data Analyst",
                        "match_score": 85,
                        "why_recommended": "Your data manipulation and SQL skills are highly relevant for building business dashboards.",
                        "primary_skills_matched": [s for s in extracted_skills if s.lower() in ["sql", "pandas", "python"]]
                    }
                ]
            elif is_cybersec:
                roles = [
                    {
                        "role": "Cybersecurity Analyst",
                        "match_score": 93,
                        "why_recommended": "Excellent match due to your knowledge of security architectures, firewalls, and network protocols.",
                        "primary_skills_matched": [s for s in extracted_skills if s.lower() in ["cybersecurity", "security", "network", "linux"]]
                    },
                    {
                        "role": "Security Engineer",
                        "match_score": 87,
                        "why_recommended": "You have a solid base in systems security and threat mitigation strategies.",
                        "primary_skills_matched": [s for s in extracted_skills if s.lower() in ["security", "linux"]]
                    },
                    {
                        "role": "Network Engineer",
                        "match_score": 80,
                        "why_recommended": "Your network fundamentals line up well with routing, switching, and administrative controls.",
                        "primary_skills_matched": [s for s in extracted_skills if s.lower() in ["network", "firewall"]]
                    }
                ]
            elif is_cloud:
                roles = [
                    {
                        "role": "Cloud Infrastructure Engineer",
                        "match_score": 94,
                        "why_recommended": "Your docker, cloud configuration, and virtual network experience makes you highly eligible.",
                        "primary_skills_matched": [s for s in extracted_skills if s.lower() in ["aws", "azure", "docker", "cloud"]]
                    },
                    {
                        "role": "DevOps Engineer",
                        "match_score": 90,
                        "why_recommended": "Great background in virtualization, containerization, and configuration automation.",
                        "primary_skills_matched": [s for s in extracted_skills if s.lower() in ["docker", "kubernetes", "devops"]]
                    },
                    {
                        "role": "Site Reliability Engineer",
                        "match_score": 82,
                        "why_recommended": "Your systems infrastructure and automation skills align perfectly with high-availability demands.",
                        "primary_skills_matched": [s for s in extracted_skills if s.lower() in ["kubernetes", "docker", "cloud"]]
                    }
                ]
            else:
                # General software engineering
                roles = [
                    {
                        "role": "Full Stack Developer",
                        "match_score": 92,
                        "why_recommended": "Your versatility in both frontend and backend technologies makes you a great fit for full stack roles.",
                        "primary_skills_matched": [s for s in extracted_skills if s.lower() in ["python", "javascript", "react", "html", "css", "sql"]]
                    },
                    {
                        "role": "Backend Developer",
                        "match_score": 88,
                        "why_recommended": "Strong logical thinking and backend server/database exposure aligns with backend engineering.",
                        "primary_skills_matched": [s for s in extracted_skills if s.lower() in ["python", "sql", "backend", "fastapi"]]
                    },
                    {
                        "role": "QA Automation Engineer",
                        "match_score": 80,
                        "why_recommended": "Your knowledge of programming languages can easily be applied to test automation tools.",
                        "primary_skills_matched": [s for s in extracted_skills if s.lower() in ["python", "javascript"]]
                    }
                ]
                
            mock_data = {
                "recommended_roles": roles,
                "explanation": f"Based on your profile emphasizing {', '.join(extracted_skills[:4])}, you have high competency for software engineering and specialization fields. We suggest developing cloud/ML capabilities to increase market readiness."
            }
            return json.dumps(mock_data)
            
        # 2. Roadmap Prompt
        elif "generate a step-by-step learning roadmap" in prompt_lower or "steps" in prompt_lower:
            # Extract role
            role = "AI Engineer"
            if "recommended role:" in prompt_lower:
                try:
                    role = prompt.split("Recommended Role:")[1].split("\n")[0].strip()
                except Exception:
                    pass
                    
            mock_data = {
                "role": role,
                "steps": [
                    {
                        "step": 1,
                        "name": f"Master Core Fundamentals of {role}",
                        "description": "Establish a strong foundational understanding of primary languages and tools.",
                        "topics": ["Syntax & Logic", "Data Formats & APIs", "Version Control with Git"],
                        "resources": ["Official Documentation", "W3Schools", "GitHub Guides"]
                    },
                    {
                        "step": 2,
                        "name": "Advanced Specialized Concepts",
                        "description": "Dive deep into specialized domain logic, frameworks, and architecture.",
                        "topics": ["Design Patterns", "State Management", "Database Optimization"],
                        "resources": ["Advanced eBooks", "Coursera Specialization", "Medium Tech Blogs"]
                    },
                    {
                        "step": 3,
                        "name": "Deployment, Monitoring & CI/CD",
                        "description": "Learn to host, scale, and automate your software solutions.",
                        "topics": ["Containerization with Docker", "Cloud Hosting (AWS/GCP)", "CI/CD Pipelines"],
                        "resources": ["Docker Handbook", "AWS Free Tier Projects", "YouTube Crash Courses"]
                    }
                ],
                "recommended_certifications": [
                    f"AWS Certified Solutions Architect - {role} Path",
                    f"Professional Cert in {role} - Coursera / edX"
                ],
                "suggested_projects": [
                    {
                        "name": f"Smart {role} Portal",
                        "description": "Build an end-to-end web portal utilizing cloud services, security policies, and custom dashboards.",
                        "technologies": ["React", "FastAPI", "Docker", "SQLite"]
                    },
                    {
                        "name": "Enterprise Automation Dashboard",
                        "description": "Develop a pipeline automation project to index, process, and analyze system transactions in real-time.",
                        "technologies": ["Python", "PostgreSQL", "GitHub Actions"]
                    }
                ]
            }
            return json.dumps(mock_data)
            
        # 3. Skill Gap Prompt
        elif "identify key missing skills" in prompt_lower or "missing_skills" in prompt_lower:
            role = "AI Engineer"
            if "recommended role:" in prompt_lower:
                try:
                    role = prompt.split("Recommended Role:")[1].split("\n")[0].strip()
                except Exception:
                    pass
                    
            # Suggest missing skills depending on role
            missing = ["Docker", "Kubernetes", "CI/CD Pipelines", "System Design"]
            importance = {
                "Docker": "High",
                "Kubernetes": "Medium",
                "CI/CD Pipelines": "High",
                "System Design": "Medium"
            }
            
            if "data scientist" in role.lower() or "ml engineer" in role.lower():
                missing = ["TensorFlow/PyTorch", "MLOps (MLflow/DVC)", "Docker", "Big Data (Spark)"]
                importance = {
                    "TensorFlow/PyTorch": "High",
                    "MLOps (MLflow/DVC)": "High",
                    "Docker": "Medium",
                    "Big Data (Spark)": "Medium"
                }
            elif "cybersecurity" in role.lower() or "security" in role.lower():
                missing = ["Wireshark", "Penetration Testing (Metasploit)", "SIEM Tools", "Network Cryptography"]
                importance = {
                    "Wireshark": "High",
                    "Penetration Testing (Metasploit)": "High",
                    "SIEM Tools": "Medium",
                    "Network Cryptography": "Medium"
                }
            elif "backend" in role.lower():
                missing = ["Redis Caching", "Docker", "PostgreSQL Optimization", "Microservices Architecture"]
                importance = {
                    "Redis Caching": "Medium",
                    "Docker": "High",
                    "PostgreSQL Optimization": "High",
                    "Microservices Architecture": "Medium"
                }
                
            mock_data = {
                "role": role,
                "missing_skills": missing,
                "importance": importance
            }
            return json.dumps(mock_data)
            
        # Standard Fallback
        return "{}"
