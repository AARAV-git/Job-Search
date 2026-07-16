'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Edit2, X, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, UserProfile } from '@/lib/api'

export default function ProfilePage() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [newSkill, setNewSkill] = useState('')

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    title: '',
    experience: '',
    location: '',
    bio: '',
    skills: [] as string[],
  })

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login')
      return
    }

    const loadData = async () => {
      try {
        setIsLoading(true)
        setError('')
        // Fetch user basic info
        const user = await api.getMe()
        
        let profile: UserProfile | null = null
        try {
          profile = await api.getMyProfile()
          setHasProfile(true)
        } catch (err: any) {
          // If 404, the user doesn't have a profile yet, which is fine!
          if (!err.message.includes('not found') && !err.message.includes('404')) {
            throw err
          }
          setHasProfile(false)
        }

        // Map data to form
        const newForm = {
          fullName: user.name,
          email: user.email,
          title: '',
          experience: '',
          location: '',
          bio: '',
          skills: [] as string[],
        }

        if (profile) {
          newForm.skills = profile.skills || []
          
          const interests = profile.interests || []
          interests.forEach((item) => {
            if (item.startsWith('title:')) newForm.title = item.substring(6)
            else if (item.startsWith('experience:')) newForm.experience = item.substring(11)
            else if (item.startsWith('location:')) newForm.location = item.substring(9)
            else if (item.startsWith('bio:')) newForm.bio = item.substring(4)
          })
        }

        setFormData(newForm)
      } catch (err: any) {
        setError(err.message || 'Failed to load profile details')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    try {
      const interests = []
      if (formData.title) interests.push(`title:${formData.title}`)
      if (formData.experience) interests.push(`experience:${formData.experience}`)
      if (formData.location) interests.push(`location:${formData.location}`)
      if (formData.bio) interests.push(`bio:${formData.bio}`)

      const payload = {
        skills: formData.skills,
        interests: interests,
      }

      if (hasProfile) {
        await api.updateProfile(payload)
      } else {
        await api.createProfile(payload)
        setHasProfile(true)
      }
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message || 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      })
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove),
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 text-lg animate-pulse">Loading Profile Details...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">My Profile</h1>
              <p className="text-slate-400">Manage your career information</p>
            </div>
          </div>
          <Button
            onClick={() => {
              if (isEditing) {
                handleSave()
              } else {
                setIsEditing(true)
              }
            }}
            disabled={isSaving}
            className={`${
              isEditing
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                : 'border border-slate-700 text-slate-300 hover:text-cyan-400 hover:bg-slate-900/40'
            } glow-cyan transition-all`}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Identity */}
        <Card className="border-slate-700 bg-slate-900/40 backdrop-blur-md mb-6 border-glow-cyan">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg glow-cyan">
                {formData.fullName ? formData.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{formData.fullName || 'User'}</h2>
                <p className="text-cyan-400 text-sm">{formData.title || 'Career Explorer'}</p>
                <p className="text-slate-500 text-xs mt-1">{formData.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="border-slate-700 bg-slate-900/40 backdrop-blur-md mb-6 border-glow-cyan">
          <CardHeader>
            <CardTitle className="text-white">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Full Name (Read-Only)</label>
                <p className="text-slate-400 bg-slate-800/20 px-3 py-2 rounded-md border border-slate-800">{formData.fullName}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email (Read-Only)</label>
                <p className="text-slate-400 bg-slate-800/20 px-3 py-2 rounded-md border border-slate-800">{formData.email}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Target Role Title</label>
                {isEditing ? (
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Senior React Developer"
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                ) : (
                  <p className="text-slate-400 px-1">{formData.title || 'Not specified'}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Years of Experience</label>
                {isEditing ? (
                  <Input
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    type="number"
                    placeholder="e.g. 5"
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                ) : (
                  <p className="text-slate-400 px-1">{formData.experience ? `${formData.experience} years` : 'Not specified'}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Location</label>
              {isEditing ? (
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. San Francisco, CA or Remote"
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              ) : (
                <p className="text-slate-400 px-1">{formData.location || 'Not specified'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card className="border-slate-700 bg-slate-900/40 backdrop-blur-md mb-6 border-glow-cyan">
          <CardHeader>
            <CardTitle className="text-white">Professional Bio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  placeholder="Describe your primary technical strengths, background, and career aspirations..."
                  className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-cyan-500 text-sm"
                />
              ) : (
                <p className="text-slate-400 text-sm leading-relaxed px-1 whitespace-pre-line">
                  {formData.bio || 'Please write a short bio to help us tailor our career recommendations.'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="border-slate-700 bg-slate-900/40 backdrop-blur-md border-glow-cyan mb-6">
          <CardHeader>
            <CardTitle className="text-white">Core Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {formData.skills.length > 0 ? (
                formData.skills.map((skill, i) => (
                  <div
                    key={i}
                    className="px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-full text-cyan-400 text-sm font-medium flex items-center gap-1.5"
                  >
                    <span>{skill}</span>
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-cyan-600 hover:text-cyan-300 transition-colors p-0.5 rounded-full"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm italic">No skills listed. Let's add some!</p>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-2 max-w-sm mt-2 pt-2 border-t border-slate-800">
                <Input
                  placeholder="e.g. TypeScript"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="h-9 bg-slate-800/50 border-slate-700 text-white text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddSkill()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddSkill} variant="outline" className="border-slate-700 text-slate-300 h-9">
                  Add Skill
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex gap-4 mt-8">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white glow-cyan flex-1 h-11 text-base font-semibold"
            >
              {isSaving ? 'Saving Changes...' : 'Save All Changes'}
            </Button>
            <Button
              onClick={() => {
                setIsEditing(false)
                setError('')
              }}
              variant="outline"
              className="border-slate-700 text-slate-300 flex-1 h-11 text-base font-semibold"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
