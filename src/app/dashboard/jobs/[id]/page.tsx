'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

/**
 * Job Detail Page
 *
 * Shows:
 * - Full job description (left side)
 * - Match analysis panel (right side, sticky)
 * - Action buttons
 */

interface Job {
  id: string
  title: string
  description_html: string
  description_text: string
  location: string | null
  remote_type: string | null
  salary_min: number | null
  salary_max: number | null
  department: string | null
  employment_type: string | null
  apply_url: string
  posted_at: string | null
  discovered_at: string
  company: {
    name: string
    ats_platform: string
    careers_url: string | null
    website_url: string | null
    employee_count: number | null
    industry: string | null
  }
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (jobId) {
      loadJob()
    }
  }, [jobId])

  async function loadJob() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          company:companies(*)
        `)
        .eq('id', jobId)
        .single()

      if (error) {
        setError('Job not found')
        return
      }

      setJob(data)
    } catch (err) {
      console.error('Error loading job:', err)
      setError('Failed to load job')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="bg-white rounded-xl p-12 text-center">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Job not found</h2>
        <p className="text-slate-500 mb-6">{error || 'This job may have been removed.'}</p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Jobs
        </Link>
      </div>
    )
  }

  // Mock match score data (will come from user_job_matches table)
  const matchScore = 85
  const matchedSkills = ['React', 'TypeScript', 'Node.js']
  const missingSkills = ['Kubernetes', 'Terraform']

  function formatSalary(min: number | null, max: number | null): string | null {
    if (!min && !max) return null
    if (min && max) return `$${(min/1000).toFixed(0)}K - $${(max/1000).toFixed(0)}K`
    if (min) return `From $${(min/1000).toFixed(0)}K`
    if (max) return `Up to $${(max/1000).toFixed(0)}K`
    return null
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Jobs
      </Link>

      {/* Company info header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{job.title}</h1>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                ✅ Real Company
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-slate-600">
              <span className="font-semibold text-lg">{job.company?.name}</span>
              <span className="text-slate-300">•</span>
              <span className="text-green-600">via {job.company?.ats_platform}</span>
              {job.location && <span>📍 {job.location}</span>}
              {job.remote_type === 'remote' && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">Remote</span>}
              {job.remote_type === 'hybrid' && <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded">Hybrid</span>}
              {job.posted_at && <span>Posted {formatDistanceToNow(new Date(job.posted_at), { addSuffix: true })}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
              {job.company?.employee_count && <span>🏢 {job.company.employee_count.toLocaleString()} employees</span>}
              {job.company?.industry && <span>📊 {job.company.industry}</span>}
              {job.department && <span>📂 {job.department}</span>}
            </div>
          </div>
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Apply Now
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Full Job Description */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Job Description</h2>
            <div
              className="prose prose-slate max-w-none text-slate-600"
              dangerouslySetInnerHTML={{ __html: job.description_html || job.description_text }}
            />
          </div>
        </div>

        {/* Right: Match Analysis Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 lg:sticky lg:top-6">
            {/* Overall Match Score */}
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${
                matchScore >= 90 ? 'bg-green-100 text-green-800' :
                matchScore >= 70 ? 'bg-blue-100 text-blue-800' :
                matchScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {matchScore}%
              </div>
              <p className="text-sm text-slate-500 mt-2">Match Score</p>
            </div>

            {/* Skills Analysis */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Skills Analysis</h3>

              {matchedSkills.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-slate-500 mb-2">✅ Matched Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {matchedSkills.map(skill => (
                      <span key={skill} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {missingSkills.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">❌ Missing Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {missingSkills.map(skill => (
                      <span key={skill} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Experience Match */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Experience Match</h3>
              <p className="text-sm text-slate-600">
                JD requires 5+ years. You have 5 years. <span className="text-green-600 font-medium">✓ Match</span>
              </p>
            </div>

            {/* Detected Info */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Job Details</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Employment:</span>
                  <span className="font-medium text-slate-900">
                    {job.employment_type === 'full_time' ? 'Full-time' : job.employment_type || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Remote:</span>
                  <span className="font-medium text-slate-900">
                    {job.remote_type === 'remote' ? 'Yes' : job.remote_type === 'hybrid' ? 'Hybrid' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Visa sponsorship:</span>
                  <span className="font-medium text-slate-900">Not mentioned</span>
                </div>
              </div>
            </div>

            {/* Salary */}
            {formatSalary(job.salary_min, job.salary_max) && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Salary</h3>
                <p className="text-sm text-slate-600">{formatSalary(job.salary_min, job.salary_max)}</p>
              </div>
            )}

            {/* Company Info */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Company</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p className="font-medium text-slate-900">{job.company?.name}</p>
                {job.company?.employee_count && <p>{job.company.employee_count.toLocaleString()} employees</p>}
                {job.company?.industry && <p>{job.company.industry}</p>}
                {job.company?.website_url && (
                  <a
                    href={job.company.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Visit website →
                  </a>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href={`/dashboard/optimize/${job.id}`}
                className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
              >
                🔧 Optimize Resume for This Job
              </Link>
              <a
                href={job.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-center"
              >
                📤 Apply Now
              </a>
              <button className="w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                🔖 Save Job
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
