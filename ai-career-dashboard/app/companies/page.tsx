'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Users, Building, Star, ExternalLink, Briefcase } from 'lucide-react'
import Link from 'next/link'

export default function CompaniesPage() {
  const companies = [
    {
      id: 1,
      name: 'TechCorp Inc.',
      industry: 'Software Development',
      size: '500 - 1000 employees',
      location: 'San Francisco, CA',
      rating: 4.8,
      openings: 24,
      description: 'Leading technology company building innovative solutions for enterprise clients worldwide.',
      perks: ['Remote/Hybrid', 'Health Insurance', 'Equity', 'Learning Budget'],
      website: 'https://github.com'
    },
    {
      id: 2,
      name: 'CloudSystems',
      industry: 'Cloud Infrastructure',
      size: '1000 - 5000 employees',
      location: 'Seattle, WA',
      rating: 4.6,
      openings: 18,
      description: 'Cloud platform enabling businesses to scale with reliability and performance.',
      perks: ['Unlimited PTO', 'Stock Options', 'Wellness Program', 'Remote'],
      website: 'https://google.com'
    },
    {
      id: 3,
      name: 'DataFlow',
      industry: 'Data Analytics',
      size: '100 - 500 employees',
      location: 'New York, NY',
      rating: 4.9,
      openings: 12,
      description: 'Empowering companies with data-driven insights and analytics solutions.',
      perks: ['Flexible Hours', 'Professional Development', 'Team Outings', 'Hybrid'],
      website: 'https://microsoft.com'
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Top Companies</h1>
            <p className="text-slate-400">Explore companies actively hiring</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Card key={company.id} className="border-slate-700 bg-slate-900/40 backdrop-blur-md hover:bg-slate-900/60 transition-all duration-300 border-glow-cyan group">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg" />
                  <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-semibold text-yellow-400">{company.rating}</span>
                  </div>
                </div>
                <CardTitle className="text-white text-lg">{company.name}</CardTitle>
                <CardDescription className="text-slate-400">{company.industry}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users className="w-4 h-4" />
                    {company.size}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-4 h-4" />
                    {company.location}
                  </div>
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                    <Briefcase className="w-4 h-4" />
                    {company.openings} open positions
                  </div>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed">{company.description}</p>

                <div className="flex flex-wrap gap-1">
                  {company.perks.map((perk, i) => (
                    <span key={i} className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">
                      {perk}
                    </span>
                  ))}
                </div>

                <a href={company.website} target="_blank" rel="noopener noreferrer" className="block w-full mt-4">
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white glow-cyan">
                    View Profile
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
