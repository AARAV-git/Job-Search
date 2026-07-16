import os
import json
import logging
from typing import List, Dict, Any
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)

class SkillGapService:
    @staticmethod
    def analyze_gap(role: str, user_skills: List[str]) -> Dict[str, Any]:
        """
        Calculates differences between user skills and the target role using LLM analysis.
        Reads the system prompt, fills parameters, and handles response parsing.
        """
        # Resolve prompt file path
        base_dir = os.path.dirname(os.path.dirname(__file__))
        prompt_path = os.path.join(base_dir, "prompts", "skill_gap_prompt.txt")
        
        prompt_template = ""
        try:
            if os.path.exists(prompt_path):
                with open(prompt_path, "r", encoding="utf-8") as f:
                    prompt_template = f.read()
            else:
                logger.warning("skill_gap_prompt.txt not found. Using inline fallback.")
        except Exception as e:
            logger.error(f"Error reading prompt file: {e}")

        # Inline fallback if prompt file was unreadable
        if not prompt_template:
            prompt_template = """
Recommended Role: {role}
User Skills: {skills}

Identify missing skills for this role, mapping each skill to High/Medium/Low importance. Return ONLY JSON.
"""

        skills_str = ", ".join(user_skills) if user_skills else "No technical skills listed."
        prompt = prompt_template.replace("{role}", role).replace("{skills}", skills_str)
        
        try:
            llm_response = LLMService.call_ollama(prompt)
            # Remove possible code blocks
            if "```" in llm_response:
                lines = llm_response.split("\n")
                cleaned = [l for l in lines if not l.strip().startswith("```")]
                llm_response = "\n".join(cleaned)
                
            parsed = json.loads(llm_response.strip())
            
            # Validation matching our schema: {role, missing_skills, importance}
            return {
                "role": parsed.get("role", role),
                "missing_skills": parsed.get("missing_skills", []),
                "importance": parsed.get("importance", {})
            }
        except Exception as e:
            logger.error(f"Failed to analyze skill gaps: {e}. Generating default structure.")
            
            # Simple offline fallback mapping
            default_missing = ["Docker", "Kubernetes", "System Architecture", "Unit Testing"]
            default_importance = {s: "Medium" for s in default_missing}
            default_importance["Docker"] = "High"
            
            return {
                "role": role,
                "missing_skills": default_missing,
                "importance": default_importance
            }
        
    @staticmethod
    def identify_gaps_for_roles(roles: List[str], user_skills: List[str]) -> List[Dict[str, Any]]:
        results = []
        for role in roles:
            results.append(SkillGapService.analyze_gap(role, user_skills))
        return results
