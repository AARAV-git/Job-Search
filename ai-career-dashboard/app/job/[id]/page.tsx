'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Share2, Bookmark, MapPin, DollarSign, Clock, Briefcase, Users, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [isSaved, setIsSaved] = useState(true)
  const [job, setJob] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && params?.id) {
      // 1. Check last viewed job first
      const viewedStr = localStorage.getItem('viewed_job')
      if (viewedStr) {
        try {
          const parsed = JSON.parse(viewedStr)
          if (String(parsed.id) === String(params.id)) {
            setJob(parsed)
            // Determine if it is currently in saved jobs list
            const saved = localStorage.getItem('saved_jobs')
            if (saved) {
              const savedParsed = JSON.parse(saved)
              setIsSaved(savedParsed.some((j: any) => String(j.id) === String(params.id) || j.job_url === parsed.job_url))
            } else {
              setIsSaved(false)
            }
            return
          }
        } catch {}
      }

      // 2. Check saved jobs list
      const saved = localStorage.getItem('saved_jobs')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const found = parsed.find((j: any) => String(j.id) === String(params.id))
          if (found) {
            setJob(found)
            setIsSaved(true)
            return
          }
        } catch {}
      }
      setIsSaved(false)
    }
  }, [params?.id])

  const handleToggleSave = () => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('saved_jobs')
    let currentSaved: any[] = []
    if (saved) {
      try {
        currentSaved = JSON.parse(saved)
      } catch {}
    }

    if (isSaved) {
      // Remove
      const updated = currentSaved.filter(j => String(j.id) !== String(params.id))
      localStorage.setItem('saved_jobs', JSON.stringify(updated))
      setIsSaved(false)
    } else {
      // Add back
      const targetJob = job || {
        id: Number(params.id) || Date.now(),
        company: 'TechCorp Inc.',
        title: 'Senior React Developer',
        match: 95,
        salary: 'Competitive',
        location: 'San Francisco, CA',
        job_url: 'https://www.adzuna.co.uk',
        savedDate: 'Just now'
      }
      const updated = [...currentSaved, targetJob]
      localStorage.setItem('saved_jobs', JSON.stringify(updated))
      setIsSaved(true)
    }
  }

  // Fallback mock details if no dynamic job loaded
  const jobDetails = {
    title: job?.title || job?.role_name || 'Senior React Developer',
    company: job?.company || 'TechCorp Inc.',
    salary: job?.salary || 'Competitive',
    location: job?.location || 'London, UK',
    type: 'Full-time',
    posted: '2 days ago',
    matchScore: job?.match || 95,
    url: job?.job_url || 'https://www.adzuna.co.uk',
    description: job?.description || 'We\'re looking for an experienced developer to join our growing team. You\'ll work on modern web applications that impact millions of users worldwide.',
    responsibilities: [
      'Build scalable, responsive web applications using React and TypeScript',
      'Collaborate with designers and backend engineers to implement features',
      'Mentor junior developers and participate in code reviews',
      'Optimize application performance and user experience',
      'Participate in architectural decisions and technical planning'
    ],
    requirements: [
      '3+ years of professional software development experience',
      'Strong technical skills matching your core profile competencies',
      'Experience with state management libraries and REST APIs',
      'Knowledge of modern engineering workflows and testing practices',
      'Excellent communication and collaboration skills'
    ],
    benefits: [
      'Competitive salary and equity package',
      'Comprehensive health insurance',
      'Unlimited PTO',
      'Professional development budget',
      'Flexible work arrangement (Remote/Hybrid)',
      'Team events and outings',
      'Wellness program'
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <Link href="/saved">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400 border border-slate-800/40">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button
              onClick={handleToggleSave}
              variant="outline"
              className={`border-slate-800 ${isSaved ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' : 'text-slate-300'}`}
            >
              <Bookmark className="w-4 h-4 mr-2" fill={isSaved ? 'currentColor' : 'none'} />
              {isSaved ? 'Bookmarked' : 'Bookmark'}
            </Button>
            <Button variant="outline" className="border-slate-800 text-slate-300">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Job Header */}
        <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-md mb-6 border-glow-cyan">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{jobDetails.title}</h1>
                <p className="text-xl text-cyan-400 font-semibold mb-4">{jobDetails.company}</p>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-4 h-4" />
                    {jobDetails.location}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <DollarSign className="w-4 h-4" />
                    {jobDetails.salary}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Briefcase className="w-4 h-4" />
                    {jobDetails.type}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    {jobDetails.posted}
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-center w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-1">
                  {jobDetails.matchScore}%
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Match Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-md border-glow-cyan">
              <CardHeader>
                <CardTitle className="text-white">About the Role</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 leading-relaxed mb-6">{jobDetails.description}</p>
              </CardContent>
            </Card>

            {/* Responsibilities */}
            <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-md border-glow-cyan">
              <CardHeader>
                <CardTitle className="text-white">Key Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {jobDetails.responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                      <span className="text-slate-400">{resp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-md border-glow-cyan">
              <CardHeader>
                <CardTitle className="text-white">Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {jobDetails.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                      <span className="text-slate-400">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-md border-glow-cyan">
              <CardHeader>
                <CardTitle className="text-white">About Company</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg mb-4" />
                <p className="text-slate-400 text-sm">Active company hiring candidates matching profile requirements for regional development squads.</p>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-md border-glow-cyan">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {jobDetails.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-400 text-lg leading-none mt-0.5">•</span>
                      <span className="text-slate-400 text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Apply Button */}
            <a href={jobDetails.url} target="_blank" rel="noopener noreferrer" className="block w-full">
              <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white h-12 glow-cyan text-lg font-semibold transition-all">
                Apply Now
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
