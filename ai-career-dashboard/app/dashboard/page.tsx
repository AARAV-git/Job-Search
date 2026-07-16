'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Sparkles, BarChart3, Briefcase, User, Settings, LogOut, Search, MapPin, DollarSign, ArrowRight, X, AlertCircle, BookOpen, Award, Layers, Bookmark } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { api, CareerRecommendation, RoleRecommendation, SkillGap, Roadmap, JobListing } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'recommendations' | 'jobs' | 'profile'>('recommendations')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [latestRecommendation, setLatestRecommendation] = useState<CareerRecommendation | null>(null)
  
  // Modal detail view state
  const [selectedRole, setSelectedRole] = useState<RoleRecommendation | null>(null)
  const [selectedGap, setSelectedGap] = useState<SkillGap | null>(null)
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Job Search State
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchLocation, setSearchLocation] = useState('London')
  const [searchCountry, setSearchCountry] = useState('gb')
  const [jobsList, setJobsList] = useState<JobListing[]>([])
  const [isSearchingJobs, setIsSearchingJobs] = useState(false)
  const [jobSearchMessage, setJobSearchMessage] = useState('Type a keyword and location above to search live positions.')
  const [savedJobUrls, setSavedJobUrls] = useState<string[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saved_jobs')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setSavedJobUrls(parsed.map((j: any) => j.job_url))
        } catch {}
      }
    }
  }, [])

  // Profile Matching States
  const [profileTitle, setProfileTitle] = useState('')
  const [profileLocation, setProfileLocation] = useState('')

  // Onboarding/Generate state
  const [isGenerating, setIsGenerating] = useState(false)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      // Fetch recommendations and profile in parallel using Promise.allSettled
      const [recsResult, profileResult] = await Promise.allSettled([
        api.getRecommendations(),
        api.getMyProfile()
      ])
      
      if (recsResult.status === 'fulfilled' && recsResult.value && recsResult.value.length > 0) {
        setLatestRecommendation(recsResult.value[0])
      } else {
        setLatestRecommendation(null)
      }

      if (profileResult.status === 'fulfilled' && profileResult.value) {
        const prof = profileResult.value
        let pTitle = ''
        let pLoc = ''
        const interests = prof.interests || []
        interests.forEach((item) => {
          if (item.startsWith('title:')) pTitle = item.substring(6)
          else if (item.startsWith('location:')) pLoc = item.substring(9)
        })
        
        setProfileTitle(pTitle)
        setProfileLocation(pLoc)
        
        // Auto-populate search fields initially
        if (pTitle) {
          setSearchKeyword(pTitle)
        }
        if (pLoc) {
          setSearchLocation(pLoc)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load recommendation and profile data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login')
      return
    }
    loadData()
  }, [router])

  const handleLogout = () => {
    api.logout()
    router.push('/')
  }

  const handleGenerateRecommendations = async () => {
    setIsGenerating(true)
    setError('')
    try {
      const rec = await api.generateRecommendations()
      setLatestRecommendation(rec)
    } catch (err: any) {
      setError(err.message || 'Could not generate recommendations. Make sure you have filled in your profile skills first!')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewDetails = (roleObj: RoleRecommendation) => {
    if (!latestRecommendation) return

    // Find the matching skill gap and roadmap by role name
    const gap = latestRecommendation.skill_gaps.find(g => g.role.toLowerCase() === roleObj.role.toLowerCase()) || null
    const roadmap = latestRecommendation.roadmap.find(r => r.role.toLowerCase() === roleObj.role.toLowerCase()) || null

    setSelectedRole(roleObj)
    setSelectedGap(gap)
    setSelectedRoadmap(roadmap)
    setShowDetailModal(true)
  }

  const handleSearchJobs = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchKeyword.trim()) return

    setIsSearchingJobs(true)
    setJobSearchMessage('')
    try {
      const jobs = await api.searchJobs(searchKeyword, searchLocation, searchCountry, 1)
      setJobsList(jobs)
      if (jobs.length === 0) {
        setJobSearchMessage('No job listings found matching your search. Try adjusting the keywords.')
      }
    } catch (err: any) {
      setJobSearchMessage(`Error searching jobs: ${err.message || err}`)
    } finally {
      setIsSearchingJobs(false)
    }
  }

  const handleToggleSaveJob = (job: JobListing) => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('saved_jobs')
    let currentSaved: any[] = []
    if (saved) {
      try {
        currentSaved = JSON.parse(saved)
      } catch {}
    }

    const isAlreadySaved = currentSaved.some(j => j.job_url === job.job_url)
    let newSaved = []
    if (isAlreadySaved) {
      newSaved = currentSaved.filter(j => j.job_url !== job.job_url)
    } else {
      newSaved = [
        ...currentSaved,
        {
          id: job.id || Date.now(),
          company: job.company,
          title: job.role_name,
          match: 92,
          salary: job.salary,
          location: job.location,
          job_url: job.job_url,
          savedDate: 'Just now',
          description: job.description || ''
        }
      ]
    }

    localStorage.setItem('saved_jobs', JSON.stringify(newSaved))
    setSavedJobUrls(newSaved.map(j => j.job_url))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 text-lg animate-pulse">Initializing Career Intelligence Dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />

      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-md sticky top-0 z-40 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg glow-cyan">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <Link href="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent cursor-pointer">
                Career Hub
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/saved">
              <Button variant="ghost" className="text-slate-400 hover:text-cyan-400 text-sm hidden sm:inline-flex">
                Saved Jobs
              </Button>
            </Link>
            <Link href="/companies">
              <Button variant="ghost" className="text-slate-400 hover:text-cyan-400 text-sm hidden sm:inline-flex">
                Companies
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="ghost" size="icon" className="text-slate-400 hover:text-red-400">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700/50">
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`pb-3 px-2 font-semibold transition-colors text-sm ${
              activeTab === 'recommendations'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            AI Recommendations
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`pb-3 px-2 font-semibold transition-colors text-sm ${
              activeTab === 'jobs'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Browse Jobs
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-2 font-semibold transition-colors text-sm ${
              activeTab === 'profile'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            My Profile
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Your Perfect Matches
                </h2>
                <p className="text-slate-400 text-sm">
                  Discover roles tailored to your skills and career goals, powered by LLM intelligence
                </p>
              </div>
              <Button
                onClick={handleGenerateRecommendations}
                disabled={isGenerating}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold glow-cyan transition-all"
              >
                {isGenerating ? 'Analyzing Profiles...' : 'Regenerate Matches'}
              </Button>
            </div>

            {latestRecommendation ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/30 border border-slate-700/50 rounded-lg text-slate-300 text-xs italic">
                  <span className="font-semibold text-cyan-400">Analysis Summary:</span> {latestRecommendation.explanation}
                </div>
                <div className="grid gap-4">
                  {latestRecommendation.recommended_roles.map((job, idx) => (
                    <Card
                      key={idx}
                      className="border-slate-700 bg-slate-900/40 backdrop-blur-md hover:bg-slate-900/60 transition-all duration-300 cursor-pointer border-glow-cyan group"
                      onClick={() => handleViewDetails(job)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4 flex-wrap md:flex-nowrap">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2.5 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg opacity-85 group-hover:opacity-100 transition-all glow-cyan">
                                <Briefcase className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-white text-lg group-hover:text-cyan-300 transition-colors">
                                  {job.role}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">Top AI recommendation match</p>
                              </div>
                            </div>
                            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                              {job.why_recommended}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-1.5">
                              {job.primary_skills_matched.map((skill, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded text-[10px] font-semibold"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
                            <div className="text-left md:text-right">
                              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                {job.match_score}%
                              </div>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Match Score</p>
                            </div>
                            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white glow-cyan text-xs">
                              View Custom Roadmap
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="border-slate-700 bg-slate-900/40 backdrop-blur-md p-12 text-center border-glow-cyan">
                <div className="max-w-md mx-auto space-y-4">
                  <Briefcase className="w-12 h-12 text-slate-500 mx-auto animate-pulse" />
                  <h3 className="text-xl font-semibold text-white">No Career Recommendations Found</h3>
                  <p className="text-slate-400 text-sm">
                    In order to generate your perfect career matches, please fill in your skills in your Profile first, or upload your resume PDF directly.
                  </p>
                  <div className="flex gap-4 justify-center pt-2">
                    <Link href="/resume">
                      <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold shadow-lg glow-cyan">
                        Upload Resume File
                      </Button>
                    </Link>
                    <Link href="/profile">
                      <Button variant="outline" className="border-slate-700 text-slate-300">
                        Edit Profile Manually
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Browse Live Positions
                </h2>
                <p className="text-slate-400 text-sm">
                  Explore thousands of current, real-time postings matching your preferred titles
                </p>
              </div>

              {profileTitle && (
                <Button 
                  onClick={() => {
                    setSearchKeyword(profileTitle)
                    if (profileLocation) setSearchLocation(profileLocation)
                    // Trigger live search using these credentials!
                    const runSearch = async () => {
                      setIsSearchingJobs(true)
                      setJobSearchMessage('')
                      try {
                        const jobs = await api.searchJobs(profileTitle, profileLocation || 'London', searchCountry, 1)
                        setJobsList(jobs)
                        if (jobs.length === 0) {
                          setJobSearchMessage('No job listings found matching your profile. Try searching manually.')
                        }
                      } catch (err: any) {
                        setJobSearchMessage(`Error: ${err.message}`)
                      } finally {
                        setIsSearchingJobs(false)
                      }
                    }
                    runSearch()
                  }}
                  className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs py-2 h-9 px-4 rounded-lg flex items-center gap-1.5 transition-all glow-cyan"
                >
                  🎯 Match to My Profile
                </Button>
              )}
            </div>

            {/* Live Search Form */}
            <form onSubmit={handleSearchJobs} className="flex gap-3 bg-slate-900/40 border border-slate-800 p-4 rounded-lg flex-wrap md:flex-nowrap">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <Input
                  placeholder="Job keyword (e.g. React Developer)"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="bg-slate-800/40 border-slate-700 text-white pl-9 h-11 text-sm focus:border-cyan-500"
                />
              </div>
              <div className="w-full sm:w-48 relative">
                <select
                  value={searchCountry}
                  onChange={(e) => setSearchCountry(e.target.value)}
                  className="w-full bg-slate-800/40 border border-slate-700 text-slate-300 rounded-md h-11 text-sm px-3 focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                >
                  <option value="gb" className="bg-slate-900 text-white">United Kingdom</option>
                  <option value="in" className="bg-slate-900 text-white">India</option>
                  <option value="us" className="bg-slate-900 text-white">United States</option>
                  <option value="ca" className="bg-slate-900 text-white">Canada</option>
                  <option value="au" className="bg-slate-900 text-white">Australia</option>
                  <option value="de" className="bg-slate-900 text-white">Germany</option>
                  <option value="fr" className="bg-slate-900 text-white">France</option>
                  <option value="sg" className="bg-slate-900 text-white">Singapore</option>
                </select>
              </div>
              <div className="w-full sm:w-48 relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <Input
                  placeholder="Location (e.g. Remote)"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="bg-slate-800/40 border-slate-700 text-white pl-9 h-11 text-sm focus:border-cyan-500"
                />
              </div>
              <Button
                type="submit"
                disabled={isSearchingJobs || !searchKeyword.trim()}
                className="w-full sm:w-auto h-11 bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-6 transition-all animate-glow-cyan"
              >
                {isSearchingJobs ? 'Searching...' : 'Search Jobs'}
              </Button>
            </form>

            {/* Search results */}
            {jobsList.length > 0 ? (
              <div className="grid gap-4">
                {jobsList.map((job, idx) => {
                  const isSaved = savedJobUrls.includes(job.job_url);
                  return (
                    <Card key={idx} className="border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50 transition-colors">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                          <div>
                            <h3 className="font-bold text-white text-base leading-snug">{job.role_name}</h3>
                            <p className="text-cyan-400 text-sm font-semibold mt-0.5">{job.company}</p>
                            <div className="flex gap-4 text-slate-400 text-xs mt-3 flex-wrap">
                              <span className="flex items-center gap-1">
                                📍 {job.location}
                              </span>
                              <span className="flex items-center gap-1">
                                💰 {job.salary}
                              </span>
                              <span className="text-slate-500 italic">Source: {job.source}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <Button
                              onClick={() => {
                                if (typeof window !== 'undefined') {
                                  const jobToStore = {
                                    id: job.id || Date.now(),
                                    company: job.company,
                                    title: job.role_name,
                                    match: 92,
                                    salary: job.salary,
                                    location: job.location,
                                    job_url: job.job_url,
                                    savedDate: 'Just now',
                                    description: job.description
                                  }
                                  localStorage.setItem('viewed_job', JSON.stringify(jobToStore))
                                  router.push(`/job/${jobToStore.id}`)
                                }
                              }}
                              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-4 h-9"
                            >
                              View Details
                            </Button>
                            <Button
                              onClick={() => handleToggleSaveJob(job)}
                              size="icon"
                              variant="ghost"
                              className={`h-9 w-9 rounded-md border border-slate-800 hover:border-slate-700 transition-colors ${isSaved ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
                            </Button>
                            <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                              <Button className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 px-4 h-9">
                                Apply Live <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                              </Button>
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-slate-800 bg-slate-900/40 p-12 text-center">
                {isSearchingJobs ? (
                  <div className="text-cyan-400 text-sm animate-pulse">Querying live job listing databases...</div>
                ) : (
                  <p className="text-slate-400 text-sm">{jobSearchMessage}</p>
                )}
              </Card>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">
                My Profile
              </h2>
              <p className="text-slate-400 text-sm">
                Manage your technical profile, upload resumes, and review market stats
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/profile" className="block h-full">
                <Card className="border-slate-700 bg-slate-900/40 backdrop-blur-md cursor-pointer hover:bg-slate-900/60 hover:border-cyan-500/50 transition-all border-glow-cyan group h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300" />
                      <h3 className="font-bold text-white text-lg">View Profile</h3>
                    </div>
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                      Edit your professional bio, personal info, location, and individual technical skills array.
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/resume" className="block h-full">
                <Card className="border-slate-700 bg-slate-900/40 backdrop-blur-md cursor-pointer hover:bg-slate-900/60 hover:border-cyan-500/50 transition-all border-glow-cyan group h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Briefcase className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300" />
                      <h3 className="font-bold text-white text-lg">Resume Parser</h3>
                    </div>
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                      Upload your PDF/DOCX CV. Our backend will parse and extract experience, certs, and skills instantly!
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/analytics" className="block h-full">
                <Card className="border-slate-700 bg-slate-900/40 backdrop-blur-md cursor-pointer hover:bg-slate-900/60 hover:border-cyan-500/50 transition-all border-glow-cyan group h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300" />
                      <h3 className="font-bold text-white text-lg">Career Analytics</h3>
                    </div>
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                      Explore trending skills, salary expectations, and job count estimations across other platform profiles.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Stunning Glassmorphic Custom Roadmap and Skill Gap Detail Modal */}
      {showDetailModal && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900/90 border border-slate-700/80 rounded-xl shadow-2xl p-6 md:p-8 overflow-y-auto border-glow-cyan text-left">
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Title */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs font-semibold">
                  Match Score: {selectedRole.match_score}%
                </span>
                <span className="text-xs text-slate-500">LLM Analysis Result</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                Roadmap: <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{selectedRole.role}</span>
              </h2>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{selectedRole.why_recommended}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Left Column: Skill Gaps and Recommendations */}
              <div className="md:col-span-1 space-y-4">
                {/* Skill Gaps Card */}
                <Card className="border-slate-800 bg-slate-950/40">
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      Skill Gap Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-4">
                    {selectedGap && selectedGap.missing_skills.length > 0 ? (
                      <div>
                        <p className="text-xs text-slate-400 mb-2 leading-relaxed">Missing competencies required for this role:</p>
                        <div className="space-y-2">
                          {selectedGap.missing_skills.map((skill, sIdx) => {
                            const imp = selectedGap.importance[skill] || 'Medium';
                            const badgeColor = imp.toLowerCase() === 'high' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                            return (
                              <div key={sIdx} className="flex justify-between items-center gap-2 bg-slate-800/20 px-2 py-1 rounded text-xs border border-slate-800">
                                <span className="font-semibold text-slate-300">{skill}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${badgeColor}`}>
                                  {imp} Priority
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-400 italic">Excellent! Profile skills cover the main requirements of this position perfectly!</p>
                    )}
                  </CardContent>
                </Card>

                {/* Certifications Card */}
                <Card className="border-slate-800 bg-slate-950/40">
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-cyan-400" />
                      Suggested Credentials
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    {selectedRoadmap && selectedRoadmap.recommended_certifications.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {selectedRoadmap.recommended_certifications.map((cert, cIdx) => (
                          <li key={cIdx} className="flex items-start gap-1.5 border-l-2 border-cyan-500/40 pl-2 py-0.5">
                            {cert}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No specific credentials recommended.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Step-by-Step Learning Plan & Projects */}
              <div className="md:col-span-2 space-y-4">
                {/* Roadmap Steps */}
                <Card className="border-slate-800 bg-slate-950/40">
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-violet-400" />
                      Step-by-Step Learning Roadmap
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-4">
                    {selectedRoadmap && selectedRoadmap.steps.length > 0 ? (
                      selectedRoadmap.steps.map((step, sIdx) => (
                        <div key={sIdx} className="flex gap-3 relative pb-2 group">
                          {/* Timeline vertical bar */}
                          {sIdx < selectedRoadmap.steps.length - 1 && (
                            <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-800" />
                          )}
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold font-mono flex-shrink-0 shadow glow-cyan">
                            {step.step || (sIdx + 1)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white leading-tight mt-0.5">{step.name}</h4>
                            <p className="text-[11px] text-slate-400 mt-1 leading-normal">{step.description}</p>
                            
                            {/* Topics */}
                            {step.topics && step.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {step.topics.map((t, tIdx) => (
                                  <span key={tIdx} className="px-1.5 py-0.5 bg-slate-800/80 border border-slate-700/60 rounded text-[9px] text-slate-400">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Resources */}
                            {step.resources && step.resources.length > 0 && (
                              <p className="text-[10px] text-slate-500 mt-1.5">
                                <span className="font-semibold text-slate-400">Resources: </span> 
                                {step.resources.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No specific steps detailed.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Suggested Projects */}
                <Card className="border-slate-800 bg-slate-950/40">
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      Suggested Portfolio Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-4">
                    {selectedRoadmap && selectedRoadmap.suggested_projects.length > 0 ? (
                      selectedRoadmap.suggested_projects.map((proj, pIdx) => (
                        <div key={pIdx} className="p-3 bg-slate-800/10 border border-slate-800/80 rounded-lg text-xs leading-normal">
                          <p className="font-bold text-slate-200">{proj.name}</p>
                          <p className="text-slate-400 mt-1 leading-relaxed text-[11px]">{proj.description}</p>
                          {proj.technologies && proj.technologies.length > 0 && (
                            <p className="text-[10px] text-cyan-400 mt-2 font-medium">
                              Technologies: {proj.technologies.join(', ')}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No projects suggested.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Close Button Footer */}
            <div className="mt-8 flex justify-end">
              <Button
                onClick={() => setShowDetailModal(false)}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 font-semibold"
              >
                Close Roadmap
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
