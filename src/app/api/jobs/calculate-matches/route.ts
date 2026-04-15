/**
 * Match Score Calculation & Caching API
 *
 * POST /api/jobs/calculate-matches
 *
 * Calculates and caches match scores for the current user against all active jobs.
 * This ensures match scores are:
 * 1. Based on the user's master optimized resume skills
 * 2. Properly normalized using SKILL_SYNONYMS dictionary
 * 3. Cached in user_job_matches table for fast retrieval
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { calculateMatchScore } from '@/lib/filters/synonyms'

/**
 * POST /api/jobs/calculate-matches
 *
 * Calculates match scores for all active jobs for the current user
 * and caches them in the user_job_matches table.
 *
 * This should be called:
 * - When new jobs are added (via job polling)
 * - When user updates their profile/resume
 * - Manually by user to refresh their scores
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's master optimized resume skills
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('parsed_skills')
      .eq('user_id', user.id)
      .eq('type', 'master_optimized')
      .eq('is_current', true)
      .maybeSingle()

    if (resumeError) {
      console.error('Error fetching resume:', resumeError)
    }

    const userSkills = resume?.parsed_skills || []

    // If user has no skills, return early
    if (userSkills.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No resume skills found - upload your resume to see match scores',
        count: 0
      })
    }

    // Get user's profile for experience and job titles
    const { data: profile } = await supabase
      .from('profiles')
      .select('experience_years, job_titles')
      .eq('id', user.id)
      .single()

    const userProfile = {
      experience_years: profile?.experience_years || 0,
      job_titles: profile?.job_titles || []
    }

    // Get all active jobs with required data for scoring
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title, required_skills, parsed_experience_years, location, remote_type, seniority_level, company_id')
      .eq('is_active', true)

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active jobs found',
        count: 0
      })
    }

    // Calculate scores for all jobs
    const calculatedScores = []
    let cachedCount = 0
    let newCount = 0

    for (const job of jobs) {
      const result = calculateMatchScore(
        userSkills,
        job.required_skills || [],
        userProfile,
        {
          parsed_experience_years: job.parsed_experience_years,
          location: job.location || '',
          remote_type: job.remote_type || '',
          title: job.title || ''
        }
      )

      calculatedScores.push({
        user_id: user.id,
        job_id: job.id,
        match_score: result.score,
        skill_matches: {
          matched: result.breakdown.skills ? Object.entries(result.breakdown.skills).filter(([k, v]) => v > 0).map(([k]) => k) : [],
          missing: result.breakdown.skills ? Object.entries(result.breakdown.skills).filter(([k, v]) => v === 0).map(([k]) => k) : [],
          adjacent: []
        },
        breakdown: result.breakdown,
        gate_failed: result.gate_failed,
        calculated_at: new Date().toISOString()
      })

      // Track statistics
      // (Could expand to return these in response)
    }

    // Batch upsert to user_job_matches table
    // Use upsert to handle both new records and updates
    let updated = 0
    let created = 0

    for (const scoreData of calculatedScores) {
      const { data: existing, error: upsertError } = await supabase
        .from('user_job_matches')
        .upsert({
          user_id: user.id,
          job_id: scoreData.job_id,
          match_score: scoreData.match_score,
          skill_matches: scoreData.skill_matches,
          breakdown: scoreData.breakdown,
          gate_failed: scoreData.gate_failed,
          calculated_at: scoreData.calculated_at
        }, {
          onConflict: 'user_id,job_id'
        })

      if (upsertError) {
        console.error(`Failed to cache score for job ${scoreData.job_id}:`, upsertError)
      } else if (existing) {
        updated++
      } else {
        created++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Match scores calculated: ${created} new, ${updated} updated`,
      count: calculatedScores.length,
      stats: { created, updated }
    })

  } catch (error) {
    console.error('Match calculation error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/jobs/calculate-matches
 *
 * Returns the count of cached match scores for the current user.
 * Useful for showing a "Scores up to date" message.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Count cached scores for this user
    const { count } = await supabase
      .from('user_job_matches')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      count
    })

  } catch (error) {
    console.error('Cache count error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
