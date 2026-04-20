'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Manual Job Poll Server Action
 *
 * Triggers the job polling process manually by calling the poll endpoint.
 * This allows users to fetch new jobs on-demand instead of waiting for the cron job.
 *
 * @returns { success: boolean, message?: string, newJobs?: number, updatedJobs?: number, errors?: string[] }
 */
export async function manualJobPoll() {
  try {
    // Get the current user to verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to fetch jobs.'
      }
    }

    // Determine the base URL for the API call
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    process.env.VERCEL_URL &&
                    `https://${process.env.VERCEL_URL}` ||
                    'http://localhost:3000'

    // Call the poll endpoint directly using fetch
    const response = await fetch(`${baseUrl}/api/jobs/poll`, {
      method: 'GET',
      cache: 'no-store'
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.error || 'Failed to fetch jobs from the API'
      }
    }

    const result = await response.json()

    // Return the poll results with a user-friendly message
    return {
      success: true,
      message: `Successfully fetched jobs! ${result.newJobs || 0} new jobs, ${result.updatedJobs || 0} updated.`,
      newJobs: result.newJobs || 0,
      updatedJobs: result.updatedJobs || 0,
      removedJobs: result.removedJobs || 0,
      errors: result.errors || []
    }
  } catch (error) {
    console.error('Manual poll error:', error)
    return {
      success: false,
      error: 'Failed to fetch jobs. Please try again.'
    }
  }
}
