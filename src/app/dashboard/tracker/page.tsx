import { format } from 'date-fns'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Application Tracker - SmartApply',
  description: 'Track all your job applications in one place',
}

interface Application {
  id: string
  status: string
  match_score_at_application: number | null
  applied_at: string | null
  notes: string | null
  follow_up_date: string | null
  jd_snapshot: string
  created_at: string

  job: {
    id: string
    title: string
    company_name: string | null
    location: string | null
  }[]

  resume: {
    id: string
    type: string
    created_at: string
  }[]
}

interface PipelineStats {
  saved: number
  applied: number
  phone_screen: number
  interview: number
  offer: number
  accepted: number
  rejected: number
  withdrawn: number
}

// Server Action to fetch applications
async function getApplications(): Promise<{ applications: Application[]; stats: PipelineStats }> {
  'use server'
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { applications: [], stats: { saved: 0, applied: 0, phone_screen: 0, interview: 0, offer: 0, accepted: 0, rejected: 0, withdrawn: 0 } }
  }

  // Fetch applications with job and resume data
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      match_score_at_application,
      applied_at,
      notes,
      follow_up_date,
      jd_snapshot,
      created_at,
      job:jobs(id, title, company_name, location),
      resume:resumes(id, type, created_at)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Calculate stats
  const stats: PipelineStats = {
    saved: 0,
    applied: 0,
    phone_screen: 0,
    interview: 0,
    offer: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
  }

  applications?.forEach(app => {
    stats[app.status as keyof PipelineStats]++
  })

  return {
    applications: applications || [],
    stats
  }
}

export default async function ApplicationTrackerPage() {
  const { applications, stats } = await getApplications()

  const totalApplications = stats.saved + stats.applied + stats.phone_screen + stats.interview + stats.offer + stats.accepted + stats.rejected + stats.withdrawn

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Application Tracker</h1>
        <p className="text-slate-500">Track all your job applications in one place</p>
      </div>

      {/* Pipeline Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <PipelineCard label="Saved" count={stats.saved} color="bg-gray-100 text-gray-700 border-gray-200" />
        <PipelineCard label="Applied" count={stats.applied} color="bg-blue-100 text-blue-700 border-blue-200" />
        <PipelineCard label="Phone" count={stats.phone_screen} color="bg-purple-100 text-purple-700 border-purple-200" />
        <PipelineCard label="Interview" count={stats.interview} color="bg-green-100 text-green-700 border-green-200" />
        <PipelineCard label="Offer" count={stats.offer} color="bg-yellow-100 text-yellow-700 border-yellow-200" />
        <PipelineCard label="Accepted" count={stats.accepted} color="bg-emerald-100 text-emerald-700 border-emerald-200" />
        <PipelineCard label="Rejected" count={stats.rejected} color="bg-red-100 text-red-700 border-red-200" />
        <PipelineCard label="Withdrawn" count={stats.withdrawn} color="bg-slate-100 text-slate-500 border-slate-200" />
      </div>

      {/* Applications Table */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No applications yet</h3>
          <p className="text-slate-500 mb-6">Start applying from the Jobs feed to track your applications here.</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Match</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Resume</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {applications.map((app) => {
                  const job = app.job[0]
                  const resume = app.resume[0]

                  const statusColors: Record<string, string> = {
                    saved: 'bg-gray-100 text-gray-700 border-gray-200',
                    applied: 'bg-blue-100 text-blue-700 border-blue-200',
                    phone_screen: 'bg-purple-100 text-purple-700 border-purple-200',
                    interview: 'bg-green-100 text-green-700 border-green-200',
                    offer: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                    accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    rejected: 'bg-red-100 text-red-700 border-red-200',
                    withdrawn: 'bg-slate-100 text-slate-500 border-slate-200',
                  }

                  const statusLabels: Record<string, string> = {
                    saved: 'Saved',
                    applied: 'Applied',
                    phone_screen: 'Phone Screen',
                    interview: 'Interview',
                    offer: 'Offer',
                    accepted: 'Accepted',
                    rejected: 'Rejected',
                    withdrawn: 'Withdrawn',
                  }

                  return (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {app.applied_at ? format(new Date(app.applied_at), 'MMM d, yyyy') : format(new Date(app.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {job?.company_name || 'SmartApply'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <Link href={`/dashboard/jobs/${job?.id}`} className="hover:text-blue-600 hover:underline">
                          {job?.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {app.match_score_at_application !== null ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                            app.match_score_at_application >= 90 ? 'bg-green-100 text-green-800 border-green-200' :
                            app.match_score_at_application >= 70 ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            app.match_score_at_application >= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {app.match_score_at_application}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[app.status]}`}>
                          {statusLabels[app.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <Link href={`/dashboard/resumes?version=${resume?.id}`} className="text-blue-600 hover:underline">
                          v{resume?.type === 'master_optimized' ? 'Master' : 'Tailored'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                        {app.notes || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <button
                          className="text-blue-600 hover:text-blue-800 mr-3"
                          title="View JD Snapshot"
                        >
                          View JD
                        </button>
                        <button
                          className="text-slate-600 hover:text-slate-800"
                          title="Set Follow-up"
                        >
                          🔔
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function PipelineCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`${color} rounded-lg p-3 text-center cursor-pointer hover:opacity-80 transition-opacity`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  )
}
