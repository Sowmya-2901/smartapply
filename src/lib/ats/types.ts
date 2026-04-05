/**
 * Standardized Raw Job interface
 * All ATS integrations return this format
 */
export interface RawJob {
  externalId: string
  title: string
  descriptionHtml: string
  descriptionText: string
  location: string | null
  salaryMin: number | null
  salaryMax: number | null
  department: string | null
  employmentType: string | null
  applyUrl: string
  postedAt: string | null
  seniorityLevel: string | null
}
