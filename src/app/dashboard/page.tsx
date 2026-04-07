import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { calculateMatchScore } from '@/lib/filters/synonyms'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - SmartApply',
  description: 'Your AI co-pilot for landing tech jobs',
}

interface Job {
  id: string
  title: string
  location: string | null
  remote_type: string | null
  salary_min: number | null
  salary_max: number | null
  discovered_at: string
  apply_url: string
  required_skills: string[] | null
  parsed_experience_years: number | null
}

interface JobCardProps {
  job: Job
  matchScore: number | null
  userHasResume: boolean
}

interface Stats {
  newToday: number
  applied: number
  saved: number
  avgMatch: number
}

// Server Action to fetch jobs
async function getJobs(limit: number = 50): Promise<{
  jobs: Job[]
  stats: Stats
  userHasResume: boolean
  matchScores: Map<string, number>
}> {
  'use server'
  const supabase = createAdminClient()
  const userSupabase = await createClient()

  // Get current user
  const { data: { user } } = await userSupabase.auth.getUser()

  // Check if user has a resume and get their skills
  let userHasResume = false
  let userSkills: string[] = []
  let userExperience = 0
  let userJobTitles: string[] = []

  if (user) {
    const { data: resume } = await userSupabase
      .from('resumes')
      .select('parsed_skills')
      .eq('user_id', user.id)
      .eq('type', 'raw_base')
      .maybeSingle()

    if (resume?.parsed_skills) {
      userHasResume = true
      userSkills = resume.parsed_skills
    }

    // Get user's experience and job titles
    const { data: profile } = await userSupabase
      .from('profiles')
      .select('experience_years, job_titles')
      .eq('id', user.id)
      .single()

    userExperience = profile?.experience_years || 0
    userJobTitles = profile?.job_titles || []
  }

  // Fetch jobs with required skills
  const { data: jobs } = await supabase
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
      required_skills,
      parsed_experience_years
    `)
    .eq('is_active', true)
    .order('discovered_at', { ascending: false })
    .limit(limit)

  // Fetch stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: newTodayCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .gte('discovered_at', today.toISOString())
    .eq('is_active', true)

  // Calculate or fetch match scores for each job
  const matchScores = new Map<string, number>()

  if (user && userHasResume && jobs) {
    // Try to fetch cached match scores first
    const { data: cachedMatches } = await userSupabase
      .from('user_job_matches')
      .select('job_id, match_score')
      .eq('user_id', user.id)

    // Create a map of cached scores
    const cachedMap = new Map(
      cachedMatches?.map(m => [m.job_id, m.match_score]) || []
    )

    // Calculate scores for jobs without cached data
    for (const job of jobs) {
      if (cachedMap.has(job.id)) {
        matchScores.set(job.id, cachedMap.get(job.id)!)
      } else if (userSkills.length > 0 && job.required_skills && job.required_skills.length > 0) {
        // Calculate on-the-fly
        const result = calculateMatchScore(
          userSkills,
          job.required_skills || [],
          { experience_years: userExperience, job_titles: userJobTitles },
          {
            parsed_experience_years: job.parsed_experience_years || undefined,
            location: job.location || undefined,
            remote_type: job.remote_type || undefined,
            title: job.title
          }
        )
        matchScores.set(job.id, result.score)
      } else {
        // No skills data, set to null
        matchScores.set(job.id, 0) // Will be treated as "no score"
      }
    }
  }

  // Calculate average match
  let avgMatch = 0
  if (matchScores.size > 0) {
    const validScores = Array.from(matchScores.values()).filter(s => s > 0)
    avgMatch = validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 0
  }

  const stats = {
    newToday: newTodayCount || 0,
    applied: 0,
    saved: 0,
    avgMatch
  }

  return {
    jobs: (jobs || []) as Job[],
    stats,
    userHasResume,
    matchScores
  }
}

export default async function JobFeedPage({
  searchParams,
}: {
  searchParams?: {
    search?: string
  }
}) {
  const { jobs, stats, userHasResume, matchScores } = await getJobs()

  // Attach match scores to jobs
  const jobsWithScores: JobCardProps[] = jobs.map((job: Job) => ({
    job,
    matchScore: matchScores.get(job.id) ?? null,
    userHasResume
  }))

  return (
    <div className="max-w-7xl mx-auto">
      {/* Resume Prompt Banner - shown only if user doesn't have a resume */}
      {!userHasResume && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <p className="font-medium text-amber-900">Upload your resume to see your match scores</p>
              <p className="text-sm text-amber-700">We'll analyze your skills and show how well you match each job</p>
            </div>
          </div>
          <Link
            href="/onboarding"
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
          >
            Complete Onboarding
          </Link>
        </div>
      )}

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
              <p className="text-2xl font-bold text-slate-900">{userHasResume ? stats.avgMatch : '--'}%</p>
              <p className="text-sm text-slate-500">Avg Match</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Match:</label>
            <div className="flex gap-2">
              <Link href="?match=60" className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm">60%+</Link>
              <Link href="?match=70" className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm">70%+</Link>
              <Link href="?match=80" className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm">80%+</Link>
              <Link href="?match=90" className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm">90%+</Link>
              <Link href="?match=all" className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">All</Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Sort:</label>
            <div className="flex gap-2">
              <Link href="?sort=best" className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm">Best Match</Link>
              <Link href="?sort=newest" className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm">Newest</Link>
              <Link href="?sort=salary" className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm">Highest Salary</Link>
            </div>
          </div>

          <div className="ml-auto px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">
            {jobsWithScores.length} jobs found
          </div>
        </div>
      </div>

      {/* Job Cards */}
      {jobsWithScores.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No jobs found</h3>
          <p className="text-slate-500">Try adjusting your filters or check back later for new opportunities.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobsWithScores.map(({ job, matchScore, userHasResume }: JobCardProps) => {
            const displayScore = userHasResume ? matchScore : null
            const matchColor = displayScore && displayScore >= 90
              ? 'bg-green-100 text-green-800 border-green-200'
              : displayScore && displayScore >= 70
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : displayScore && displayScore >= 60
              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
              : displayScore && displayScore > 0
              ? 'bg-gray-100 text-gray-800 border-gray-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'

            const remoteBadge = job.remote_type === 'remote'
              ? '🏠️ Remote'
              : job.remote_type === 'hybrid'
              ? '🔄 Hybrid'
              : null

            const salary = job.salary_min && job.salary_max
              ? `$${(job.salary_min/1000).toFixed(0)}K - $${(job.salary_max/1000).toFixed(0)}K`
              : job.salary_min
              ? `From $${(job.salary_min/1000).toFixed(0)}K`
              : null

            const timeAgo = formatDistanceToNow(new Date(job.discovered_at), { addSuffix: true })

            // Use real skill tags from job requirements
            const skillTags = job.required_skills?.slice(0, 5) || []

            return (
              <div
                key={job.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Match Score Badge */}
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${matchColor} w-fit lg:w-auto mb-2`}>
                    {displayScore !== null ? (
                      <>⭐ {displayScore}% Match</>
                    ) : (
                      <>⭐ --% Match</>
                    )}
                  </div>

                  {/* Job Content */}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-3">
                      <span className="font-semibold">SmartApply</span>
                      {job.location && <span>📍 {job.location}</span>}
                      {remoteBadge && <span>{remoteBadge}</span>}
                    </div>

                    {salary && (
                      <div className="text-sm text-slate-600 mb-3">
                        💰 {salary}
                      </div>
                    )}

                    {/* Skill tags */}
                    {skillTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {skillTags.map(skill => (
                          <span key={skill} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                        {job.required_skills && job.required_skills.length > 5 && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                            +{job.required_skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-sm text-slate-500 mb-4">
                      Posted {timeAgo}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/dashboard/jobs/${job.id}`}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                      >
                        View JD
                      </Link>
                      <Link
                        href={`/dashboard/optimize/${job.id}`}
                        className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                          userHasResume
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                        aria-disabled={!userHasResume}
                      >
                        Optimize Resume
                      </Link>
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                      >
                        Apply ↗
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )})}
        </div>
      )}
    </div>
  )
}
