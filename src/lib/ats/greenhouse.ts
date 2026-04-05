import { RawJob } from './types'

/**
 * Greenhouse Job Board API Integration
 *
 * API: GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
 * Docs: https://developers.greenhouse.io/job-board.html
 */

const GREENHOUSE_API_BASE = 'https://boards-api.greenhouse.io/v1/boards'

/**
 * Fetch all jobs from a Greenhouse board
 *
 * @param boardToken - The company's board token (e.g., "stripe" for boards.greenhouse.io/stripe)
 * @returns Array of standardized RawJob objects
 */
export async function fetchGreenhouseJobs(boardToken: string): Promise<RawJob[]> {
  const url = `${GREENHOUSE_API_BASE}/${boardToken}/jobs?content=true`

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      // Add a small delay to be respectful
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      console.error(`Greenhouse API error for ${boardToken}:`, response.status, response.statusText)
      return []
    }

    const data = await response.json()

    if (!data.jobs || !Array.isArray(data.jobs)) {
      console.error(`Invalid Greenhouse response for ${boardToken}`)
      return []
    }

    // Parse each job
    const jobs: RawJob[] = []

    for (const job of data.jobs) {
      try {
        const parsedJob = parseGreenhouseJob(job)
        if (parsedJob) {
          jobs.push(parsedJob)
        }
      } catch (err) {
        console.error(`Error parsing Greenhouse job ${job.id}:`, err)
        // Continue with next job
      }
    }

    return jobs
  } catch (error) {
    console.error(`Failed to fetch Greenhouse jobs for ${boardToken}:`, error)
    return []
  }
}

/**
 * Parse a single Greenhouse job into the RawJob format
 */
function parseGreenhouseJob(job: any): RawJob | null {
  if (!job.id || !job.title) {
    return null
  }

  // Extract location from offices or location field
  let location: string | null = null
  if (job.offices && job.offices.length > 0) {
    location = job.offices.map((o: any) => o.name).filter(Boolean).join(', ')
  } else if (job.location) {
    location = job.location.name || job.location
  }

  // Extract salary from metadata if available
  let salaryMin: number | null = null
  let salaryMax: number | null = null
  if (job.metadata && job.metadata.length > 0) {
    for (const meta of job.metadata) {
      if (meta.name && meta.name.toLowerCase().includes('salary') && meta.value) {
        // Try to parse salary range like "$100,000 - $150,000"
        const salaryMatch = meta.value.toString().match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)/)
        if (salaryMatch) {
          salaryMin = parseInt(salaryMatch[1].replace(/,/g, ''))
          salaryMax = parseInt(salaryMatch[2].replace(/,/g, ''))
        }
      }
    }
  }

  // Determine employment type from metadata
  let employmentType: string | null = null
  if (job.metadata && job.metadata.length > 0) {
    for (const meta of job.metadata) {
      if (meta.name === 'Employment Type' || meta.name === 'Commitment') {
        const value = meta.value?.toLowerCase() || ''
        if (value.includes('contract')) {
          employmentType = 'contract'
        } else if (value.includes('part')) {
          employmentType = 'part_time'
        } else if (value.includes('full')) {
          employmentType = 'full_time'
        }
        break
      }
    }
  }

  // Clean HTML from description
  const descriptionHtml = job.content || job.description || ''
  const descriptionText = stripHtml(descriptionHtml)

  // Get seniority level from title or metadata
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
  const postedAt = job.updated_at || job.created_at || null

  return {
    externalId: String(job.id),
    title: job.title,
    descriptionHtml,
    descriptionText,
    location,
    salaryMin,
    salaryMax,
    department: job.department || null,
    employmentType,
    applyUrl: job.absolute_url || job.hosted_url || `https://boards.greenhouse.io/${job.boards[0]?.token || 'unknown'}/jobs/${job.id}`,
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
