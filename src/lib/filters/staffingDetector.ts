/**
 * Staffing Agency Detection System
 *
 * Three-layer detection system:
 * 1. Name keyword check (instant flag or warning)
 * 2. Known company blocklist
 * 3. JD keyword scan
 */

// ============================================================================
// LAYER 1: NAME KEYWORD CHECK
// ============================================================================

/**
 * Keywords that INSTANTLY flag a company as a staffing agency
 */
const INSTANT_FLAG_KEYWORDS = [
  'staffing',
  'recruiting',
  'recruitment',
  'talent solutions',
  'personnel',
  'workforce',
  'placement',
  'temps',
  'recruit',
  'consulting', // Combined with other keywords
  'solutions',   // Combined with other keywords
  'technologies', // Combined with other keywords
  'resources',
  'associates',
  'services',
  'partners',
  'group llc',
  'llc consulting',
  'global llc'
]

/**
 * Keywords that WARN but require corroboration from Layer 2 or 3
 */
const WARNING_KEYWORDS = [
  'solutions llc',
  'consulting llc',
  'technologies llc',
  'group',
  'resources',
  'associates',
  'partners',
  'international',
  'worldwide',
  'global'
]

/**
 * Check company name for staffing agency keywords
 */
function checkNameKeywords(companyName: string): {
  isStaffing: boolean
  confidence: 'high' | 'medium' | 'low'
  reason: string
} {
  const name = companyName.toLowerCase()

  // Check for instant flag keywords
  for (const keyword of INSTANT_FLAG_KEYWORDS) {
    if (name.includes(keyword)) {
      return {
        isStaffing: true,
        confidence: 'high',
        reason: `Company name contains "${keyword}"`
      }
    }
  }

  // Check for warning keywords
  const warningCount = WARNING_KEYWORDS.filter(kw => name.includes(kw)).length
  if (warningCount >= 2) {
    return {
      isStaffing: true,
      confidence: 'medium',
      reason: `Company name contains multiple warning keywords`
    }
  }

  return {
    isStaffing: false,
    confidence: 'low',
    reason: 'No staffing keywords in company name'
  }
}

// ============================================================================
// LAYER 2: KNOWN COMPANY BLOCKLIST
// ============================================================================

/**
 * Known staffing and recruiting companies
 */
const KNOWN_STAFFING_COMPANIES = new Set([
  // Large staffing firms
  'teksystems',
  'insight global',
  'robert half',
  'randstad',
  'adecco',
  'kforce',
  'cybercoders',
  'apex systems',
  'monroe consulting group',
  'infosys bpo',
  'wipro',
  'tcs',
  'cognizant',
  'manpowergroup',
  'kelly services',
  'hays',
  'michael page',
  'accenture federal',
  'collabera',
  'syntel',
  'hcl',
  'tata consultancy',
  'capgemini',
  'ntt data',
  'ust global',
  'mindtree',
  'persistent systems',
  'mphasis',
  'hexaware',
  'niit technologies',
  'tech mahindra',
  'ltimindtree',
  'zensar',
  'birlasoft',
  'cyient',
  'mastech holdings',
  'igate',
  'synechron',
  'virtusa',
  'globant',
  'jobot',
  'dice',

  // Additional known staffing/recruiting companies
  'allegis group',
  'ascendion',
  'beyondsoft',
  'bluesun',
  'business network',
  'cgi federal',
  'collabera',
  'compro',
  'computer task group',
  'concentrix',
  'corsource',
  'cross country healthcare',
  'decipher technology partners',
  'doyon',
  'eclipse',
  'elite global',
  'elliott group',
  'excelitas',
  'flexton',
  'glover technology group',
  'harness',
  'header',
  'hcl america',
  'hillcross',
  'integrate',
  'isg',
  'it gyna',
  'it consultants',
  'it solutions',
  'it technical',
  'judTech',
  'kavaliro',
  'kforce',
  'kpmg',
  'larsen & toubro',
  'larsen and toubro',
  'laurus',
  'leos',
  'long view',
  'magellan',
  'mastech',
  'mentis',
  'metasys',
  'mindlance',
  'modis',
  'mondo',
  'mphasis',
  'msys',
  'nathan digital',
  'needing',
  'neuro tech',
  'nihilent',
  'nomura',
  'ntt data',
  'objection',
  'onward',
  'openweb',
  'owllabs',
  'paxus',
  'people',
  'permosys',
  'photon',
  'pk通讯',
  'plant',
  'probuse',
  'procom',
  'pros',
  'prtrum',
  'pythian',
  'rht',
  'rightnow',
  'rht',
  'solutions',
  'sony',
  'sogeti',
  'sopra',
  'sphere',
  'spr',
  'sql',
  'sr',
  'sss',
  'staffing',
  'stratum',
  'suneratech',
  'synechron',
  't3',
  'talented',
  'tarena',
  'teksystems',
  'temp',
  'the judge group',
  'thought',
  'tiara',
  'tietoevry',
  'tng',
  'top prospect',
  'torch',
  'trinamics',
  'trinet',
  'triumfant',
  'trugrid',
  'us',
  'us it',
  'us staffing',
  'usg',
  'utility',
  'validas',
  'vanilla',
  'vaptech',
  'veltris',
  'verisk',
  'virtusa',
  'visiant',
  'vision',
  'visual',
  'voltage',
  'vtm',
  'wave',
  'willscot',
  'wipro',
  'wisdom',
  'witt',
  'zachelor',
  'zane',
  'zetron',
  'ziprecruiter',
  'zolon',
  'zoo',
  'zycus',
  'zycus infotech'
])

