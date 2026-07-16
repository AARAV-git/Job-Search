'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Brain, Target, TrendingUp } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-700/30 backdrop-blur-md bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg glow-cyan">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Career Hub
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-cyan-400">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white glow-cyan">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center space-y-8 mb-20">
          <div className="space-y-6">
            <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Find Your
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                Perfect Career
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              AI-powered job matching that understands your skills, aspirations, and career goals. Discover opportunities perfectly tailored to you.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-lg px-8 glow-cyan">
                Explore Jobs <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:text-cyan-400 hover:bg-slate-900/40 text-lg px-8">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          {[
            {
              icon: Brain,
              title: 'AI-Powered Matching',
              description: 'Machine learning algorithms analyze your profile to find the best job fits'
            },
            {
              icon: Target,
              title: 'Tailored Opportunities',
              description: 'Get personalized recommendations based on your skills and preferences'
            },
            {
              icon: TrendingUp,
              title: 'Career Insights',
              description: 'Track salary trends, market demand, and growth opportunities in your field'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-lg border border-slate-700 bg-slate-900/40 backdrop-blur-md hover:bg-slate-900/60 hover:border-cyan-500/50 transition-all duration-300 border-glow-cyan"
            >
              <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg w-fit mb-4 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-all">
                <feature.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-6 mt-20 pt-12 border-t border-slate-700/30">
          {[
            { number: '50K+', label: 'Active Jobs' },
            { number: '95%', label: 'Match Accuracy' },
            { number: '10K+', label: 'Happy Users' },
            { number: '24/7', label: 'Support' }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <p className="text-slate-400 text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* CTA Section */}
      <section className="relative z-10 mt-20 max-w-4xl mx-auto px-6 py-16">
        <div className="rounded-lg border border-slate-700 bg-slate-900/40 backdrop-blur-md p-12 text-center border-glow-violet">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to transform your career?
          </h3>
          <p className="text-slate-400 mb-8 text-lg">
            Join thousands of professionals finding their ideal roles with AI-powered recommendations
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-lg px-8 glow-cyan">
              Start Your Journey Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
