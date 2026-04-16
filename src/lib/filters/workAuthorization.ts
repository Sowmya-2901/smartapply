/**
 * Work Authorization Filter Logic
 *
 * Provides filter rules for job filtering based on user's work authorization status.
 * This implements the complex conditional logic for H1B, H4 EAD, OPT, etc.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface FilterLogic {
  hideTags: string[]      // Tags that exclude the job
  requireTags: string[]   // Tags that the job must have
  description: string     // Human-readable explanation for UI
}

export interface AuthFilterOptions {
  showClearance: boolean   // Override: show jobs requiring security clearance
  onlySponsoring: boolean  // Override: only show jobs that offer visa sponsorship
}

// ============================================================================
// WORK AUTHORIZATION STATUSES
// ============================================================================

export const WORK_AUTHORIZATION_OPTIONS = [
  { value: 'US Citizen', label: 'US Citizen', description: 'Can work any job, including those requiring security clearance' },
  { value: 'Green Card', label: 'Green Card / Permanent Resident', description: 'Can work most jobs, except those explicitly requiring US citizenship' },
  { value: 'H1B Visa', label: 'H1B Visa', description: 'Requires visa sponsorship or transfer; limited by clearance and citizenship requirements' },
  { value: 'H4 EAD', label: 'H4 EAD (H4 with Employment Authorization)', description: 'Similar to H1B but with additional restrictions on EAD' },
  { value: 'STEM OPT', label: 'STEM OPT', description: 'F-1 STEM OPT work authorization; limited to 24 months' },
  { value: 'OPT (non-STEM)', label: 'OPT (non-STEM)', description: 'F-1 OPT work authorization; limited to 12 months' },
  { value: 'L1 Visa', label: 'L1 Visa', description: 'Intra-company transferee visa; cannot change employers' },
  { value: 'TN Visa', label: 'TN Visa', description: 'NAFTA professional visa for Canadian/Mexican citizens' },
  { value: 'Other Work Authorization', label: 'Other Work Authorization', description: 'Any other valid work authorization status' },
  { value: 'No Work Authorization', label: 'No Work Authorization (need sponsorship)', description: 'Not authorized to work in the US; need full visa sponsorship' }
] as const

export type WorkAuthorizationStatus = typeof WORK_AUTHORIZATION_OPTIONS[number]['value']

// ============================================================================
// FILTER RULES BY STATUS
// ============================================================================

/**
 * Get work authorization filter rules based on user status and overrides
 *
 * @param userStatus - User's work authorization status
 * @param overrides - User's override options
 * @returns Filter logic with hideTags, requireTags, and description
 */
