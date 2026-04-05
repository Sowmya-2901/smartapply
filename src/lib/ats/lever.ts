import { RawJob } from './types'

/**
 * Lever Job Board API Integration
 *
 * API: GET https://api.lever.co/v0/postings/{company_slug}?mode=json
 * Docs: https://github.com/lever/postings-api
 */

const LEVER_API_BASE = 'https://api.lever.co/v0/postings'

/**
 * Fetch all jobs from a Lever board
 *
 * @param companySlug - The company's slug (e.g., "spotify" for jobs.lever.co/spotify)
 * @returns Array of standardized RawJob objects
 */
export async function fetchLeverJobs(companySlug: string): Promise<RawJob[]> {
  const url = `${LEVER_API_BASE}/${companySlug}?mode=json`

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      console.error(`Lever API error for ${companySlug}:`, response.status, response.statusText)
      return []
    }

    const data = await response.json()

    if (!Array.isArray(data)) {
      console.error(`Invalid Lever response for ${companySlug}`)
      return []
    }

    // Parse each job
    const jobs: RawJob[] = []

    for (const job of data) {
      try {
        const parsedJob = parseLeverJob(job, companySlug)
        if (parsedJob) {
          jobs.push(parsedJob)
        }
      } catch (err) {
        console.error(`Error parsing Lever job ${job.id}:`, err)
        // Continue with next job
      }
    }

    return jobs
  } catch (error) {
    console.error(`Failed to fetch Lever jobs for ${companySlug}:`, error)
    return []
  }
}

/**
 * Parse a single Lever job into the RawJob format
 */
function parseLeverJob(job: any, companySlug: string): RawJob | null {
  if (!job.id || !job.text) {
    return null
  }

  // Extract location from categories
  let location: string | null = null
  if (job.categories && job.categories.location) {
    location = Array.isArray(job.categories.location)
      ? job.categories.location.join(', ')
      : job.categories.location
  } else if (job.categories && job.categories['location']) {
    location = Array.isArray(job.categories['location'])
      ? job.categories['location'].join(', ')
      : job.categories['location']
  }

  // Determine employment type from commitment
  let employmentType: string | null = null
  if (job.categories && job.categories.commitment) {
    const commitment = Array.isArray(job.categories.commitment)
      ? job.categories.commitment[0]
      : job.categories.commitment
    const commitmentLower = commitment?.toLowerCase() || ''
    if (commitmentLower.includes('contract')) {
      employmentType = 'contract'
    } else if (commitmentLower.includes('part')) {
      employmentType = 'part_time'
    } else if (commitmentLower.includes('full')) {
      employmentType = 'full_time'
    }
  }

  // Get department from categories
  const department = job.categories?.department || null

  // Lever provides plain text, not HTML
  const descriptionText = job.text || job.description || ''
  const descriptionHtml = `<p>${descriptionText.replace(/\n\n/g, '</p><p>')}</p>`

  // Get seniority level from title
  let seniorityLevel: string | null = null
  const titleLower = job.text.toLowerCase()
  if (titleLower.includes('senior') || titleLower.includes('sr.')) {
    seniorityLevel = 'Senior'
  } else if (titleLower.includes('staff') || titleLower.includes('principal')) {
    seniorityLevel = 'Staff'
  } else if (titleLower.includes('lead')) {
    seniorityLevel = 'Lead'
  } else if (titleLower.includes('junior') || titleLower.includes('jr.')) {
    seniorityLevel = 'Junior'
  }

  // Get posted date
  const postedAt = job.createdAt || null

  // Lever doesn't typically provide salary info
  const salaryMin = null
  const salaryMax = null

  return {
    externalId: String(job.id),
    title: job.text,
    descriptionHtml,
    descriptionText,
    location,
    salaryMin,
    salaryMax,
    department,
    employmentType,
    applyUrl: job.hostedUrl || `https://jobs.lever.co/${companySlug}/${job.id}`,
    postedAt,
    seniorityLevel
  }
}