/**
 * Check if company is in known staffing blocklist
 */
function checkBlocklist(companyName: string): {
  isStaffing: boolean
  confidence: 'high'
  reason: string
} | null {
  const name = companyName.toLowerCase().trim()

  // Direct match
  if (KNOWN_STAFFING_COMPANIES.has(name)) {
    return {
      isStaffing: true,
      confidence: 'high',
      reason: 'Company is in known staffing agency blocklist'
    }
  }

  // Partial match for company names that might have suffixes
  for (const blocked of KNOWN_STAFFING_COMPANIES) {
    if (name.includes(blocked) || blocked.includes(name)) {
      return {
        isStaffing: true,
        confidence: 'high',
        reason: `Company name matches blocked company "${blocked}"`
      }
    }
  }

  return null
}

// ============================================================================
// LAYER 3: JD KEYWORD SCAN
// ============================================================================

/**
 * Phrases in job descriptions that indicate staffing agencies
 */
const JD_KEYWORDS = [
  'our client',
  'on behalf of',
  'w2/c2c/1099',
  'right to represent',
  'bench',
  'hotlist',
  'end client',
  'bill rate',
  'corp to corp',
  'employer of record',
  'staff augmentation',
  'our client is looking',
  'representative',
  'recruiting firm',
  'recruitment agency',
  'acting for',
  'consulting firm'
]

/**
 * Scan job description for staffing agency indicators
 */
function scanJobDescription(jdText: string): {
  isStaffing: boolean
  confidence: 'high' | 'medium' | 'low'
  reasons: string[]
} {
  if (!jdText) {
    return {
      isStaffing: false,
      confidence: 'low',
      reasons: []
    }
  }

  const text = jdText.toLowerCase()
  const foundKeywords: string[] = []
  const reasons: string[] = []

  for (const keyword of JD_KEYWORDS) {
    if (text.includes(keyword)) {
      foundKeywords.push(keyword)
    }
  }

  // Calculate confidence based on keyword count
  let confidence: 'high' | 'medium' | 'low' = 'low'
  if (foundKeywords.length >= 3) {
    confidence = 'high'
  } else if (foundKeywords.length >= 1) {
    confidence = 'medium'
  }

  // Build reasons
  for (const keyword of foundKeywords) {
    reasons.push(`JD contains "${keyword}"`)
  }

  return {
    isStaffing: foundKeywords.length >= 1,
    confidence,
    reasons
  }
}

// ============================================================================
// MAIN DETECTION FUNCTION
// ============================================================================

export interface StaffingDetectionResult {
  isStaffing: boolean
  confidence: 'high' | 'medium' | 'low'
  reasons: string[]
  score: number // 0-100, higher = more likely staffing agency
}

/**
 * Detect if a company is a staffing agency using all three layers
 *
 * @param companyName - The company name to check
 * @param jdText - Optional job description text for Layer 3
 * @returns Detection result with confidence and reasons
 */
export function detectStaffingAgency(
  companyName: string,
  jdText?: string
): StaffingDetectionResult {
  const reasons: string[] = []
  let score = 0
  let isStaffing = false
  let maxConfidence: 'high' | 'medium' | 'low' = 'low'

  // Layer 1: Name keyword check
  const nameCheck = checkNameKeywords(companyName)
  if (nameCheck.isStaffing) {
    isStaffing = true
    maxConfidence = nameCheck.confidence
    reasons.push(nameCheck.reason)
    score += nameCheck.confidence === 'high' ? 50 : nameCheck.confidence === 'medium' ? 30 : 10
  }

  // Layer 2: Known blocklist
  const blocklistCheck = checkBlocklist(companyName)
  if (blocklistCheck) {
    isStaffing = true
    maxConfidence = 'high'
    reasons.push(blocklistCheck.reason)
    score += 100
  }

  // Layer 3: JD keyword scan
  if (jdText) {
    const jdScan = scanJobDescription(jdText)
    if (jdScan.isStaffing) {
      if (!isStaffing) {
        isStaffing = true
        maxConfidence = jdScan.confidence
      } else if (jdScan.confidence === 'high') {
        maxConfidence = 'high'
      }
      reasons.push(...jdScan.reasons)
      score += jdScan.confidence === 'high' ? 40 : jdScan.confidence === 'medium' ? 20 : 5
    }
  }

  // Calculate final confidence based on score
  let finalConfidence: 'high' | 'medium' | 'low' = 'low'
  if (score >= 70) {
    finalConfidence = 'high'
  } else if (score >= 30) {
    finalConfidence = 'medium'
  }

  return {
    isStaffing,
    confidence: isStaffing ? finalConfidence : 'low',
    reasons,
    score: Math.min(100, score)
  }
}
