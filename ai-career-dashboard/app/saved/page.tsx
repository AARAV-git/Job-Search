'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trash2, Briefcase, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SavedJobsPage() {
  const router = useRouter()
  const [savedJobs, setSavedJobs] = useState<any[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saved_jobs')
      if (saved) {
        try {
          setSavedJobs(JSON.parse(saved))
        } catch {}
      }
    }
  }, [])

  const handleRemove = (id: number) => {
    const updated = savedJobs.filter(job => job.id !== id)
    setSavedJobs(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('saved_jobs', JSON.stringify(updated))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Saved Jobs</h1>
            <p className="text-slate-400">
              {savedJobs.length} position{savedJobs.length !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>

        {savedJobs.length === 0 ? (
          <Card className="border-slate-700 bg-slate-900/40 backdrop-blur-md p-12 text-center border-glow-cyan">
            <Briefcase className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No saved jobs yet</h3>
            <p className="text-slate-400 mb-6">Start exploring and save jobs that interest you</p>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white glow-cyan">
                Browse Jobs
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {savedJobs.map((job) => (
              <Card key={job.id} className="border-slate-700 bg-slate-900/40 backdrop-blur-md hover:bg-slate-900/60 transition-colors border-glow-cyan group">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity">
                          <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{job.title}</h3>
                          <p className="text-sm text-slate-400">{job.company}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1 text-slate-400">
                          <span>📍 {job.location}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <span>💰 {job.salary}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Saved {job.savedDate}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 h-9"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('viewed_job', JSON.stringify(job))
                              router.push(`/job/${job.id}`)
                            }
                          }}
                        >
                          View Details
                        </Button>
                        <a
                          href={job.job_url || 'https://www.adzuna.co.uk'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-xs glow-cyan h-9"
                          >
                            Apply on Adzuna <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-red-400 h-9 w-9 p-0"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleRemove(job.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
