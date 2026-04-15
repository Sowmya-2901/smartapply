/**
 * Apply URL Source Tracking
 *
 * Adds tracking parameters to apply URLs so companies know applicants
 * came from SmartApply. Each ATS platform uses a different parameter.
 *
 * Greenhouse: ?gh_src=smartapply
 * Lever: ?lever_source[]=smartapply
 * Ashby: ?utm_source=smartapply
 */

/**
 * Get the tracked apply URL with source tracking parameter
 *
 * @param applyUrl - The original apply URL from the ATS
 * @param atsSource - The ATS platform ('greenhouse', 'lever', 'ashby', etc.)
 * @returns URL with tracking parameter added, or original URL if parsing fails
 */
export function getTrackedApplyUrl(applyUrl: string, atsSource: string): string {
  try {
    const url = new URL(applyUrl)

    switch (atsSource) {
      case 'greenhouse':
        // Greenhouse uses gh_src parameter
        url.searchParams.set('gh_src', 'smartapply')
        break

      case 'lever':
        // Lever uses lever_source[] parameter (array format)
        url.searchParams.append('lever_source[]', 'smartapply')
        break

      case 'ashby':
        // Ashby uses utm_source parameter (UTM standard)
        url.searchParams.set('utm_source', 'smartapply')
        break

      default:
        // For unknown ATS platforms, try UTM source as a fallback
        if (!url.searchParams.has('utm_source')) {
          url.searchParams.set('utm_source', 'smartapply')
        }
        break
    }

    return url.toString()
  } catch (error) {
    // If URL parsing fails, return original URL
    console.warn(`Failed to add tracking to URL: ${applyUrl}`, error)
    return applyUrl
  }
}

/**
 * Get the ATS platform name from the source_api field
 * Formats it for display (e.g., "Via Greenhouse", "Via Lever")
 *
 * @param sourceApi - The source_api value from the database
 * @returns Formatted display name
 */
export function getAtsDisplayName(sourceApi: string): string {
  switch (sourceApi) {
    case 'greenhouse':
      return 'Greenhouse'
    case 'lever':
      return 'Lever'
    case 'ashby':
      return 'Ashby'
    default:
      // Capitalize first letter
      return sourceApi.charAt(0).toUpperCase() + sourceApi.slice(1).toLowerCase()
  }
}
