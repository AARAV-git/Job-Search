const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getHeaders(contentType: string | null = 'application/json') {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = 'An error occurred';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      try {
        errorDetail = await response.text();
      } catch {}
    }
    throw new Error(errorDetail);
  }
  return response.json() as Promise<T>;
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  skills: string[];
  interests: string[];
  certifications: string[];
  projects: any[];
  experience: any[];
  created_at: string;
}

export interface RoleRecommendation {
  role: string;
  match_score: number;
  why_recommended: string;
  primary_skills_matched: string[];
}

export interface SkillGap {
  role: string;
  missing_skills: string[];
  importance: Record<string, string>;
}

export interface RoadmapStep {
  step: number;
  name: string;
  description: string;
  topics: string[];
  resources: string[];
}

export interface Roadmap {
  role: string;
  steps: RoadmapStep[];
  recommended_certifications: string[];
  suggested_projects: any[];
}

export interface CareerRecommendation {
  id: number;
  user_id: number;
  recommended_roles: RoleRecommendation[];
  skill_gaps: SkillGap[];
  roadmap: Roadmap[];
  explanation: string;
  created_at: string;
}

export interface JobListing {
  id?: number;
  role_name: string;
  company: string;
  location: string;
  salary: string;
  job_url: string;
  source: string;
  description?: string;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse<{ access_token: string; token_type: string }>(res);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.access_token);
    }
    return data;
  },

  async register(name: string, email: string, password: string): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse<User>(res);
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<User>(res);
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },

  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('token');
    }
    return false;
  },

  // Profile
  async getMyProfile(): Promise<UserProfile> {
    const res = await fetch(`${BASE_URL}/profile/me`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<UserProfile>(res);
  },

  async createProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const payload = {
      skills: profile.skills || [],
      interests: profile.interests || [],
      certifications: profile.certifications || [],
      projects: profile.projects || [],
      experience: profile.experience || [],
    };
    const res = await fetch(`${BASE_URL}/profile/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<UserProfile>(res);
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const payload = {
      skills: profile.skills || null,
      interests: profile.interests || null,
      certifications: profile.certifications || null,
      projects: profile.projects || null,
      experience: profile.experience || null,
    };
    const res = await fetch(`${BASE_URL}/profile/update`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<UserProfile>(res);
  },

  // Resume Upload
  async uploadResume(file: File): Promise<{
    skills: string[];
    projects: any[];
    experience: any[];
    certifications: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BASE_URL}/resume/upload`, {
      method: 'POST',
      headers: getHeaders(null), // multipart/form-data boundary is set automatically by the browser
      body: formData,
    });
    return handleResponse<{
      skills: string[];
      projects: any[];
      experience: any[];
      certifications: string[];
    }>(res);
  },

  // Career Recommendations
  async generateRecommendations(
    skills?: string[],
    interests?: string[]
  ): Promise<CareerRecommendation> {
    const body = skills || interests ? JSON.stringify({ skills, interests }) : undefined;
    const res = await fetch(`${BASE_URL}/recommend-career`, {
      method: 'POST',
      headers: getHeaders(),
      body,
    });
    return handleResponse<CareerRecommendation>(res);
  },

  async getRecommendations(): Promise<CareerRecommendation[]> {
    const res = await fetch(`${BASE_URL}/recommendations`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<CareerRecommendation[]>(res);
  },

  // Jobs
  async searchJobs(
    role: string,
    location = 'London',
    country = 'gb',
    page = 1
  ): Promise<JobListing[]> {
    const query = new URLSearchParams({
      role,
      location,
      country,
      page: String(page),
    });
    const res = await fetch(`${BASE_URL}/jobs/search?${query}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<JobListing[]>(res);
  },

  // Analytics
  async getTopSkills(limit = 10): Promise<{ name: string; count: number }[]> {
    const res = await fetch(`${BASE_URL}/analytics/top-skills?limit=${limit}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await handleResponse<{ skill: string; count: number }[]>(res);
    return data.map(item => ({ name: item.skill, count: item.count }));
  },

  async getTopRoles(limit = 5): Promise<{ role: string; count: number }[]> {
    const res = await fetch(`${BASE_URL}/analytics/top-roles?limit=${limit}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<{ role: string; count: number }[]>(res);
  },

  async getSalaryTrends(limit = 5): Promise<{ role_name: string; average_salary: number; salary_range: string; market_demand: string }[]> {
    const res = await fetch(`${BASE_URL}/analytics/salary-trends?limit=${limit}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<{ role_name: string; average_salary: number; salary_range: string; market_demand: string }[]>(res);
  },
};
