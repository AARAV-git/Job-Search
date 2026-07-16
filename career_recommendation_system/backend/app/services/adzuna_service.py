import re
import logging
import requests
from typing import Dict, Any, List
from app.config import settings

logger = logging.getLogger(__name__)

class AdzunaService:
    @staticmethod
    def search_jobs(role: str, location: str = "London", country: str = "gb", page: int = 1) -> List[Dict[str, Any]]:
        """
        Queries the Adzuna API for live job listings matching 'role' and 'location'.
        Includes a rich mock fallback system in case of network failures or invalid API credentials.
        """
        app_id = settings.ADZUNA_APP_ID
        app_key = settings.ADZUNA_API_KEY

        if not app_id or not app_key:
            logger.warning("Adzuna API credentials not configured. Using mock job data.")
            return AdzunaService.generate_mock_jobs(role, location)

        # Clean inputs
        role_clean = role.strip() if role else ""
        loc_clean = location.strip() if location else ""

        # Auto-detect country code from location name if possible
        loc_lower = loc_clean.lower()
        country_mappings = {
            "india": "in",
            "in": "in",
            "united states": "us",
            "usa": "us",
            "us": "us",
            "america": "us",
            "united kingdom": "gb",
            "uk": "gb",
            "gb": "gb",
            "great britain": "gb",
            "canada": "ca",
            "ca": "ca",
            "australia": "au",
            "au": "au",
            "germany": "de",
            "de": "de",
            "france": "fr",
            "fr": "fr",
            "singapore": "sg",
            "sg": "sg",
            "south africa": "za",
            "za": "za"
        }

        target_country = country.strip().lower() if country else "gb"
        if loc_lower in country_mappings:
            target_country = country_mappings[loc_lower]
            loc_clean = ""  # Clear location so we query the whole country instead of trying to find a region named 'India' in the UK

        url = f"http://api.adzuna.com/v1/api/jobs/{target_country}/search/{page}"
        params = {
            "app_id": app_id,
            "app_key": app_key,
            "what": role_clean,
            "results_per_page": 10
        }
        # Only add 'where' for real geographic locations — Adzuna doesn't recognize "Remote"
        if loc_clean and loc_clean.lower() not in ("remote", ""):
            params["where"] = loc_clean

        try:
            logger.info(f"Querying Adzuna API for job listings of role '{role}' in '{location}'...")
            response = requests.get(url, params=params, timeout=8)
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                formatted_jobs = []
                for job in results:
                    # Parse Adzuna elements nicely
                    company = job.get("company", {}).get("display_name", "N/A")
                    
                    loc_display = "Remote"
                    loc_obj = job.get("location", {})
                    if loc_obj.get("display_name"):
                        loc_display = loc_obj.get("display_name")
                    elif loc_obj.get("area"):
                        loc_display = ", ".join(loc_obj.get("area", []))
                    
                    sal_min = job.get("salary_min")
                    sal_max = job.get("salary_max")
                    if sal_min and sal_max:
                        salary_str = f"£{int(sal_min):,} - £{int(sal_max):,}"
                    elif sal_min:
                        salary_str = f"£{int(sal_min):,}+"
                    else:
                        salary_str = "Competitive"

                    # Parse Adzuna ID
                    raw_id = job.get("id")
                    job_id = None
                    if raw_id:
                        try:
                            job_id = int(raw_id)
                        except ValueError:
                            # If it's a non-numeric string, generate a simple hash
                            job_id = abs(hash(str(raw_id))) % 100000000
                    else:
                        job_id = abs(hash(job.get("redirect_url", ""))) % 100000000

                    # Parse description
                    desc = job.get("description", "No description provided.")
                    # Clean up HTML tags if any
                    desc_clean = re.sub(r'<[^>]*>', '', desc)

                    formatted_jobs.append({
                        "id": job_id,
                        "role_name": job.get("title", role),
                        "company": company,
                        "location": loc_display,
                        "salary": salary_str,
                        "job_url": job.get("redirect_url", "https://www.adzuna.co.uk"),
                        "source": "Adzuna API",
                        "description": desc_clean
                    })
                return formatted_jobs
            else:
                logger.warning(f"Adzuna API returned error status {response.status_code}. Using mock data.")
        except Exception as e:
            logger.warning(f"Failed to fetch from Adzuna API: {e}. Using mock data.")

        return AdzunaService.generate_mock_jobs(role, location)

    @staticmethod
    def get_salary_insights(role: str, country: str = "gb") -> Dict[str, Any]:
        """
        Compiles insights about salary ranges and demands for a given role.
        """
        # Call Adzuna API or estimate using average trends
        jobs = AdzunaService.search_jobs(role, location="", country=country, page=1)
        
        salaries = []
        for j in jobs:
            salary_text = j["salary"]
            # Extract numbers if present
            numbers = [int(s) for s in re.findall(r'\d[\d,]*', salary_text.replace(",", ""))]
            if len(numbers) == 2:
                salaries.append((numbers[0] + numbers[1]) / 2)
            elif len(numbers) == 1:
                salaries.append(numbers[0])

        avg_salary = sum(salaries) / len(salaries) if salaries else 65000.0
        if avg_salary < 1000:  # If it extracted something like £15/hour or monthly, adjust
            avg_salary = 55000.0

        return {
            "role_name": role,
            "average_salary": round(avg_salary, 2),
            "salary_range": f"£{int(avg_salary*0.8):,} - £{int(avg_salary*1.25):,}",
            "market_demand": "High" if "engineer" in role.lower() or "scientist" in role.lower() or "analyst" in role.lower() else "Medium",
            "active_postings_estimate": len(jobs) * 8 + 4
        }

    @staticmethod
    def generate_mock_jobs(role: str, location: str) -> List[Dict[str, Any]]:
        """
        Generates simulated realistic job listings based on the requested role.
        """
        role_clean = role.title()
        loc_clean = location.title() if location else "Remote"
        
        companies = ["TechCorp Global", "Quantum Solutions", "Starlight Systems", "Apex Analytics", "Innovate Labs", "CloudSphere Inc"]
        salaries = ["£45,000 - £60,000", "£55,000 - £75,000", "£70,000 - £95,000", "£90,000 - £120,000", "Competitive"]
        locations = [loc_clean] if location else ["London, UK", "Manchester, UK", "Remote, UK", "Bristol, UK"]
        
        mock_jobs = []
        for i in range(5):
            comp = companies[i % len(companies)]
            sal = salaries[i % len(salaries)]
            loc = locations[i % len(locations)]
            
            # Generate description
            desc = f"Exciting opportunity for a skilled {role_clean} to join {comp} in {loc}. " \
                   f"The ideal candidate will have strong experience matching core competencies and be ready to contribute to a collaborative, high-performing squad."

            mock_jobs.append({
                "id": 9000000 + i + abs(hash(role_clean)) % 1000000,
                "role_name": f"Senior {role_clean}" if i == 2 else f"Junior {role_clean}" if i == 4 else role_clean,
                "company": comp,
                "location": loc,
                "salary": sal,
                "job_url": f"https://www.adzuna.co.uk/details/mock-{i}",
                "source": "Adzuna Live (Simulated)",
                "description": desc
            })
        return mock_jobs
