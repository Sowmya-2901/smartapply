/**
 * Applications API
 *
 * POST /api/applications - Create a new application record
 * GET /api/applications - Get user's applications (optional, for future use)
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/applications
 *
 * Create a new application record when a user applies to a job.
 * Saves the job description snapshot and match score at application time.
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

    const body = await request.json()
    const { job_id, resume_id, match_score } = body

    // Validate required fields
    if (!job_id) {
      return NextResponse.json(
        { error: 'job_id is required' },
        { status: 400 }
      )
    }

    // Fetch job details for JD snapshot
    const { data: job } = await supabase
      .from('jobs')
      .select('title, description_text, company_id')
      .eq('id', job_id)
      .single()

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Get user's base resume if none provided
    let finalResumeId = resume_id
    if (!finalResumeId) {
      const { data: baseResume } = await supabase
        .from('resumes')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'raw_base')
        .eq('is_current', true)
        .maybeSingle()

      finalResumeId = baseResume?.id
    }

    // Create application record
    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        user_id: user.id,
        job_id,
        resume_id: finalResumeId,
        status: 'applied',
        match_score_at_application: match_score,
        applied_at: new Date().toISOString(),
        jd_snapshot: job.description_text || '',
        status_updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating application:', error)
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      application
    })

  } catch (error) {
    console.error('Applications API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/applications
 *
 * Get all applications for the current user.
 * This can be used by the application tracker page.
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

    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs (
          id,
          title,
          location,
          remote_type,
          companies (
            name,
            website_url
          )
        )
      `)
      .eq('user_id', user.id)
      .order('applied_at', { ascending: false })

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      applications
    })

  } catch (error) {
    console.error('Applications API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
