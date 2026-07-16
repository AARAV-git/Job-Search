'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center px-6">
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />

      <div className="text-center relative z-10 max-w-md">
        <div className="text-9xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent mb-6">
          404
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Page Not Found</h1>
        <p className="text-slate-400 text-lg mb-8">
          Oops! We couldn&apos;t find the page you&apos;re looking for. It might have moved or doesn&apos;t exist.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/">
            <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white h-12 glow-cyan text-lg">
              Go to Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="w-full border-slate-700 text-slate-300 h-12">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
