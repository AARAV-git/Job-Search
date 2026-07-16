import os
import json
import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.services.llm_service import LLMService
from app.services.skill_gap_service import SkillGapService
from app.models.profile import UserProfile
from app.models.recommendation import Recommendation
from app.utils.helpers import parse_comma_separated

logger = logging.getLogger(__name__)

class RecommendationService:
    @staticmethod
    def generate_recommendations(user_id: int, db: Session, manual_skills: List[str] = None, manual_interests: List[str] = None) -> Dict[str, Any]:
        """
        Coordinates profile reading, LLM suggestions, roadmaps, gap evaluations,
        and database storage of career recommendations.
        """
        # Fetch user profile
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        
        # Extract fields or use default empty states
        skills = manual_skills if manual_skills is not None else (parse_comma_separated(profile.skills) if profile else [])
        interests = manual_interests if manual_interests is not None else (parse_comma_separated(profile.interests) if profile else [])
        
        certifications = parse_comma_separated(profile.certifications) if profile else []
        
        projects_list = []
        if profile and profile.projects:
            try:
                projects_list = json.loads(profile.projects)
            except Exception:
                projects_list = [{"name": "Manual Entry Project", "description": profile.projects, "technologies": []}]
                
        experience_list = []
        if profile and profile.experience:
            try:
                experience_list = json.loads(profile.experience)
            except Exception:
                experience_list = [{"company": "Manual Entry Experience", "role": "Software Developer", "duration": "N/A", "description": profile.experience}]

        # Prepare career prompt path
        base_dir = os.path.dirname(os.path.dirname(__file__))
        prompt_path = os.path.join(base_dir, "prompts", "career_prompt.txt")
        
        prompt_template = ""
        if os.path.exists(prompt_path):
            try:
                with open(prompt_path, "r", encoding="utf-8") as f:
                    prompt_template = f.read()
            except Exception as e:
                logger.error(f"Error reading career prompt: {e}")
                
        if not prompt_template:
            # Inline fallback prompt
            prompt_template = """
Recommend exactly 3 career roles for:
Skills: {skills}
Interests: {interests}
Certifications: {certifications}
Projects: {projects}
Experience: {experience}

Format as raw JSON containing "recommended_roles" array and "explanation".
"""

        # Format input strings
        skills_str = ", ".join(skills) if skills else "None"
        interests_str = ", ".join(interests) if interests else "None"
        certs_str = ", ".join(certifications) if certifications else "None"
        projects_str = json.dumps(projects_list)
        exp_str = json.dumps(experience_list)

        prompt = prompt_template.replace("{skills}", skills_str)\
            .replace("{interests}", interests_str)\
            .replace("{certifications}", certs_str)\
            .replace("{projects}", projects_str)\
            .replace("{experience}", exp_str)

        try:
            llm_response = LLMService.call_ollama(prompt)
            if "```" in llm_response:
                lines = llm_response.split("\n")
                cleaned = [l for l in lines if not l.strip().startswith("```")]
                llm_response = "\n".join(cleaned)
                
            career_data = json.loads(llm_response.strip())
        except Exception as e:
            logger.error(f"Failed parsing career recommendation JSON: {e}")
            # Generate default fallback JSON structure
            default_roles = ["Data Scientist", "Machine Learning Engineer", "Data Analyst"]
            if any(s.lower() in ["aws", "azure", "docker", "kubernetes", "cloud"] for s in skills):
                default_roles = ["Cloud Infrastructure Engineer", "DevOps Engineer", "Site Reliability Engineer"]
            elif any(s.lower() in ["cybersecurity", "security", "firewall", "network"] for s in skills):
                default_roles = ["Cybersecurity Analyst", "Security Engineer", "Network Engineer"]
            elif skills:
                default_roles = ["Full Stack Developer", "Backend Developer", "QA Automation Engineer"]
                
            career_data = {
                "recommended_roles": [
                    {
                        "role": r,
                        "match_score": 90 - (i * 5),
                        "why_recommended": "Based on technical profile strengths.",
                        "primary_skills_matched": skills[:3]
                    }
                    for i, r in enumerate(default_roles)
                ],
                "explanation": "Recommendations generated using default heuristic analyzer."
            }

        recommended_roles = career_data.get("recommended_roles", [])
        explanation = career_data.get("explanation", "Recommendations parsed successfully.")

        # For each role, generate a Skill Gap and a Learning Roadmap
        skill_gaps_result = []
        roadmaps_result = []
        
        roadmap_path = os.path.join(base_dir, "prompts", "roadmap_prompt.txt")
        roadmap_template = ""
        if os.path.exists(roadmap_path):
            try:
                with open(roadmap_path, "r", encoding="utf-8") as f:
                    roadmap_template = f.read()
            except Exception as e:
                logger.error(f"Error reading roadmap prompt: {e}")
                
        if not roadmap_template:
            roadmap_template = "Generate learning roadmap steps for: {role}"

        for role_obj in recommended_roles:
            role_name = role_obj.get("role")
            if not role_name:
                continue

            # 1. Skill Gap Analysis
            gap_analysis = SkillGapService.analyze_gap(role_name, skills)
            skill_gaps_result.append(gap_analysis)

            # 2. Learning Roadmap Generation
            roadmap_prompt = roadmap_template.replace("{role}", role_name)\
                .replace("{skills}", skills_str)\
                .replace("{interests}", interests_str)
            
            try:
                roadmap_response = LLMService.call_ollama(roadmap_prompt)
                if "```" in roadmap_response:
                    lines = roadmap_response.split("\n")
                    cleaned = [l for l in lines if not l.strip().startswith("```")]
                    roadmap_response = "\n".join(cleaned)
                
                roadmap_json = json.loads(roadmap_response.strip())
            except Exception as e:
                logger.error(f"Failed parsing roadmap for {role_name}: {e}")
                # Generate simple standard roadmap fallback
                roadmap_json = {
                    "role": role_name,
                    "steps": [
                        {
                            "step": 1,
                            "name": "Master Fundamental Skills",
                            "description": f"Focus on understanding core foundations required for {role_name}.",
                            "topics": ["Basics of logic", "Command lines", "Version control"],
                            "resources": ["W3Schools", "GitHub Docs"]
                        },
                        {
                            "step": 2,
                            "name": "Build Hands-on Experience",
                            "description": "Create sample workflows, test cases, and functional apps.",
                            "topics": ["API integrations", "Framework logic", "Containerization"],
                            "resources": ["Online tutorials", "Personal dev portfolios"]
                        }
                    ],
                    "recommended_certifications": [f"Basic Credentials in {role_name}"],
                    "suggested_projects": [
                        {
                            "name": f"Dynamic {role_name} Project",
                            "description": "Construct a mock database management application with standard authentication and cloud support.",
                            "technologies": skills[:3] if skills else ["Python", "SQL"]
                        }
                    ]
                }
            
            roadmaps_result.append(roadmap_json)

        # Build database payload
        recommendation_db = Recommendation(
            user_id=user_id,
            recommended_roles=json.dumps(recommended_roles),
            skill_gaps=json.dumps(skill_gaps_result),
            roadmap=json.dumps(roadmaps_result),
            explanation=explanation
        )

        db.add(recommendation_db)
        db.commit()
        db.refresh(recommendation_db)

        return {
            "id": recommendation_db.id,
            "user_id": recommendation_db.user_id,
            "recommended_roles": recommended_roles,
            "skill_gaps": skill_gaps_result,
            "roadmap": roadmaps_result,
            "explanation": explanation,
            "created_at": recommendation_db.created_at
        }
