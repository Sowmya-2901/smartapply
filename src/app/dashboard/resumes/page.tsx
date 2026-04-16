import { format } from 'date-fns'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Resumes - SmartApply',
  description: 'Manage your resume versions',
}

interface Resume {
  id: string
  type: 'raw_base' | 'master_optimized' | 'job_tailored'
  file_url: string | null
  parsed_text: string | null
  change_summary: Record<string, unknown> | null
  is_current: boolean
  created_at: string

  job: {
    id: string
    title: string
    company_name: string | null
  }[] | null
}

// Server Action to fetch resumes
async function getResumes(): Promise<{
  rawBase: Resume | null
  masterOptimized: Resume | null
  tailored: Resume[]
}> {
  'use server'
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { rawBase: null, masterOptimized: null, tailored: [] }
  }

  // Fetch all resumes
  const { data: resumes } = await supabase
    .from('resumes')
    .select(`
      *,
      job:jobs(id, title, company_name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!resumes) {
    return { rawBase: null, masterOptimized: null, tailored: [] }
  }

  const rawBase = resumes.find(r => r.type === 'raw_base' && r.is_current) || null
  const masterOptimized = resumes.find(r => r.type === 'master_optimized' && r.is_current) || null
  const tailored = resumes.filter(r => r.type === 'job_tailored')

  return { rawBase, masterOptimized, tailored: tailored as Resume[] }
}

export default async function MyResumesPage({
  searchParams,
}: {
  searchParams?: { version?: string }
}) {
  const { rawBase, masterOptimized, tailored } = await getResumes()

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Resumes</h1>
        <p className="text-slate-500">Manage your resume versions</p>
      </div>

      <div className="space-y-6">
        {/* Section 1: Raw Base Resume */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Original Resume</h2>
          {rawBase ? (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">
                    Uploaded: {format(new Date(rawBase.created_at), 'MMMM d, yyyy')}
                  </p>
                  <p className="text-slate-700">Your original uploaded resume file</p>
                </div>
                <div className="flex gap-2">
                  {rawBase.file_url && (
                    <a
                      href={rawBase.file_url}
                      download
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                    >
                      Download
                    </a>
                  )}
                  <Link
                    href="/onboarding?step=1"
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                  >
                    Replace
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
              <div className="text-4xl mb-3">📄</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No resume uploaded yet</h3>
              <p className="text-slate-500 mb-4">Upload your resume to get started with SmartApply</p>
              <Link
                href="/onboarding?step=1"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Upload Resume
              </Link>
            </div>
          )}
        </section>

        {/* Section 2: Master Optimized Resume */}
        {rawBase && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Master Optimized Resume</h2>
            {masterOptimized ? (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">
                      Last optimized: {format(new Date(masterOptimized.created_at), 'MMMM d, yyyy')}
                    </p>
                    <p className="text-slate-700">Your resume optimized with your resume rules</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      Download .docx
                    </button>
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                      View
                    </button>
                    <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                      Re-optimize
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <p className="text-slate-500">Master optimized resume will be created after your first optimization.</p>
              </div>
            )}
          </section>
        )}

        {/* Section 3: Tailored Versions */}
        {rawBase && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Tailored Versions</h2>
            {tailored.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tailored.map((resume) => {
                  const job = resume.job?.[0]
                  return (
                    <div key={resume.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {job?.title || 'Unknown Position'}
                      </h3>
                      <p className="text-sm text-slate-500 mb-3">
                        {job?.company_name || 'Unknown Company'}
                      </p>
                      <p className="text-xs text-slate-400 mb-4">
                        Created: {format(new Date(resume.created_at), 'MMM d, yyyy')}
                      </p>
                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                          Download
                        </button>
                        <button className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                          View
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No tailored resumes yet</h3>
                <p className="text-slate-500">Optimize your resume for specific jobs to create tailored versions.</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
