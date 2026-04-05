import { RawJob } from './types'

/**
 * Ashby Job Board API Integration
 *
 * API: GET https://api.ashbyhq.com/posting-api/job-board/{clientname}?includeCompensation=true
 * Docs: https://developers.ashbyhq.com/docs/public-job-posting-api
 */

const ASHBY_API_BASE = 'https://api.ashbyhq.com/posting-api/job-board'

/**
 * Fetch all jobs from an Ashby board
 *
 * @param clientName - The company's client name (e.g., "reddit" for api.ashbyhq.com/posting-api/job-board/reddit)
 * @returns Array of standardized RawJob objects
 */
export async function fetchAshbyJobs(clientName: string): Promise<RawJob[]> {
  const url = `${ASHBY_API_BASE}/${clientName}?includeCompensation=true`

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      console.error(`Ashby API error for ${clientName}:`, response.status, response.statusText)
      return []
    }

    const data = await response.json()

    if (!data.jobs || !Array.isArray(data.jobs)) {
      console.error(`Invalid Ashby response for ${clientName}`)
      return []
    }

    // Parse each job
    const jobs: RawJob[] = []

    for (const job of data.jobs) {
      try {
        const parsedJob = parseAshbyJob(job)
        if (parsedJob) {
          jobs.push(parsedJob)
        }
      } catch (err) {
        console.error(`Error parsing Ashby job ${job.id}:`, err)
        // Continue with next job
      }
    }

    return jobs
  } catch (error) {
    console.error(`Failed to fetch Ashby jobs for ${clientName}:`, error)
    return []
  }
}

/**
 * Parse a single Ashby job into the RawJob format
 */
function parseAshbyJob(job: any): RawJob | null {
  if (!job.id || !job.title) {
    return null
  }

  // Extract location
  let location: string | null = null
  if (job.location) {
    const loc = job.location
    location = loc.name || loc.displayName || JSON.stringify(loc)
  }

  // Extract compensation if available
  let salaryMin: number | null = null
  let salaryMax: number | null = null
  if (job.compensation && job.compensation.compensationRanges) {
    for (const range of job.compensation.compensationRanges) {
      if (range.minAmount && range.currency === 'USD') {
        salaryMin = Math.max(salaryMin || 0, range.minAmount)
      }
      if (range.maxAmount && range.currency === 'USD') {
        salaryMax = Math.min(salaryMax || Infinity, range.maxAmount)
      }
    }
  }

  // Get department
  const department = job.department?.name || null

  // Determine employment type
  let employmentType: string | null = null
  if (job.employmentType) {
    const typeLower = job.employmentType.toLowerCase()
    if (typeLower.includes('contract')) {
      employmentType = 'contract'
    } else if (typeLower.includes('part')) {
      employmentType = 'part_time'
    } else if (typeLower.includes('full')) {
      employmentType = 'full_time'
    }
  }

  // Ashby provides both HTML and text
  const descriptionHtml = job.descriptionHtml || job.description || ''
  const descriptionText = job.descriptionPlainText || stripHtml(descriptionHtml)

  // Get seniority level from title
  let seniorityLevel: string | null = null
  const titleLower = job.title.toLowerCase()
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
  const postedAt = job.publishedAt || job.createdAt || null

  return {
    externalId: String(job.id),
    title: job.title,
    descriptionHtml,
    descriptionText,
    location,
    salaryMin,
    salaryMax,
    department,
    employmentType,
    applyUrl: job.applyUrl || job.hostedUrl || '',
    postedAt,
    seniorityLevel
  }
}

/**
 * Strip HTML tags from text
 */
function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
