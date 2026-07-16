'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Bell, Lock, LogOut, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function SettingsPage() {
  const router = useRouter()
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    jobAlerts: true,
    weeklyDigest: true,
    applicationUpdates: false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const handleSignOut = () => {
    api.logout()
    router.push('/')
  }

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Clear all local data
      api.logout()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('saved_jobs')
      }
      router.push('/')
    }
  }

  const handleSaveSettings = () => {
    setIsSaving(true)
    setSaveMessage('')
    // Settings are local-only for now
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification_settings', JSON.stringify(notificationSettings))
    }
    setTimeout(() => {
      setIsSaving(false)
      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />

      <div className="max-w-3xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-slate-400">Manage your account preferences</p>
          </div>
        </div>

        {saveMessage && (
          <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-200 text-sm">
            {saveMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Notifications */}
          <Card className="border-slate-700 bg-slate-900/40 backdrop-blur-md border-glow-cyan">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                <div>
                  <CardTitle className="text-white">Notifications</CardTitle>
                  <CardDescription>Control how you receive updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                { key: 'jobAlerts', label: 'Job Alerts', description: 'Get notified about matching jobs' },
                { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Receive weekly career insights' },
                { key: 'applicationUpdates', label: 'Application Updates', description: 'Updates on your applications' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                  <div>
                    <p className="font-medium text-white">{item.label}</p>
                    <p className="text-sm text-slate-400">{item.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        [item.key]: e.target.checked
                      })
                    }
                    className="w-5 h-5 cursor-pointer accent-cyan-500"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-slate-700 bg-slate-900/40 backdrop-blur-md border-glow-cyan">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                <div>
                  <CardTitle className="text-white">Security</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full border-slate-700 text-slate-300 justify-start">
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </Button>
              <Button variant="outline" className="w-full border-slate-700 text-slate-300 justify-start">
                <Lock className="w-4 h-4 mr-2" />
                Two-Factor Authentication
              </Button>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="border-slate-700 bg-slate-900/40 backdrop-blur-md border-glow-cyan">
            <CardHeader>
              <CardTitle className="text-white">Account</CardTitle>
              <CardDescription>Manage your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full border-slate-700 text-slate-300 justify-start hover:text-cyan-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <Button
                onClick={handleDeleteAccount}
                variant="outline"
                className="w-full border-red-900 text-red-400 hover:bg-red-900/20 justify-start"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white h-12 glow-cyan text-lg font-semibold"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
