'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { downloadResumeDocx } from '@/lib/resume/generateDocx'
import { getTrackedApplyUrl } from '@/lib/utils/applyTracking'

/**
 * Resume Optimizer Page
 *
 * Shows:
 * - Job title and company
 * - Loading state while GPT optimizes
 * - Side-by-side comparison (Master vs Tailored)
 * - Change highlighting (green = new, yellow = modified)
 * - Change summary
 * - Download buttons
 * - Apply button
 */

interface OptimizedResume {
  optimizedText: string
  changeSummary: {
    skills_added?: string[]
    bullets_added?: number
    bullets_modified?: number
    keyword_match?: string
    changes_summary?: string
  }
}

export default function ResumeOptimizerPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const jobId = params.jobId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [job, setJob] = useState<any>(null)
  const [optimized, setOptimized] = useState<OptimizedResume | null>(null)

  useEffect(() => {
    if (jobId) {
      loadJobAndOptimize()
    }
  }, [jobId])

  async function loadJobAndOptimize() {
    setLoading(true)
    try {
      // Load job details
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (jobError || !job) {
        throw new Error('Job not found')
      }

      setJob(job)

      // Get user's master resume
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: masterResume } = await supabase
        .from('resumes')
        .select('parsed_text')
        .eq('user_id', user.id)
        .eq('type', 'master_optimized')
        .eq('is_current', true)
        .single()

      if (!masterResume) {
        // No master resume, redirect to onboarding
        router.push('/onboarding')
        return
      }

      // Call optimization API
      const response = await fetch('/api/resume/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: masterResume.parsed_text,
          jobDescription: job.description_text,
          mode: 'tailored'
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to optimize resume')
      }

      setOptimized({
        optimizedText: result.optimizedText,
        changeSummary: result.change_summary
      })

    } catch (err: any) {
      console.error('Optimization error:', err)
      setError(err.message || 'Failed to optimize resume')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadDocx() {
    if (!optimized) return

    try {
      await downloadResumeDocx(
        optimized.optimizedText,
        `${job?.company?.name || 'company'}-${job?.title || 'position'}`
      )
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download resume')
    }
  }

  async function handleApply() {
    if (!job) return

    try {
      // First, save the tailored resume to database
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Save tailored resume
      const { data: tailoredResume, error: resumeError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          type: 'job_tailored',
          job_id: job.id,
          parsed_text: optimized.optimizedText,
          change_summary: optimized.changeSummary,
          is_current: true
        })
        .select()
        .single()

      if (resumeError) throw resumeError

      // Create application record
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          resume_id: tailoredResume.id,
          match_score: null // Could be calculated if needed
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create application record')
      }

      // Show success message
      alert('📄 Application logged! Your tailored resume has been downloaded.\n\nThe application page will now open in a new tab. Please upload your tailored resume when applying.')

      // Then open the tracked apply URL in a new tab
      const trackedUrl = getTrackedApplyUrl(job.apply_url, job.source_api)
      window.open(trackedUrl, '_blank')

    } catch (err) {
      console.error('Application error:', err)
      alert(`Failed to log application: ${err.message}\n\nThe application page will still open in a new tab.`)

      // Still open the apply URL even if logging failed
      const trackedUrl = getTrackedApplyUrl(job.apply_url, job.source_api)
      window.open(trackedUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Tailoring your resume...</h2>
          <p className="text-slate-500">This may take up to a minute. Our AI is carefully optimizing your resume for this position.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Optimization Failed</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Jobs
        </Link>
      </div>

      {/* Job Title Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Tailored Resume for {job?.title}
        </h1>
        <p className="text-slate-600">at {job?.company?.name}</p>
      </div>

      {/* Change Summary */}
      {optimized && optimized.changeSummary && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-green-800 mb-4">Changes Made</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {optimized.changeSummary.skills_added && optimized.changeSummary.skills_added.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">✅ Added Skills</p>
                <div className="flex flex-wrap gap-2">
                  {optimized.changeSummary.skills_added.map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {optimized.changeSummary.bullets_added !== undefined && (
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">📝 New Bullets</p>
                <p className="text-sm text-green-600">{optimized.changeSummary.bullets_added} added</p>
              </div>
            )}

            {optimized.changeSummary.bullets_modified !== undefined && (
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-1">✏️ Modified Bullets</p>
                <p className="text-sm text-yellow-600">{optimized.changeSummary.bullets_modified} improved</p>
              </div>
            )}

            {optimized.changeSummary.keyword_match && (
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">📊 ATS Keywords</p>
                <p className="text-sm text-green-600">{optimized.changeSummary.keyword_match}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison */}
      {optimized && (
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Left: Original (Master Resume) */}
          <div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-4 border-b border-slate-200">
                Your Master Resume
              </h3>
              <div className="text-sm text-slate-600 whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                {/* Show first 500 chars for preview */}
                {job?.description_text?.substring(0, 500)}
              </div>
            </div>
          </div>

          {/* Right: Tailored Resume */}
          <div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-4 border-b border-slate-200">
                Tailored for {job?.title}
                <span className="ml-2 text-sm font-normal text-slate-500">at {job?.company?.name}</span>
              </h3>
              <div className="text-sm whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                {optimized.optimizedText}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {optimized && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={handleDownloadDocx}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              📥 Download .docx
            </button>

            <button
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              📄 Download .pdf (Coming Soon)
            </button>

            <button
              onClick={handleApply}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              📤 Apply with This Resume
            </button>

            <Link
              href={`/dashboard/jobs/${jobId}`}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-center"
            >
              Back to Job
            </Link>
          </div>

          <p className="text-center text-sm text-slate-500 mt-4">
            💡 Tip: Review the tailored version before applying. You can manually edit any section in the final version.
          </p>
        </div>
      )}
    </div>
  )
}
