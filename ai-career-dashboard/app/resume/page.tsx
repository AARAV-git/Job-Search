'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, Download, Eye, UploadCloud, CheckCircle, AlertCircle, X, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function ResumePage() {
  const router = useRouter()
  const [showPreview, setShowPreview] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [resume, setResume] = useState({
    summary: '',
    experience: [] as { company: string; title: string; period: string; details: string }[],
    education: [] as { school: string; degree: string; year: string }[],
    skills: [] as string[]
  })

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login')
      return
    }

    const loadProfileData = async () => {
      try {
        setIsLoading(true)
        setError('')
        const profile = await api.getMyProfile()
        
        let experienceArr: { company: string; title: string; period: string; details: string }[] = []
        if (profile.experience) {
          experienceArr = Array.isArray(profile.experience) 
            ? profile.experience.map(e => ({
                company: e.company || '',
                title: e.role || e.title || '',
                period: e.duration || e.period || '',
                details: e.description || e.details || ''
              }))
            : []
        }

        let summaryStr = ''
        const interests = profile.interests || []
        interests.forEach(item => {
          if (item.startsWith('bio:')) summaryStr = item.substring(4)
        })

        setResume({
          summary: summaryStr || 'Upload your resume below to parse your profile automatically!',
          experience: experienceArr.length > 0 ? experienceArr : [],
          education: (profile.certifications || []).map(cert => ({
            school: 'Certification',
            degree: cert,
            year: 'Verified'
          })),
          skills: profile.skills || []
        })
      } catch (err: any) {
        // If 404, the user just doesn't have a profile yet, which is fine!
        if (!err.message.includes('not found') && !err.message.includes('404')) {
          setError(err.message || 'Failed to load existing profile')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadProfileData()
  }, [router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
      setError('')
      setSuccess('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.')
      return
    }
    setIsUploading(true)
    setError('')
    setSuccess('')
    try {
      const result = await api.uploadResume(selectedFile)
      
      const parsedExp = (result.experience || []).map((exp: any) => ({
        company: exp.company || 'Company',
        title: exp.role || exp.title || 'Role',
        period: exp.duration || exp.period || 'N/A',
        details: exp.description || exp.details || ''
      }))

      setResume({
        summary: `Parsed Technical Resume Profile. Includes ${result.skills?.length || 0} skills and ${result.experience?.length || 0} work positions.`,
        experience: parsedExp,
        education: (result.certifications || []).map((c: string) => ({
          school: 'Certification',
          degree: c,
          year: 'Verified'
        })),
        skills: result.skills || []
      })

      setSuccess('Resume uploaded and parsed successfully! Profile updated in database.')
      setSelectedFile(null)
    } catch (err: any) {
      setError(err.message || 'Failed to parse resume. Supported extensions: PDF, DOCX, TXT.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      const interests: string[] = []
      if (resume.summary) interests.push(`bio:${resume.summary}`)

      // Convert experience format back to profile standard
      const expPayload = resume.experience.map(e => ({
        company: e.company,
        role: e.title,
        duration: e.period,
        description: e.details
      }))

      const certsPayload = resume.education.map(edu => edu.degree)

      await api.updateProfile({
        skills: resume.skills,
        experience: expPayload,
        certifications: certsPayload,
        interests: interests
      })

      setSuccess('All edits successfully saved to database!')
    } catch (err: any) {
      setError(err.message || 'Failed to save changes.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddExperience = () => {
    setResume({
      ...resume,
      experience: [
        ...resume.experience,
        { company: '', title: '', period: '', details: '' }
      ]
    })
  }

  const handleRemoveExperience = (index: number) => {
    setResume({
      ...resume,
      experience: resume.experience.filter((_, i) => i !== index)
    })
  }

  const handleExperienceChange = (index: number, key: string, val: string) => {
    const updated = [...resume.experience]
    updated[index] = { ...updated[index], [key]: val }
    setResume({ ...resume, experience: updated })
  }

  const handleAddEducation = () => {
    setResume({
      ...resume,
      education: [
        ...resume.education,
        { school: '', degree: '', year: '' }
      ]
    })
  }

  const handleRemoveEducation = (index: number) => {
    setResume({
      ...resume,
      education: resume.education.filter((_, i) => i !== index)
    })
  }

  const handleEducationChange = (index: number, key: string, val: string) => {
    const updated = [...resume.education]
    updated[index] = { ...updated[index], [key]: val }
    setResume({ ...resume, education: updated })
  }

  const handleDownloadPDF = () => {
    // Basic mock PDF generation
    const printContent = `
      RESUME PROFILE
      
      SUMMARY
      ${resume.summary}
      
      SKILLS
      ${resume.skills.join(', ')}
      
      EXPERIENCE
      ${resume.experience.map(e => `
        - ${e.title} at ${e.company} (${e.period})
          ${e.details}
      `).join('\n')}
      
      CERTIFICATIONS
      ${resume.education.map(edu => `- ${edu.degree} (${edu.school})`).join('\n')}
    `
    const blob = new Blob([printContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'resume-profile.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 text-lg animate-pulse">Loading Resume Builder...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Resume Parser & Builder</h1>
              <p className="text-slate-400">Upload your CV to auto-fill your profile, or build it manually</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:text-cyan-400"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <Button 
              onClick={handleDownloadPDF}
              className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export TXT CV
            </Button>
          </div>
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-center gap-2 animate-bounce-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-200 text-sm flex items-center gap-2 animate-bounce-in">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Live Resume File Parser Uploader Card */}
        <Card className="border-slate-700 bg-slate-900/40 backdrop-blur-md mb-8 border-glow-cyan">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-cyan-400 animate-bounce" />
              AI Resume Parser (Instant Profile Onboarding)
            </CardTitle>
            <CardDescription className="text-slate-400">
              Drag-and-drop or select your existing resume document (PDF, DOCX, TXT). Our backend LLM pipeline parses skills, projects, and work history directly into your structured dashboard!
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full relative border border-dashed border-slate-700 bg-slate-800/10 hover:bg-slate-800/20 hover:border-cyan-500/50 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
                <input
                  type="file"
                  id="resumeFile"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud className="w-10 h-10 text-slate-500 mb-2" />
                <p className="text-sm text-slate-300 font-semibold">
                  {selectedFile ? selectedFile.name : 'Select PDF, DOCX or TXT file'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Maximum size 5MB</p>
              </div>
              <Button
                onClick={handleUpload}
                disabled={isUploading || !selectedFile}
                className="w-full md:w-auto h-12 px-8 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold glow-cyan transition-all"
              >
                {isUploading ? 'Parsing Resume with LLM...' : 'Upload & Parse Resume'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Professional Summary */}
            <Card className="border-slate-700 bg-slate-900/40 backdrop-blur-md border-glow-cyan">
              <CardHeader>
                <CardTitle className="text-white">Profile Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={resume.summary}
                  onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </CardContent>
            </Card>

            {/* Experience */}
            <Card className="border-slate-700 bg-slate-900/40 backdrop-blur-md border-glow-cyan">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Work Experience</CardTitle>
                  <Button size="sm" variant="outline" onClick={handleAddExperience} className="border-slate-700 text-cyan-400 hover:bg-slate-800">
                    <Plus className="w-4 h-4 mr-1" /> Add Position
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {resume.experience.length > 0 ? (
                  resume.experience.map((exp, i) => (
                    <div key={i} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/80 space-y-3 relative group/card">
                      <button
                        onClick={() => handleRemoveExperience(i)}
                        className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-slate-400 font-semibold">Company Name</label>
                          <Input
                            value={exp.company}
                            onChange={(e) => handleExperienceChange(i, 'company', e.target.value)}
                            placeholder="e.g. Google"
                            className="bg-slate-800/50 border-slate-700 text-white h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-slate-400 font-semibold">Job Title</label>
                          <Input
                            value={exp.title}
                            onChange={(e) => handleExperienceChange(i, 'title', e.target.value)}
                            placeholder="e.g. Senior Software Engineer"
                            className="bg-slate-800/50 border-slate-700 text-white h-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-semibold">Duration/Period</label>
                        <Input
                          value={exp.period}
                          onChange={(e) => handleExperienceChange(i, 'period', e.target.value)}
                          placeholder="e.g. Jan 2022 - Present or 2 Years"
                          className="bg-slate-800/50 border-slate-700 text-white h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-semibold">Responsibilities & Achievements</label>
                        <textarea
                          value={exp.details}
                          onChange={(e) => handleExperienceChange(i, 'details', e.target.value)}
                          placeholder="List core technologies and impact. Key achievements..."
                          rows={3}
                          className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm italic text-center py-4">No experience entries found. Click Add Position to create one manually or parse a CV.</p>
                )}
              </CardContent>
            </Card>

            {/* Certifications and Education */}
            <Card className="border-slate-700 bg-slate-900/40 backdrop-blur-md border-glow-cyan">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Certifications & Education</CardTitle>
                  <Button size="sm" variant="outline" onClick={handleAddEducation} className="border-slate-700 text-cyan-400 hover:bg-slate-800">
                    <Plus className="w-4 h-4 mr-1" /> Add Entry
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {resume.education.length > 0 ? (
                  resume.education.map((edu, i) => (
                    <div key={i} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/80 space-y-3 relative">
                      <button
                        onClick={() => handleRemoveEducation(i)}
                        className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-slate-400 font-semibold">Institution / Provider</label>
                          <Input
                            value={edu.school}
                            onChange={(e) => handleEducationChange(i, 'school', e.target.value)}
                            placeholder="e.g. AWS or Coursera or University"
                            className="bg-slate-800/50 border-slate-700 text-white h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-slate-400 font-semibold">Degree / Certification Title</label>
                          <Input
                            value={edu.degree}
                            onChange={(e) => handleEducationChange(i, 'degree', e.target.value)}
                            placeholder="e.g. AWS Certified Solutions Architect"
                            className="bg-slate-800/50 border-slate-700 text-white h-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-semibold">Year / Status</label>
                        <Input
                          value={edu.year}
                          onChange={(e) => handleEducationChange(i, 'year', e.target.value)}
                          placeholder="e.g. 2023 or Active"
                          className="bg-slate-800/50 border-slate-700 text-white h-9"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm italic text-center py-4">No certifications or education listed.</p>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white glow-cyan h-12 text-base font-bold transition-all"
            >
              {isSaving ? 'Saving Profile to Database...' : 'Save & Persist All Changes'}
            </Button>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="lg:col-span-1">
              <Card className="border-slate-700 bg-slate-900/40 backdrop-blur-md border-glow-cyan sticky top-24">
                <CardHeader>
                  <CardTitle className="text-white">Active CV Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
                  <div>
                    <h3 className="font-bold text-cyan-400 text-sm mb-1 uppercase tracking-wider">Skills List</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {resume.skills.length > 0 ? (
                        resume.skills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 text-xs font-semibold">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-xs italic">No skills listed.</span>
                      )}
                    </div>
                  </div>
                  <hr className="border-slate-800" />
                  <div>
                    <h3 className="font-bold text-cyan-400 text-sm mb-1 uppercase tracking-wider">Professional Bio</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{resume.summary}</p>
                  </div>
                  <hr className="border-slate-800" />
                  <div>
                    <h3 className="font-bold text-cyan-400 text-sm mb-2 uppercase tracking-wider">Work Positions</h3>
                    <div className="space-y-3">
                      {resume.experience.length > 0 ? (
                        resume.experience.map((exp, i) => (
                          <div key={i} className="text-xs border-l border-cyan-500/30 pl-2">
                            <p className="font-bold text-white text-sm">{exp.title}</p>
                            <p className="text-cyan-400 font-semibold">{exp.company}</p>
                            <p className="text-slate-500 font-medium text-[10px] mt-0.5">{exp.period}</p>
                            {exp.details && <p className="text-slate-400 mt-1 leading-normal text-[11px]">{exp.details}</p>}
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 text-xs italic">No work history.</p>
                      )}
                    </div>
                  </div>
                  <hr className="border-slate-800" />
                  <div>
                    <h3 className="font-bold text-cyan-400 text-sm mb-2 uppercase tracking-wider">Qualifications</h3>
                    <div className="space-y-2">
                      {resume.education.length > 0 ? (
                        resume.education.map((edu, i) => (
                          <div key={i} className="text-xs">
                            <p className="font-semibold text-white">{edu.degree}</p>
                            <p className="text-slate-400">{edu.school} — <span className="text-slate-500">{edu.year}</span></p>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 text-xs italic">No credentials.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
