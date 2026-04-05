import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Debug endpoint to check jobs query
 * GET /api/debug/jobs
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test 1: Count all active jobs
    const { count: totalCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    // Test 2: Try to fetch jobs (similar to dashboard query)
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, company:companies(name, ats_platform)')
      .eq('is_active', true)
      .limit(5)

    // Test 3: Check if there's an auth issue
    const { data: authTest } = await supabase
      .from('jobs')
      .select('id')
      .limit(1)

    return NextResponse.json({
      success: true,
      debug: {
        totalJobs: totalCount,
        jobsSample: jobs?.map(j => ({ id: j.id, title: j.title, company: j.company })) || [],
        jobsError: error?.message || null,
        authTest: authTest?.length || 0,
        env: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...'
        }
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
