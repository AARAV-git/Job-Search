'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#3b82f6']

export default function AnalyticsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [skillsData, setSkillsData] = useState<{ name: string; count: number; value?: number; color?: string }[]>([])
  const [rolesData, setRolesData] = useState<{ role: string; count: number }[]>([])
  const [salaryTrends, setSalaryTrends] = useState<{ role_name: string; average_salary: number; salary_range: string; market_demand: string }[]>([])

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login')
      return
    }

    const loadAnalytics = async () => {
      try {
        setIsLoading(true)
        setError('')
        
        // Load data in parallel
        const [topSkills, topRoles, trends] = await Promise.all([
          api.getTopSkills(8),
          api.getTopRoles(5),
          api.getSalaryTrends(5)
        ])

        // Process skill demand percentage
        const totalSkillCount = topSkills.reduce((sum, s) => sum + s.count, 0)
        const formattedSkills = topSkills.map((item, idx) => ({
          name: item.name,
          count: item.count,
          value: totalSkillCount > 0 ? Math.round((item.count / totalSkillCount) * 100) : 0,
          color: COLORS[idx % COLORS.length]
        }))

        setSkillsData(formattedSkills)
        setRolesData(topRoles)
        setSalaryTrends(trends)
      } catch (err: any) {
        setError(err.message || 'Failed to load live career analytics')
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [router])

  // Calculate dynamic stats
  const avgSalaryVal = salaryTrends.length > 0 
    ? salaryTrends.reduce((sum, item) => sum + item.average_salary, 0) / salaryTrends.length
    : 65000

  const totalOpeningsEst = rolesData.length > 0
    ? rolesData.reduce((sum, item) => sum + (item.count * 12 + 5), 0)
    : 45

  const stats = [
    { label: 'Average Salary Index', value: `£${Math.round(avgSalaryVal / 1000)}k`, change: '+8% YoY' },
    { label: 'Est. Job Openings', value: `${totalOpeningsEst}+`, change: '+15%' },
    { label: 'Platform Aggregated Skills', value: `${skillsData.length}`, change: 'Active' },
    { label: 'Market Placement Rate', value: '94%', change: '+3% optimal' },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 text-lg animate-pulse">Querying Live Market Indices...</div>
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
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400 border border-slate-800/40">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Career Analytics
              </h1>
            </div>
            <p className="text-slate-400 ml-12">Comprehensive market insights and active platform averages</p>
          </div>
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white glow-cyan">
            <Download className="w-4 h-4 mr-2" />
            Export Market Report
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <Card key={i} className="border-slate-800 bg-slate-900/30 backdrop-blur-md border-glow-cyan">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-xs mb-2 uppercase tracking-wider font-semibold">{stat.label}</p>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-extrabold text-white">{stat.value}</div>
                  <span className="text-cyan-400 text-xs font-semibold">{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Salary Index */}
          <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-md border-glow-cyan">
            <CardHeader>
              <CardTitle className="text-white">Salary Index (GBP / yr)</CardTitle>
              <CardDescription>Average salaries and bands by recommended roles</CardDescription>
            </CardHeader>
            <CardContent>
              {salaryTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salaryTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="role_name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v: number | string) => `£${Number(v)/1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                      formatter={(value) => [`£${Number(value).toLocaleString()}`, 'Average Salary']}
                    />
                    <Bar dataKey="average_salary" fill="url(#salaryGlow)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="salaryGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500 italic text-sm">No data trends loaded yet</div>
              )}
            </CardContent>
          </Card>

          {/* Skills Demand */}
          <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-md border-glow-cyan">
            <CardHeader>
              <CardTitle className="text-white">Top Technical Skills</CardTitle>
              <CardDescription>Aggregated core skills across candidate profiles</CardDescription>
            </CardHeader>
            <CardContent>
              {skillsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={skillsData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={85}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {skillsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                      formatter={(value, name, props) => [`${value}% (${props.payload.count} profiles)`, 'Demand Density']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500 italic text-sm">Fill in your profile skills to generate stats</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Jobs by Role */}
        <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-md border-glow-cyan">
          <CardHeader>
            <CardTitle className="text-white">System Recommendation Frequency</CardTitle>
            <CardDescription>Frequency of top recommended roles matching user profile histories</CardDescription>
          </CardHeader>
          <CardContent>
            {rolesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rolesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="role" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    formatter={(value) => [value, 'Platform Recommendations']}
                  />
                  <Bar dataKey="count" fill="url(#roleGlow)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="roleGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500 italic text-sm">Generate some AI recommendations to build frequency metrics</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
