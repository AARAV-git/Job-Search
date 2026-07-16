import os
import unittest
import json
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set test environment secret key
os.environ["SECRET_KEY"] = "test-secret-key-1234567890-test-secret-key-1234567890"
os.environ["DATABASE_URL"] = "sqlite:///./database/test_career_system.db"

from app.main import app
from app.database import Base, get_db
from app.utils.hashing import Hash

# Setup test database
TEST_DB_URL = "sqlite:///./database/test_career_system.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

class TestBackendApp(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create database tables
        Base.metadata.create_all(bind=test_engine)
        cls.client = TestClient(app)
        
    @classmethod
    def tearDownClass(cls):
        # Drop database tables
        Base.metadata.drop_all(bind=test_engine)
        # Clean up database file
        db_file = "./database/test_career_system.db"
        if os.path.exists(db_file):
            try:
                os.remove(db_file)
            except Exception:
                pass

    def setUp(self):
        # Override get_db dependency
        def override_get_db():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()
        app.dependency_overrides[get_db] = override_get_db
        
        # Fresh registration details
        self.reg_payload = {
            "name": "Alex Mercer",
            "email": "alex.mercer@example.com",
            "password": "securepassword123"
        }
        self.login_payload = {
            "email": "alex.mercer@example.com",
            "password": "securepassword123"
        }

    def tearDown(self):
        # Clear database records after each test to keep isolated
        db = TestingSessionLocal()
        try:
            db.execute(Base.metadata.tables['recommendations'].delete())
            db.execute(Base.metadata.tables['user_profiles'].delete())
            db.execute(Base.metadata.tables['resumes'].delete())
            db.execute(Base.metadata.tables['users'].delete())
            db.commit()
        finally:
            db.close()
        app.dependency_overrides.clear()

    def test_01_authentication_flow(self):
        # 1. Register a new user
        response = self.client.post("/auth/register", json=self.reg_payload)
        self.assertEqual(response.status_code, 201)
        res_data = response.json()
        self.assertEqual(res_data["name"], "Alex Mercer")
        self.assertEqual(res_data["email"], "alex.mercer@example.com")
        self.assertIn("id", res_data)

        # 2. Registering the same email should fail
        response_fail = self.client.post("/auth/register", json=self.reg_payload)
        self.assertEqual(response_fail.status_code, 400)
        self.assertIn("Email is already registered", response_fail.json()["detail"])

        # 3. Login user
        login_res = self.client.post("/auth/login", json=self.login_payload)
        self.assertEqual(login_res.status_code, 200)
        token_data = login_res.json()
        self.assertEqual(token_data["token_type"], "bearer")
        self.assertIn("access_token", token_data)

        # 4. Fetch current user profile with token
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}
        me_res = self.client.get("/auth/me", headers=headers)
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["email"], "alex.mercer@example.com")

        # 5. Fetch current user without token should fail
        me_fail = self.client.get("/auth/me")
        self.assertEqual(me_fail.status_code, 403)

    def test_02_profile_management(self):
        # Register and login to get auth token
        self.client.post("/auth/register", json=self.reg_payload)
        login_res = self.client.post("/auth/login", json=self.login_payload)
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create Profile
        profile_payload = {
            "skills": ["Python", "FastAPI", "SQL", "Docker"],
            "interests": ["Backend Development", "AI Engineering"],
            "certifications": ["AWS Certified Cloud Practitioner"],
            "projects": [
                {
                    "name": "E-Commerce Backend",
                    "description": "Built scalable APIs for shopping carts.",
                    "technologies": ["Python", "FastAPI", "PostgreSQL"]
                }
            ],
            "experience": [
                {
                    "company": "Tech Labs",
                    "role": "Junior Backend Developer",
                    "duration": "1 year",
                    "description": "Developed server architectures and managed databases."
                }
            ]
        }
        
        response = self.client.post("/profile/create", json=profile_payload, headers=headers)
        self.assertEqual(response.status_code, 201)
        res_data = response.json()
        self.assertEqual(res_data["skills"], ["Python", "FastAPI", "SQL", "Docker"])
        self.assertEqual(res_data["interests"], ["Backend Development", "AI Engineering"])
        self.assertEqual(res_data["certifications"], ["AWS Certified Cloud Practitioner"])
        self.assertEqual(res_data["projects"][0]["name"], "E-Commerce Backend")
        profile_id = res_data["id"]

        # Fetch Profile by ID
        get_res = self.client.get(f"/profile/{profile_id}", headers=headers)
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["skills"], ["Python", "FastAPI", "SQL", "Docker"])

        # Update Profile
        update_payload = {
            "skills": ["Python", "FastAPI", "SQL", "Docker", "Kubernetes", "PyTorch"],
            "interests": ["AI Engineering", "MLOps"]
        }
        update_res = self.client.put("/profile/update", json=update_payload, headers=headers)
        self.assertEqual(update_res.status_code, 200)
        updated_data = update_res.json()
        self.assertIn("Kubernetes", updated_data["skills"])
        self.assertEqual(updated_data["interests"], ["AI Engineering", "MLOps"])

    def test_03_recommendation_and_jobs(self):
        # Register and login to get auth token
        self.client.post("/auth/register", json=self.reg_payload)
        login_res = self.client.post("/auth/login", json=self.login_payload)
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create Profile
        profile_payload = {
            "skills": ["Python", "PyTorch", "SQL", "Machine Learning"],
            "interests": ["AI Engineering", "Data Science"],
            "certifications": [],
            "projects": [],
            "experience": []
        }
        self.client.post("/profile/create", json=profile_payload, headers=headers)

        # Generate Career Recommendations
        rec_res = self.client.post("/recommend-career", headers=headers)
        self.assertEqual(rec_res.status_code, 200)
        rec_data = rec_res.json()
        self.assertIn("recommended_roles", rec_data)
        self.assertIn("skill_gaps", rec_data)
        self.assertIn("roadmap", rec_data)
        self.assertEqual(len(rec_data["recommended_roles"]), 3)
        
        # Verify specific recommendation elements
        first_role = rec_data["recommended_roles"][0]["role"]
        self.assertTrue(any(r["role"] == first_role for r in rec_data["recommended_roles"]))
        self.assertTrue(any(g["role"] == first_role for g in rec_data["skill_gaps"]))
        
        rec_id = rec_data["id"]

        # Fetch Recommendation details
        fetch_res = self.client.get(f"/recommendations/{rec_id}", headers=headers)
        self.assertEqual(fetch_res.status_code, 200)
        self.assertEqual(fetch_res.json()["explanation"], rec_data["explanation"])

        # Search live/mock job openings
        job_res = self.client.get("/jobs/search?role=Data Scientist&location=London", headers=headers)
        self.assertEqual(job_res.status_code, 200)
        jobs_list = job_res.json()
        self.assertGreater(len(jobs_list), 0)
        self.assertIn("role_name", jobs_list[0])
        self.assertIn("company", jobs_list[0])

        # Trending job salary insights
        trend_res = self.client.get("/jobs/trending?role=Data Scientist", headers=headers)
        self.assertEqual(trend_res.status_code, 200)
        trend_data = trend_res.json()
        self.assertEqual(trend_data["role_name"], "Data Scientist")
        self.assertGreater(trend_data["average_salary"], 0)

    def test_04_analytics_dashboard(self):
        # Register and login to get auth token
        self.client.post("/auth/register", json=self.reg_payload)
        login_res = self.client.post("/auth/login", json=self.login_payload)
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Query top-skills analytics (should hit fallback data as DB is small or query dynamic)
        skills_res = self.client.get("/analytics/top-skills", headers=headers)
        self.assertEqual(skills_res.status_code, 200)
        skills_data = skills_res.json()
        self.assertGreater(len(skills_data), 0)
        self.assertIn("skill", skills_data[0])
        self.assertIn("count", skills_data[0])

        # Query top-roles
        roles_res = self.client.get("/analytics/top-roles", headers=headers)
        self.assertEqual(roles_res.status_code, 200)
        roles_data = roles_res.json()
        self.assertGreater(len(roles_data), 0)
        self.assertIn("role", roles_data[0])

        # Query salary-trends
        sal_res = self.client.get("/analytics/salary-trends", headers=headers)
        self.assertEqual(sal_res.status_code, 200)
        sal_data = sal_res.json()
        self.assertGreater(len(sal_data), 0)
        self.assertIn("average_salary", sal_data[0])

    def test_05_resume_upload_parsing(self):
        # Register and login to get auth token
        self.client.post("/auth/register", json=self.reg_payload)
        login_res = self.client.post("/auth/login", json=self.login_payload)
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Standard file bytes for test upload
        mock_pdf_content = b"%PDF-1.4 Mock resume file with Python, FastAPI, Docker, and AWS skills."
        
        # Upload mock resume
        upload_res = self.client.post(
            "/resume/upload",
            files={"file": ("resume.txt", mock_pdf_content, "text/plain")},
            headers=headers
        )
        self.assertEqual(upload_res.status_code, 201)
        res_data = upload_res.json()
        self.assertIn("skills", res_data)
        # Verify scanner extracts 'Python', 'FastAPI', 'Docker', 'AWS'
        self.assertTrue(any(s in res_data["skills"] for s in ["Python", "FastAPI", "Docker", "AWS"]))

if __name__ == "__main__":
    unittest.main()
