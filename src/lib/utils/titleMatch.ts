/**
 * Title Matching Utilities
 *
 * Compares job titles against user's preferred titles to determine
 * how well a job matches what the user is looking for.
 */

/**
 * Normalize a job title for comparison
 * Removes common variations and standardizes terminology
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Remove common prefixes
    .replace(/^(the\s+)/i, '')
    // Standardize variations
    .replace(/\bsoftware\s*engineer(\s*i|\s*ii|\s*iii)?\b/gi, 'engineer')
    .replace(/\bdata\s*scientist(\s*i|\s*ii|\s*iii)?\b/gi, 'data scientist')
    .replace(/\bproduct\s*manager(\s*i|\s*ii|\s*iii)?\b/gi, 'product manager')
    .replace(/\bproject\s*manager(\s*i|\s*ii|\s*iii)?\b/gi, 'project manager')
    // Normalize roman numerals
    .replace(/\bi\b/g, '1')
    .replace(/\bii\b/g, '2')
    .replace(/\biii\b/g, '3')
    .replace(/\biv\b/g, '4')
    .replace(/\bv\b/g, '5')
    // Remove common suffixes
    .replace(/\s+(sr\.|senior|lead|principal|staff)\b/g, ' senior')
    .replace(/\s+(jr\.|junior)\b/g, ' junior')
    .replace(/\s+(mid|mid-level)\b/g, ' mid')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculate title match percentage between user's preferred titles and job title
 *
 * @param userPreferredTitles - Array of user's preferred job titles (from profile)
 * @param jobTitle - The job title to match against
 * @returns Match percentage (0-100)
 */
export function calculateTitleMatchScore(
  userPreferredTitles: string[],
  jobTitle: string
): { score: number; matchedTitle: string | null } {
  if (!userPreferredTitles || userPreferredTitles.length === 0) {
    return { score: 10, matchedTitle: null } // Default neutral score
  }

  const normalizedJobTitle = normalizeTitle(jobTitle)

  // Check for exact or partial matches
  for (const preferredTitle of userPreferredTitles) {
    const normalizedPreferred = normalizeTitle(preferredTitle)

    // Exact match
    if (normalizedJobTitle === normalizedPreferred) {
      return { score: 10, matchedTitle: preferredTitle }
    }

    // Check if job title contains the preferred title (e.g., "Senior Backend Engineer" contains "Backend Engineer")
    if (normalizedJobTitle.includes(normalizedPreferred) && normalizedPreferred.length > 3) {
      return { score: 10, matchedTitle: preferredTitle }
    }

    // Check if preferred title contains job title (e.g., "Engineer" matches "Software Engineer")
    if (normalizedPreferred.includes(normalizedJobTitle) && normalizedJobTitle.length > 3) {
      return { score: 8, matchedTitle: preferredTitle }
    }
  }

  // Check for keyword overlap if no direct match
  const jobWords = new Set(normalizedJobTitle.split(' ').filter(w => w.length >= 3))
  const preferredWords = userPreferredTitles.flatMap(t => normalizeTitle(t).split(' ').filter(w => w.length >= 3))

  let matchingWords = 0
  for (const word of jobWords) {
    if (preferredWords.includes(word)) {
      matchingWords++
    }
  }

  if (matchingWords > 0) {
    const overlapRatio = matchingWords / Math.max(jobWords.size, 1)
    return { score: Math.round(overlapRatio * 10), matchedTitle: null }
  }

  // No meaningful match
  return { score: 0, matchedTitle: null }
}

/**
 * Calculate skill match percentage
 *
 * @param userSkills - User's skills array
 * @param jobSkills - Job's required skills array
 * @returns Percentage of job skills the user possesses (0-100)
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
