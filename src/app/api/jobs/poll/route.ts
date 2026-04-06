import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { fetchGreenhouseJobs } from '@/lib/ats/greenhouse'
import { fetchLeverJobs } from '@/lib/ats/lever'
import { fetchAshbyJobs } from '@/lib/ats/ashby'
import { tagJobDescription } from '@/lib/filters/synonyms'
import { detectStaffingAgency } from '@/lib/filters/staffingDetector'

/**
 * Job Polling API Route
 *
 * This route is called by Vercel Cron every 2 hours to fetch jobs from all companies.
 * It:
 * 1. Fetches all companies from the database
 * 2. Calls the appropriate ATS API for each company
 * 3. Parses and filters each job
 * 4. Stores/updates jobs in the database
 * 5. Marks jobs as inactive if they're no longer in the API response
 *
 * GET /api/jobs/poll
 * Can be triggered manually via browser or cron job
 */
export async function GET(request: Request) {
  const supabase = createAdminClient()

  const startTime = Date.now()
  let newJobs = 0
  let updatedJobs = 0
  let removedJobs = 0
  const errors: string[] = []

  try {
    // Step 1: Fetch all companies from database
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .eq('verified', true)

    if (companiesError || !companies) {
      console.error('Companies fetch error:', companiesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch companies', details: companiesError },
        { status: 500 }
      )
    }

    // Group companies by ATS platform
    const greenhouseCompanies = companies.filter(c => c.ats_platform === 'greenhouse')
    const leverCompanies = companies.filter(c => c.ats_platform === 'lever')
    const ashbyCompanies = companies.filter(c => c.ats_platform === 'ashby')

    // Step 2: Process each company
    const allExternalIds = new Set<string>()

    // Process Greenhouse companies
    for (const company of greenhouseCompanies) {
      try {
        await new Promise(resolve => setTimeout(resolve, 200)) // Rate limiting delay

        const jobs = await fetchGreenhouseJobs(company.slug)
        const result = await processJobs(company, jobs, supabase, allExternalIds)
        newJobs += result.newJobs
        updatedJobs += result.updatedJobs
      } catch (err) {
        const msg = `Greenhouse ${company.name}: ${err}`
        errors.push(msg)
        console.error(msg)
      }
    }

    // Process Lever companies
    for (const company of leverCompanies) {
      try {
        await new Promise(resolve => setTimeout(resolve, 200)) // Rate limiting delay

        const jobs = await fetchLeverJobs(company.slug)
        const result = await processJobs(company, jobs, supabase, allExternalIds)
        newJobs += result.newJobs
        updatedJobs += result.updatedJobs
      } catch (err) {
        const msg = `Lever ${company.name}: ${err}`
        errors.push(msg)
        console.error(msg)
      }
    }

    // Process Ashby companies
    for (const company of ashbyCompanies) {
      try {
        await new Promise(resolve => setTimeout(resolve, 200)) // Rate limiting delay

        const jobs = await fetchAshbyJobs(company.slug)
        const result = await processJobs(company, jobs, supabase, allExternalIds)
        newJobs += result.newJobs
        updatedJobs += result.updatedJobs
      } catch (err) {
        const msg = `Ashby ${company.name}: ${err}`
        errors.push(msg)
        console.error(msg)
      }
    }

    // Step 3: Mark jobs no longer in API responses as inactive
    if (allExternalIds.size > 0) {
      const { data: staleJobs } = await supabase
        .from('jobs')
        .select('id, company_id, external_id')
        .eq('is_active', true)

      if (staleJobs) {
        const staleIdsToRemove: string[] = []

        for (const staleJob of staleJobs) {
          // Check if this job still exists in our fetched jobs
          const exists = allExternalIds.has(`${staleJob.company_id}:${staleJob.external_id}`)
          if (!exists) {
            staleIdsToRemove.push(staleJob.id)
          }
        }

        // Batch update inactive jobs
        if (staleIdsToRemove.length > 0) {
          const { data } = await supabase
            .from('jobs')
            .update({ is_active: false })
            .in('id', staleIdsToRemove.slice(0, 100)) // Supabase has limit on IN clause

          removedJobs = staleIdsToRemove.length
        }
      }
    }

    // Update company last_polled_at
    const companyIds = companies.map(c => c.id)
    await supabase
      .from('companies')
      .update({ last_polled_at: new Date().toISOString() })
      .in('id', companyIds)

    const duration = Math.round((Date.now() - startTime) / 1000)

    return NextResponse.json({
      success: true,
      summary: {
        newJobs,
        updatedJobs,
        removedJobs,
        errors,
        duration: `${duration}s`,
        companiesProcessed: companies.length
      }
    })

  } catch (error) {
    console.error('Job polling error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Process jobs for a single company
 */
async function processJobs(
  company: any,
  jobs: any[],
  supabase: any,
  allExternalIds: Set<string>
): Promise<{ newJobs: number; updatedJobs: number }> {
  let newJobs = 0
  let updatedJobs = 0

  for (const job of jobs) {
    try {
      const externalId = `${company.id}:${job.externalId}`
      allExternalIds.add(externalId)

      // Check if job already exists
      const { data: existingJob } = await supabase
        .from('jobs')
        .select('id, is_active')
        .eq('company_id', company.id)
        .eq('external_id', job.externalId)
        .single()

      // Run filters on job description
      const { filterTags, parsedExperienceYears, extractedSkills } = tagJobDescription(job.descriptionText)

      // Run staffing detection
      const staffingDetection = detectStaffingAgency(company.name, job.descriptionText)

      // Prepare job data
      const jobData = {
        company_id: company.id,
        external_id: job.externalId,
        title: job.title,
        description_html: job.descriptionHtml,
        description_text: job.descriptionText,
        location: job.location,
        remote_type: job.descriptionText.toLowerCase().includes('remote') ? 'remote' : null,
        salary_min: job.salaryMin,
        salary_max: job.salaryMax,
        department: job.department,
        employment_type: job.employmentType || 'full_time',
        required_skills: extractedSkills,
        parsed_experience_years: parsedExperienceYears,
        seniority_level: job.seniorityLevel,
        apply_url: job.applyUrl,
        source_api: company.ats_platform,
        filter_tags: filterTags,
        is_active: true,
        posted_at: job.postedAt ? new Date(job.postedAt).toISOString() : null
      }

      if (existingJob) {
        // Update existing job
        await supabase
          .from('jobs')
          .update({
            ...jobData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingJob.id)

        // Reactivate if it was inactive
        if (!existingJob.is_active) {
          await supabase
            .from('jobs')
            .update({ is_active: true })
            .eq('id', existingJob.id)
        }

        updatedJobs++
      } else {
        // Insert new job
        await supabase
          .from('jobs')
          .insert(jobData)

        newJobs++
      }

      // Update company staffing detection if not already set
      if (!company.is_staffing_agency && staffingDetection.isStaffing) {
        await supabase
          .from('companies')
          .update({
            is_staffing_agency: true,
            staffing_detection_score: staffingDetection.score
          })
          .eq('id', company.id)
      }

    } catch (err) {
      console.error(`Error processing job ${job.externalId}:`, err)
      // Continue with next job
    }
  }

  return { newJobs, updatedJobs }
}