export function getWorkAuthorizationFilters(
  userStatus: WorkAuthorizationStatus,
  overrides: AuthFilterOptions
): FilterLogic {
  const { showClearance, onlySponsoring } = overrides

  // Base tag sets
  const CITIZENSHIP_RESTRICTION = ['requires_us_citizenship']
  const CLEARANCE_RESTRICTION = ['requires_clearance']
  const SPONSORSHIP_RESTRICTION = ['no_sponsorship']
  const H1B_RESTRICTION = ['no_h1b']
  const H4_RESTRICTION = ['no_h4']
  const OPT_RESTRICTION = ['no_opt']
  const PERMANENT_RESTRICTION = ['requires_permanent_authorization']

  // Positive tags
  const SPONSORSHIP_TAG = ['sponsors_visa']

  switch (userStatus) {
    case 'US Citizen':
      return {
        hideTags: [],
        requireTags: [],
        description: 'As a US citizen, you can work any job including those requiring security clearance.'
      }

    case 'Green Card':
      return {
        hideTags: CITIZENSHIP_RESTRICTION,
        requireTags: [],
        description: 'As a Green Card holder, you can work most jobs except those explicitly requiring US citizenship. You are eligible for security clearance.'
      }

    case 'H1B Visa': {
      let hideTags = [
        ...CITIZENSHIP_RESTRICTION,
        ...CLEARANCE_RESTRICTION,
        ...SPONSORSHIP_RESTRICTION,
        ...H1B_RESTRICTION,
        ...PERMANENT_RESTRICTION
      ]

      // Override for clearance jobs
      if (showClearance) {
        hideTags = hideTags.filter(tag => !CLEARANCE_RESTRICTION.includes(tag))
      }

      // Override for sponsorship only
      let requireTags: string[] = []
      if (onlySponsoring) {
        requireTags = SPONSORSHIP_TAG
      }

      return {
        hideTags,
        requireTags,
        description: showClearance
          ? 'Based on your H1B status, we\'re hiding jobs that require US citizenship, won\'t sponsor visas, or require permanent authorization. Showing clearance jobs per your override.'
          : 'Based on your H1B status, we\'re hiding jobs that require US citizenship, security clearance, won\'t sponsor visas, or require permanent authorization.'
      }
    }

    case 'H4 EAD': {
      let hideTags = [
        ...CITIZENSHIP_RESTRICTION,
        ...CLEARANCE_RESTRICTION,
        ...SPONSORSHIP_RESTRICTION,
        ...H1B_RESTRICTION,
        ...H4_RESTRICTION,
        ...PERMANENT_RESTRICTION
      ]

      if (showClearance) {
        hideTags = hideTags.filter(tag => !CLEARANCE_RESTRICTION.includes(tag))
      }

      let requireTags: string[] = []
      if (onlySponsoring) {
        requireTags = SPONSORSHIP_TAG
      }

      return {
        hideTags,
        requireTags,
        description: showClearance
          ? 'Based on your H4 EAD status, we\'re hiding jobs that require US citizenship, clearance (per override), won\'t sponsor visas, don\'t accept H4, or require permanent authorization.'
          : 'Based on your H4 EAD status, we\'re hiding jobs that require US citizenship, security clearance, won\'t sponsor visas, don\'t accept H4, or require permanent authorization.'
      }
    }

    case 'STEM OPT': {
      let hideTags = [
        ...CITIZENSHIP_RESTRICTION,
        ...CLEARANCE_RESTRICTION,
        ...SPONSORSHIP_RESTRICTION,
        ...OPT_RESTRICTION,
        ...H1B_RESTRICTION,
        ...PERMANENT_RESTRICTION
      ]

      if (showClearance) {
        hideTags = hideTags.filter(tag => !CLEARANCE_RESTRICTION.includes(tag))
      }

      let requireTags: string[] = []
      if (onlySponsoring) {
        requireTags = SPONSORSHIP_TAG
      }

      return {
        hideTags,
        requireTags,
        description: showClearance
          ? 'Based on your STEM OPT status, we\'re hiding jobs that require US citizenship, won\'t sponsor visas, don\'t accept OPT/CPT, or require permanent authorization. Showing clearance jobs per your override.'
          : 'Based on your STEM OPT status, we\'re hiding jobs that require US citizenship, security clearance, won\'t sponsor visas, don\'t accept OPT/CPT, or require permanent authorization.'
      }
    }

    case 'OPT (non-STEM)': {
      // Same as STEM OPT but even more restrictive in practice
      let hideTags = [
        ...CITIZENSHIP_RESTRICTION,
        ...CLEARANCE_RESTRICTION,
        ...SPONSORSHIP_RESTRICTION,
        ...OPT_RESTRICTION,
        ...H1B_RESTRICTION,
        ...PERMANENT_RESTRICTION
      ]

      if (showClearance) {
        hideTags = hideTags.filter(tag => !CLEARANCE_RESTRICTION.includes(tag))
      }

      let requireTags: string[] = []
      if (onlySponsoring) {
        requireTags = SPONSORSHIP_TAG
      }

      return {
        hideTags,
        requireTags,
        description: showClearance
          ? 'Based on your non-STEM OPT status, we\'re hiding jobs that require US citizenship, won\'t sponsor visas, don\'t accept OPT, or require permanent authorization. Showing clearance jobs per your override.'
          : 'Based on your non-STEM OPT status, we\'re hiding jobs that require US citizenship, security clearance, won\'t sponsor visas, don\'t accept OPT, or require permanent authorization.'
      }
    }

    case 'L1 Visa': {
      let hideTags = [
        ...CITIZENSHIP_RESTRICTION,
        ...CLEARANCE_RESTRICTION,
        ...SPONSORSHIP_RESTRICTION,
        ...PERMANENT_RESTRICTION
      ]

      if (showClearance) {
        hideTags = hideTags.filter(tag => !CLEARANCE_RESTRICTION.includes(tag))
      }

      let requireTags: string[] = []
      if (onlySponsoring) {
        requireTags = SPONSORSHIP_TAG
      }

      return {
        hideTags,
        requireTags,
        description: showClearance
          ? 'Based on your L1 visa status, we\'re hiding jobs that require US citizenship, won\'t sponsor (L1 doesn\'t need sponsorship but typically won\'t accept other visas), or require permanent authorization. Showing clearance jobs per your override.'
          : 'Based on your L1 visa status, we\'re hiding jobs that require US citizenship, security clearance, won\'t sponsor, or require permanent authorization.'
      }
    }

    case 'TN Visa': {
      let hideTags = [
        ...CITIZENSHIP_RESTRICTION,
        ...CLEARANCE_RESTRICTION,
        ...SPONSORSHIP_RESTRICTION,
        ...PERMANENT_RESTRICTION
      ]

      if (showClearance) {
        hideTags = hideTags.filter(tag => !CLEARANCE_RESTRICTION.includes(tag))
      }

      let requireTags: string[] = []
      if (onlySponsoring) {
        requireTags = SPONSORSHIP_TAG
      }

      return {
        hideTags,
        requireTags,
        description: showClearance
          ? 'Based on your TN visa status, we\'re hiding jobs that require US citizenship, security clearance (per override), won\'t sponsor, or require permanent authorization.'
          : 'Based on your TN visa status, we\'re hiding jobs that require US citizenship, security clearance, won\'t sponsor, or require permanent authorization.'
      }
    }

    case 'Other Work Authorization': {
      let hideTags = [
        ...CITIZENSHIP_RESTRICTION,
        ...CLEARANCE_RESTRICTION,
        ...SPONSORSHIP_RESTRICTION,
        ...PERMANENT_RESTRICTION
      ]

      if (showClearance) {
        hideTags = hideTags.filter(tag => !CLEARANCE_RESTRICTION.includes(tag))
      }

      let requireTags: string[] = []
      if (onlySponsoring) {
        requireTags = SPONSORSHIP_TAG
      }

      return {
        hideTags,
        requireTags,
        description: showClearance
          ? 'Based on your work authorization status, we\'re hiding jobs that require US citizenship, security clearance (per override), won\'t sponsor, or require permanent authorization.'
          : 'Based on your work authorization status, we\'re hiding jobs that require US citizenship, security clearance, won\'t sponsor, or require permanent authorization.'
      }
    }

    case 'No Work Authorization': {
      let hideTags: string[] = []
      let requireTags = SPONSORSHIP_TAG

      // If clearance override is on, also include clearance jobs that offer sponsorship
      // (rare but possible - defense contractors sometimes sponsor)

      return {
        hideTags,
        requireTags,
        description: 'Since you don\'t have work authorization, we\'re ONLY showing jobs that explicitly offer visa sponsorship. All other jobs are hidden.'
      }
    }

    default:
      return {
        hideTags: [],
        requireTags: [],
        description: 'No work authorization filters applied.'
      }
  }
}

/**
 * Check if a job passes work authorization filters
 *
 * @param jobFilterTags - Tags from the job's filter_tags array
 * @param userStatus - User's work authorization status
 * @param overrides - User's override options
 * @returns true if job passes filters, false otherwise
 */
export function jobPassesWorkAuthorizationFilters(
  jobFilterTags: string[],
  userStatus: WorkAuthorizationStatus,
  overrides: AuthFilterOptions
): boolean {
  const filters = getWorkAuthorizationFilters(userStatus, overrides)

  // Check if job has any tags that should hide it
  const shouldHide = filters.hideTags.some(tag => jobFilterTags.includes(tag))
  if (shouldHide) return false

  // Check if job has required tags
  if (filters.requireTags.length > 0) {
    const hasRequiredTag = filters.requireTags.some(tag => jobFilterTags.includes(tag))
    if (!hasRequiredTag) return false
  }

  return true
}
