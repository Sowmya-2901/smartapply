/**
 * Duplicate Job Detection Utilities
 *
 * Normalizes company names, job titles, and locations to create
 * a deduplication key that catches duplicate jobs across different sources.
 */

/**
 * Normalize company name, job title, and location for deduplication
 *
 * Examples:
 *   "Stripe, Inc." + "Senior Backend Engineer" + "San Francisco"
 *   → "stripe::senior backend engineer::san francisco"
 *
 * @param companyName - Company name to normalize
 * @param jobTitle - Job title to normalize
 * @param location - Optional location to include in dedup key
 * @returns Normalized dedup key string
 */
export function normalizeForDedup(
  companyName: string,
  jobTitle: string,
  location?: string | null
): string {
  // Step 1: Lowercase everything
  let normalized = companyName.toLowerCase()
  let title = jobTitle.toLowerCase()
  let loc = location?.toLowerCase() || ''

  // Step 2: Remove company suffixes (Inc, LLC, Ltd, Corp, etc.)
  normalized = normalized
    .replace(/\s+(inc|llc|ltd|ltd\.|corp|co\.|gmbh)\.?$/g, '')
    .replace(/[,.\s]+/g, ' ')
    .trim()

  // Step 3: Normalize common title abbreviations
  title = title
    .replace(/\bsr\.\b/g, 'senior')
    .replace(/\bjr\.\b/g, 'junior')
    .replace(/\biv\b/g, '4')
    .replace(/\biii\b/g, '3')
    .replace(/\bii\b/g, '2')
    .replace(/\bi\b/g, '1')
    // Remove common filler words
    .replace(/\b(the\s+)?software\s+(engineer|developer)\b/g, '$1')
    .replace(/\b(the\s+)?(data|machine\s*learning)\s*engineer\b/g, 'ml engineer')

  // Step 4: Remove special characters (except hyphens) and extra whitespace
  normalized = normalized.replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ').trim()
  title = title.replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ').trim()
  loc = loc.replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ').trim()

  // Step 5: Combine into dedup key
  // Include location to differentiate same job title in different locations
  return `${normalized}::${title}${loc ? '::' + loc : ''}`
}

/**
 * Calculate skill match percentage between two arrays
 *
 * @param userSkills - User's skills array
 * @param jobSkills - Job's required skills array
 * @returns Percentage of job skills the user possesses
 */
export function calculateSkillMatchPercentage(
  userSkills: string[],
  jobSkills: string[]
): number {
  if (!jobSkills || jobSkills.length === 0) {
    return 0
  }

  const normalizedUserSkills = new Set(
    userSkills.map(s => s.toLowerCase().trim())
  )
  const matchedSkills = jobSkills.filter(skill =>
    normalizedUserSkills.has(skill.toLowerCase().trim())
  )

  return Math.round((matchedSkills.length / jobSkills.length) * 100)
}
