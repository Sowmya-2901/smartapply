'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

/**
 * Job Feed Page (Main Dashboard)
 *
 * Shows:
 * - Stats bar (New Today, Applied, Saved, Avg Match)
 * - Filter bar (Match score, Freshness, Sort, Location, Remote)
 * - Job cards with match scores
 * - Infinite scroll loading
 */

interface Job {
  id: string
  title: string
  company: {
    name: string
    ats_platform: string
  }
  location: string | null
  remote_type: string | null
  salary_min: number | null
  salary_max: number | null
  employee_count: number | null
  discovered_at: string
  apply_url: string
}

export default function JobFeedPage() {
  const supabase = createClient()

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    newToday: 0,
    applied: 0,
    saved: 0,
    avgMatch: 0
  })

  // Filter states
  const [matchFilter, setMatchFilter] = useState('60') // 60+, 70+, 80+, 90+, all
  const [freshnessFilter, setFreshnessFilter] = useState('all') // all, 4h, today, 3days, week
  const [sortBy, setSortBy] = useState('best') // best, newest, salary

  useEffect(() => {
    loadJobs()
    loadStats()
  }, [matchFilter, freshnessFilter, sortBy])

  async function loadJobs() {
    setLoading(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Build query
      let query = supabase
        .from('jobs')
        .select(`
          id,
          title,
          location,
          remote_type,
          salary_min,
          salary_max,
          discovered_at,
          apply_url,
          company:companies(name, ats_platform, employee_count)
        `)
        .eq('is_active', true)

      // Apply freshness filter
      if (freshnessFilter !== 'all') {
        const now = new Date()
        let cutoffDate: Date | undefined

        switch (freshnessFilter) {
          case '4h':
            cutoffDate = new Date(now.getTime() - 4 * 60 * 60 * 1000)
            break
          case 'today':
            cutoffDate = new Date(now.setHours(0, 0, 0, 0))
            break
          case '3days':
            cutoffDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
            break
          case 'week':
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
        }

        if (cutoffDate) {
          query = query.gte('discovered_at', cutoffDate.toISOString())
        }
      }

      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('discovered_at', { ascending: false })
      } else if (sortBy === 'salary') {
        query = query.order('salary_max', { ascending: false, nullsFirst: false })
      } else {
        // Best match - sort by discovered_at first (default)
        query = query.order('discovered_at', { ascending: false })
      }

      const { data, error } = await query.limit(20)

      if (error) {
        console.error('Error loading jobs:', error)
        return
      }

      setJobs(data || [])
    } catch (err) {
      console.error('Error loading jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    try {
      // Get today's jobs count
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count: newToday } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .gte('discovered_at', today.toISOString())
        .eq('is_active', true)

      setStats({
        newToday: newToday || 0,
        applied: 0, // TODO: Query applications table
        saved: 0, // TODO: Query saved jobs
        avgMatch: 75 // TODO: Calculate from user_job_matches
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  function getMatchScoreColor(score: number): string {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 70) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  function getRemoteBadge(remoteType: string | null): string | null {
    if (remoteType === 'remote') return '🏠 Remote'
    if (remoteType === 'hybrid') return '🔄 Hybrid'
    return null
  }

  function formatSalary(min: number | null, max: number | null): string | null {
    if (!min && !max) return null
    if (min && max) return `$${(min/1000).toFixed(0)}K - $${(max/1000).toFixed(0)}K`
    if (min) return `From $${(min/1000).toFixed(0)}K`
    if (max) return `Up to $${(max/1000).toFixed(0)}K`
    return null
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">🟢</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.newToday}</p>
              <p className="text-sm text-slate-500">New Today</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📤</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.applied}</p>
              <p className="text-sm text-slate-500">Applied</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">❤️</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.saved}</p>
              <p className="text-sm text-slate-500">Saved</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.avgMatch}%</p>
              <p className="text-sm text-slate-500">Avg Match</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Match Score Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Match:</label>
            <select
              value={matchFilter}
              onChange={(e) => setMatchFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="60">60%+</option>
              <option value="70">70%+</option>
              <option value="80">80%+</option>
              <option value="90">90%+</option>
              <option value="all">All</option>
            </select>
          </div>

          {/* Freshness Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Freshness:</label>
            <select
              value={freshnessFilter}
              onChange={(e) => setFreshnessFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All</option>
              <option value="4h">Last 4 hours</option>
              <option value="today">Today</option>
              <option value="3days">Last 3 days</option>
              <option value="week">This week</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="best">Best Match</option>
              <option value="newest">Newest First</option>
              <option value="salary">Highest Salary</option>
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={loadJobs}
            disabled={loading}
            className="ml-auto px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Job Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No jobs found</h3>
          <p className="text-slate-500">Try adjusting your filters or check back later for new opportunities.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job: any) => {
            const mockMatchScore = Math.floor(Math.random() * 30) + 70 // Mock 70-99%
            const matchColor = getMatchScoreColor(mockMatchScore)
            const remoteBadge = getRemoteBadge(job.remote_type)
            const salary = formatSalary(job.salary_min, job.salary_max)

            return (
              <div
                key={job.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Match Score Badge */}
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${matchColor} w-fit`}>
                    ⭐ {mockMatchScore}% Match
                  </div>

                  {/* Job Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-3">
                      <span className="font-medium">{job.company?.name}</span>
                      <span className="text-slate-300">•</span>
                      {job.company?.ats_platform && (
                        <span className="text-green-600">✅ via {job.company.ats_platform}</span>
                      )}
                      {job.location && <span>📍 {job.location}</span>}
                      {remoteBadge && <span>{remoteBadge}</span>}
                      {job.company?.employee_count && <span>🏢 {job.company.employee_count.toLocaleString()} employees</span>}
                    </div>

                    {salary && (
                      <div className="text-sm text-slate-600 mb-2">
                        💰 {salary}
                      </div>
                    )}

                    {/* Skill tags (mock for now) */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">React</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">TypeScript</span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Node.js</span>
                    </div>

                    {/* Posted time */}
                    <div className="text-sm text-slate-500 mb-4">
                      Posted {formatDistanceToNow(new Date(job.discovered_at), { addSuffix: true })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/dashboard/jobs/${job.id}`}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                      >
                        View JD
                      </Link>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        Optimize Resume
                      </button>
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                      >
                        Apply ↗
                      </a>
                      <button className="p-2 text-slate-400 hover:text-pink-500 transition-colors">
                        ❤️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
