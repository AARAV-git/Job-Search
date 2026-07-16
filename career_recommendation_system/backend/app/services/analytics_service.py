import json
import logging
from collections import Counter
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.profile import UserProfile
from app.models.recommendation import Recommendation
from app.utils.helpers import parse_comma_separated
from app.services.adzuna_service import AdzunaService

logger = logging.getLogger(__name__)

class AnalyticsService:
    @staticmethod
    def get_top_skills(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Aggregates and counts technical skills across all user profiles in the database.
        """
        profiles = db.query(UserProfile).all()
        if not profiles:
            # High-fidelity mock trends if database is empty
            mock_skills = [
                {"skill": "Python", "count": 28},
                {"skill": "SQL", "count": 22},
                {"skill": "JavaScript", "count": 19},
                {"skill": "Docker", "count": 15},
                {"skill": "React", "count": 14},
                {"skill": "Machine Learning", "count": 12},
                {"skill": "AWS", "count": 11},
                {"skill": "FastAPI", "count": 9},
                {"skill": "Git", "count": 8},
                {"skill": "Kubernetes", "count": 6}
            ]
            return mock_skills[:limit]

        skill_counter = Counter()
        for prof in profiles:
            skills = parse_comma_separated(prof.skills)
            for skill in skills:
                if skill:
                    # Uniform formatting
                    skill_counter[skill.strip()] += 1

        top_skills = skill_counter.most_common(limit)
        return [{"skill": name, "count": count} for name, count in top_skills]

    @staticmethod
    def get_top_roles(db: Session, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Aggregates most popular recommended roles across all historical recommendation outputs.
        """
        recommendations = db.query(Recommendation).all()
        if not recommendations:
            # Premium mock trends
            mock_roles = [
                {"role": "Data Scientist", "count": 14},
                {"role": "Full Stack Developer", "count": 11},
                {"role": "Cloud Infrastructure Engineer", "count": 9},
                {"role": "Backend Developer", "count": 8},
                {"role": "Cybersecurity Analyst", "count": 5}
            ]
            return mock_roles[:limit]

        role_counter = Counter()
        for rec in recommendations:
            if rec.recommended_roles:
                try:
                    roles_list = json.loads(rec.recommended_roles)
                    for r_obj in roles_list:
                        role_name = r_obj.get("role")
                        if role_name:
                            role_counter[role_name.strip()] += 1
                except Exception:
                    pass

        top_roles = role_counter.most_common(limit)
        return [{"role": name, "count": count} for name, count in top_roles]

    @staticmethod
    def get_salary_trends(db: Session, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieves salary insights for the most popular recommended roles in the system.
        """
        top_roles_data = AnalyticsService.get_top_roles(db, limit)
        trends = []
        
        for role_entry in top_roles_data:
            role = role_entry["role"]
            insights = AdzunaService.get_salary_insights(role)
            trends.append({
                "role_name": role,
                "average_salary": insights.get("average_salary"),
                "salary_range": insights.get("salary_range"),
                "market_demand": insights.get("market_demand")
            })

        if not trends:
            # High-fidelity mock trends fallback
            trends = [
                {"role_name": "Data Scientist", "average_salary": 68000.0, "salary_range": "£54,000 - £85,000", "market_demand": "High"},
                {"role_name": "Full Stack Developer", "average_salary": 58000.0, "salary_range": "£46,000 - £72,500", "market_demand": "High"},
                {"role_name": "Cloud Infrastructure Engineer", "average_salary": 72000.0, "salary_range": "£57,600 - £90,000", "market_demand": "High"},
                {"role_name": "Backend Developer", "average_salary": 60000.0, "salary_range": "£48,000 - £75,000", "market_demand": "Medium"},
                {"role_name": "Cybersecurity Analyst", "average_salary": 65000.0, "salary_range": "£52,000 - £81,250", "market_demand": "Medium"}
            ]
        return trends[:limit]
