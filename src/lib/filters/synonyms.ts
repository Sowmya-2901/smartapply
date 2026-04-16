/**
 * Synonym Filter Engine
 *
 * Tags job descriptions with standardized filter labels at ingestion time.
 * This runs ONCE per job when it's first ingested, not at query time.
 */

import { calculateTitleMatchScore } from '../utils/titleMatch'

// ============================================================================
// FILTER DEFINITIONS
// ============================================================================

interface FilterConfig {
  action: string
  match_any: string[]
  exclude_if_also_contains?: string[]
}

export const FILTER_DEFINITIONS: Record<string, FilterConfig> = {
  // ============================================================================
  // WORK AUTHORIZATION FILTERS
  // ============================================================================

  /**
   * Phrases indicating US citizenship is required (not clearance, not sponsorship)
   * Tag: 'requires_us_citizenship'
   */
  requires_us_citizenship: {
    action: 'tag',
    match_any: [
      'us citizen',
      'u.s. citizen',
      'u.s.citizen',
      'us citizen only',
      'u.s. citizen only',
      'united states citizen',
      'us citizenship required',
      'must be us citizen',
      'must be a us citizen',
      'require us citizenship',
      'citizenship required',
      'us nationals only',
      'u.s. nationals only'
    ]
  },

  /**
   * Phrases indicating security clearance requirements
   * Tag: 'requires_clearance'
   */
  requires_clearance: {
    action: 'tag',
    match_any: [
      'security clearance',
      'clearance required',
      'active clearance',
      'current clearance',
      'valid clearance',
      'TS/SCI',
      'TS SCI',
      'top secret',
      'secret clearance',
      'public trust',
      'ITAR',
      'ITAR restricted',
      'EAR',
      'must be clearable',
      'ability to obtain clearance',
      'clearable',
      'interim clearance',
      'final clearance',
      'dept of defense clearance',
      'government clearance'
    ]
  },

  /**
   * Phrases indicating company will NOT sponsor visas
   * Tag: 'no_sponsorship'
   */
  no_sponsorship: {
    action: 'tag',
    match_any: [
      'no visa sponsorship',
      'will not sponsor',
      'cannot sponsor',
      'does not sponsor',
      'unable to sponsor',
      'not sponsor',
      'no sponsorship available',
      'without sponsorship',
      'no sponsorship',
      'no visa',
      'cannot provide sponsorship',
      'not providing sponsorship',
      'independent work authorization required',
      'must be authorized to work without sponsorship',
      'permanent work authorization required',
      'must have permanent work authorization',
      'no work authorization sponsorship',
      'we do not sponsor',
      'we cannot sponsor',
      'company does not sponsor'
    ]
  },

  /**
   * Phrases indicating OPT/CPT is not accepted
   * Tag: 'no_opt'
   */
  no_opt: {
    action: 'tag',
    match_any: [
      'no OPT',
      'no CPT',
      'no OPT CPT',
      'no STEM OPT',
      'no international students',
      'not accept OPT',
      'OPT not accepted',
      'does not accept OPT',
      'cannot accept OPT',
      'CPT not accepted',
      'no F1',
      'no F1 visa',
      'not accept F1',
      'not eligible for OPT',
      'no student visa',
      'not accept international students'
    ]
  },

  /**
   * Phrases indicating H1B visa is not accepted/sponsored
   * Tag: 'no_h1b'
   */
  no_h1b: {
    action: 'tag',
    match_any: [
      'no H1B',
      'no H-1B',
      'no H1-B',
      'no H1 B',
      'not accept H1B',
      'H1B not accepted',
      'does not accept H1B',
      'cannot accept H1B',
      'not transfer H1B',
      'no H1B transfer',
      'H1B visa not accepted',
      'not sponsoring H1B'
    ]
  },

  /**
   * Phrases indicating H4 EAD is not accepted
   * Tag: 'no_h4'
   */
  no_h4: {
    action: 'tag',
    match_any: [
      'no H4',
      'no H-4',
      'no H4 EAD',
      'no H4-EAD',
      'H4 EAD not accepted',
      'no EAD',
      'not accept EAD',
      'EAD not accepted',
      'does not accept H4',
      'H4 not accepted',
      'not accept H4 dependent'
    ]
  },

  /**
   * Phrases indicating company DOES sponsor visas
   * Tag: 'sponsors_visa'
   */
  sponsors_visa: {
    action: 'tag',
    match_any: [
      'visa sponsorship available',
      'we sponsor visas',
      'visa sponsorship',
      'will sponsor',
      'sponsorship available',
      'H1B welcome',
      'H1B accepted',
      'open to sponsorship',
      'sponsor qualified candidates',
      'sponsorship provided',
      'we provide sponsorship',
      'can sponsor',
      'able to sponsor',
      'visa transfer available',
      'H1B transfer available',
      'we will sponsor',
      'employment visa sponsorship',
      'work visa sponsorship',
      'sponsor work authorization',
      'green card sponsorship',
      'we sponsor green cards'
    ]
  },

  /**
   * Phrases indicating permanent work authorization (green card/citizen) is required
   * Tag: 'requires_permanent_authorization'
   */
  requires_permanent_authorization: {
    action: 'tag',
    match_any: [
      'permanent work authorization',
      'permanent authorization required',
      'green card or citizen',
      'permanent resident or citizen',
      'must have permanent authorization',
      'authorized to work permanently',
      'must be permanently authorized',
      'permanent work status',
      'must be a permanent resident',
      'green card holder',
      'us citizen or green card',
      'citizen or permanent resident'
    ]
  },

  // ============================================================================
  // JOB TYPE FILTERS
  // ============================================================================

  /**
   * Phrases indicating contract/temp work
   * Tag: 'contract_job'
   */
  contract_job: {
    action: 'tag',
    match_any: [
      'contract position',
      'contract role',
      'contract-to-hire',
      'contract to hire',
      'c2h',
      'cth',
      'temp to perm',
      'temporary position',
      '6 month contract',
      '12 month contract',
      '1099',
      'w2/c2c',
      'w2 or c2c',
      'corp to corp',
      'c2c',
      'contract only',
      'contract basis',
      'temp position',
      'temporary role',
      'staff augmentation',
      'sow based',
      'independent contractor',
      'contract employment',
      'contractor role'
    ],
    exclude_if_also_contains: [
      'full-time',
      'full time',
      'permanent',
      'fte',
      'direct hire',
      'regular full-time'
    ]
  },

  /**
   * Phrases indicating new grad campus/university programs
   * Tag: 'new_grad_job'
   *
   * NOTE: Excludes "entry level" and "junior level" - those are handled by
   * seniority preferences. This tag is specifically for campus hiring programs.
   */
  new_grad_job: {
    action: 'tag',
    match_any: [
      'new grad',
      'new graduate',
      'recent graduate',
      'university hire',
      'campus hire',
      'campus recruiting',
      'rotational program',
      'early career',
      'early-career',
      'recent college graduate',
      'rcg',
      'recent college grad',
      'university recruiting',
      'campus program',
      'leadership development program',
      'associate engineer' // Often used in campus programs
    ]
  },

  /**
   * Phrases indicating remote work
   * Tag: 'remote_job'
   */
  remote_job: {
    action: 'tag',
    match_any: [
      'remote',
      'work from home',
      'wfh',
      'distributed team',
      'location flexible',
      'work from anywhere',
      'fully remote',
      '100% remote',
      'remote-first',
      'remote first',
      'anywhere in the us',
      'us remote',
      'virtual position',
      'telecommute',
      'telecommuting'
    ]
  },

  /**
   * Phrases indicating hybrid work
   * Tag: 'hybrid_job'
   */
  hybrid_job: {
    action: 'tag',
    match_any: [
      'hybrid',
      '2 days in office',
      '3 days in office',
      'partial remote',
      'flexible location',
      '2 days onsite',
      '3 days onsite',
      'in-office and remote',
      'mix of remote',
      'hybrid work model',
      'flex schedule'
    ]
  },

  /**
   * Phrases indicating full-time employment
   * Tag: 'fulltime_job'
   */
  fulltime_job: {
    action: 'tag',
    match_any: [
      'full-time',
      'full time',
      'fte',
      'permanent',
      'direct hire',
      'permanent position',
      'salaried position',
      'regular full-time',
      'regular full time',
      'fulltime'
    ]
  }
}

// ============================================================================
// EXPERIENCE PARSING PATTERNS
// ============================================================================

/**
 * Regex patterns to extract years of experience from job descriptions
 */
export const EXPERIENCE_PATTERNS = [
  // "5+ years" or "5 plus years"
  /(\d+)\+?\s*(?:plus\s*)?years?\s*(?:of\s*(?:experience|work))?/i,
  // "3-5 years" or "3 to 5 years"
  /(\d+)\s*(?:-|to)\s*(\d+)\s*years?\s*(?:of\s*(?:experience|work))?/i,
  // "minimum 7 years" or "min 7 years"
  /(?:minimum|min|required)\s*(\d+)\s*years?\s*(?:of\s*(?:experience|work))?/i,
  // "at least 3 years"
  /(?:at\s*least|minimum\s*of)\s*(\d+)\s*years?\s*(?:of\s*(?:experience|work))?/i
]

/**
 * Title-based experience inference
 */
export const TITLE_EXPERIENCE_MAP: Record<string, number> = {
  'intern': 0,
  'internship': 0,
  'associate': 1,
  'junior': 1,
  'jr': 1,
  'mid': 3,
  'ii': 3,
  'iii': 5,
  'senior': 5,
  'sr': 5,
  'lead': 6,
  'principal': 8,
  'staff': 8,
  'architect': 8,
  'director': 10,
  'vp': 12,
  'head': 10
}

// ============================================================================
// SKILL SYNONYMS
// ============================================================================

/**
 * Map of tech skill variations to canonical names
 * Used for matching user skills against job description skills
 */
export const SKILL_SYNONYMS: Record<string, string[]> = {
  'Python': ['Python', 'Python3', 'Python 3', 'Python 3.x', 'CPython'],
  'JavaScript': ['JavaScript', 'JS', 'ES6', 'ES2015', 'ECMAScript', 'ECMAScript 6'],
  'TypeScript': ['TypeScript', 'TS'],
  'React': ['React', 'React.js', 'ReactJS', 'React JS', 'Reactjs'],
  'Node.js': ['Node.js', 'Node', 'NodeJS', 'Node-JS'],
  'Angular': ['Angular', 'AngularJS', 'Angular JS', 'Angular2', 'Angular 2', 'Angular4', 'Angular 4'],
  'Vue': ['Vue', 'Vue.js', 'VueJS', 'Vuejs'],
  'Next.js': ['Next.js', 'NextJS', 'Next js'],
  'Nuxt': ['Nuxt', 'Nuxt.js', 'NuxtJS'],
  'AWS': ['AWS', 'Amazon Web Services', 'Amazon Web Service'],
  'GCP': ['GCP', 'Google Cloud', 'Google Cloud Platform'],
  'Azure': ['Azure', 'Microsoft Azure', 'MS Azure'],
  'Kubernetes': ['Kubernetes', 'K8s', 'k8s', 'K8s'],
  'Docker': ['Docker', 'Containerization', 'Containers'],
  'PostgreSQL': ['PostgreSQL', 'Postgres', 'Postgres SQL', 'psql'],
  'MySQL': ['MySQL', 'My SQL'],
  'MongoDB': ['MongoDB', 'Mongo', 'Mongo DB'],
  'Redis': ['Redis', 'Redis cache', 'Redis Cache'],
  'Kafka': ['Kafka', 'Apache Kafka', 'event streaming'],
  'RabbitMQ': ['RabbitMQ', 'Rabbit MQ', 'Rabbit'],
  'Elasticsearch': ['Elasticsearch', 'Elastic', 'ELK', 'Elastic Stack'],
  'Spring Boot': ['Spring Boot', 'SpringBoot', 'Spring Framework', 'Spring'],
  'CI/CD': ['CI/CD', 'CICD', 'continuous integration', 'continuous delivery', 'CI CD'],
  'Jenkins': ['Jenkins', 'Jenkins CI'],
  'GitHub Actions': ['GitHub Actions', 'Github Actions', 'Actions'],
  'GitLab CI': ['GitLab CI', 'Gitlab CI'],
  'CircleCI': ['CircleCI', 'Circle CI'],
  'GraphQL': ['GraphQL', 'GQL'],
  'REST': ['REST', 'RESTful', 'REST API', 'RESTful API', 'Rest'],
  'REST API': ['REST API', 'RESTful API', 'Rest API'],
  'SQL': ['SQL', 'Structured Query Language'],
  'NoSQL': ['NoSQL', 'No SQL'],
  'Terraform': ['Terraform', 'TF', 'Infrastructure as Code', 'IaC', 'infrastructure-as-code'],
  'Pulumi': ['Pulumi'],
  'Ansible': ['Ansible'],
  'Go': ['Go', 'Golang'],
  'Rust': ['Rust', 'Rust lang'],
  'Java': ['Java', 'J2EE', 'JDK', 'JVM'],
  'C++': ['C++', 'CPP', 'Cplus', 'C plus plus'],
  'C#': ['C#', 'Csharp', 'C sharp', 'C Sharp'],
  'Ruby': ['Ruby', 'Ruby on Rails', 'Rails'],
  'PHP': ['PHP', 'Hypertext Preprocessor'],
  'Swift': ['Swift', 'SwiftUI'],
  'Kotlin': ['Kotlin', 'Kt'],
  'Scala': ['Scala'],
  'Clojure': ['Clojure', 'Clojurescript'],
  'Elixir': ['Elixir', 'Erlang'],
  'Haskell': ['Haskell'],
  'MATLAB': ['MATLAB', 'Matlab'],
  'Spark': ['Spark', 'Apache Spark', 'PySpark'],
  'Hadoop': ['Hadoop', 'HDFS', 'MapReduce'],
  'Flink': ['Flink', 'Apache Flink'],
  'gRPC': ['gRPC', 'grpc', 'GRPC', 'Google RPC'],
  'Protocol Buffers': ['Protocol Buffers', 'Protobuf', 'proto3'],
  'Microservices': ['microservices', 'micro-services', 'microservice architecture', 'micro service architecture'],
  'Agile': ['Agile', 'Scrum', 'Kanban', 'Sprint', 'XP'],
  'Scrum': ['Scrum'],
  'Kanban': ['Kanban'],
  'Machine Learning': ['Machine Learning', 'ML', 'machine-learning', 'ML/AI'],
  'Deep Learning': ['Deep Learning', 'DL', 'deep-learning'],
  'AI': ['AI', 'Artificial Intelligence', 'A.I.', 'artificial-intelligence'],
  'Data Science': ['Data Science', 'DS', 'data-science'],
  'TensorFlow': ['TensorFlow', 'TF', 'tf', 'tensor'],
  'PyTorch': ['PyTorch', 'torch', 'py-torch'],
  'Keras': ['Keras'],
  'Pandas': ['Pandas', 'pd', 'pandas-data'],
  'NumPy': ['NumPy', 'numpy', 'np', 'num-py'],
  'Matplotlib': ['Matplotlib', 'matplotlib', 'plotting'],
  'Seaborn': ['Seaborn', 'sns'],
  'Scikit-learn': ['Scikit-learn', 'sklearn', 'scikit'],
  'Jupyter': ['Jupyter', 'Jupyter Notebook', 'IPython'],
  'Linux': ['Linux', 'GNU/Linux', 'unix-like'],
  'Unix': ['Unix', 'UNIX'],
  'Bash': ['Bash', 'Shell Script', 'Shell', 'scripting'],
  'Shell': ['Shell', 'Bash', 'zsh', 'terminal'],
  'Git': ['Git', 'git', 'version control'],
  'GitHub': ['GitHub', 'github', 'git-hub'],
  'GitLab': ['GitLab', 'gitlab', 'git-lab'],
  'Bitbucket': ['Bitbucket', 'bitbucket'],
  'CSS': ['CSS', 'Cascading Style Sheets', 'Stylesheets'],
  'HTML': ['HTML', 'HyperText Markup Language'],
  'SASS': ['SASS', 'Sass', 'SCSS', 'scss'],
  'LESS': ['LESS', 'Less'],
  'Tailwind': ['Tailwind', 'Tailwind CSS', 'TailwindCSS'],
  'Bootstrap': ['Bootstrap', 'Twitter Bootstrap'],
  'Material-UI': ['Material-UI', 'MUI', 'Material UI'],
  'Ant Design': ['Ant Design', 'AntD', 'ant-design'],
  'Chakra': ['Chakra', 'Chakra UI'],
  'Webpack': ['Webpack', 'webpack'],
  'Vite': ['Vite', 'vite'],
  'Babel': ['Babel', 'babel'],
  'Jest': ['Jest', 'jest'],
  'Mocha': ['Mocha', 'mocha'],
  'Chai': ['Chai', 'chai'],
  'Cypress': ['Cypress', 'cypress', 'cypress-io'],
  'Playwright': ['Playwright', 'playwright'],
  'Selenium': ['Selenium', 'selenium'],
  'JIRA': ['JIRA', 'Jira', 'jira'],
  'Confluence': ['Confluence', 'confluence'],
  'JUnit': ['JUnit', 'junit'],
  'TestNG': ['TestNG', 'testng'],
  'NUnit': ['NUnit', 'nunit'],
  'pytest': ['pytest', 'py-test']
}

// ============================================================================
// FUNCTIONS
// ============================================================================

export interface TaggedJob {
  filterTags: string[]
  parsedExperienceYears: number | null
  extractedSkills: string[]
}

/**
 * Tag a job description with all filters
 *
 * @param descriptionText - The plain text job description
 * @returns Object with filter tags, parsed experience, and extracted skills
 */
export function tagJobDescription(descriptionText: string): TaggedJob {
  const filterTags: string[] = []
  let parsedExperienceYears: number | null = null
  const extractedSkills: string[] = []

  const text = descriptionText.toLowerCase()

  // Check each filter definition
  for (const [tag, config] of Object.entries(FILTER_DEFINITIONS)) {
    if (config.action !== 'tag') continue

    // Check if any match phrases exist
    const hasMatch = config.match_any.some(phrase => text.includes(phrase.toLowerCase()))

    if (hasMatch) {
      // Check exclusions
      if (config.exclude_if_also_contains) {
        const hasExclusion = config.exclude_if_also_contains.some(phrase =>
          text.includes(phrase.toLowerCase())
        )
        if (!hasExclusion) {
          filterTags.push(tag)
        }
      } else {
        filterTags.push(tag)
      }
    }
  }

  // Parse experience years
  for (const pattern of EXPERIENCE_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      // For range patterns, use the minimum
      if (match[2]) {
        parsedExperienceYears = parseInt(match[1])
      } else {
        parsedExperienceYears = parseInt(match[1])
      }
      break
    }
  }

  // Extract skills from job description
  const skillKeys = Object.keys(SKILL_SYNONYMS)
  for (const skill of skillKeys) {
    const synonyms = SKILL_SYNONYMS[skill]
    for (const synonym of synonyms) {
      // Escape special regex characters in the synonym name
      const escapedSynonym = synonym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Use word boundary matching to avoid partial matches
      const regex = new RegExp(`\\b${escapedSynonym.toLowerCase()}\\b`, 'i')
      if (regex.test(text)) {
        if (!extractedSkills.includes(skill)) {
          extractedSkills.push(skill)
        }
        break
      }
    }
  }

  return {
    filterTags,
    parsedExperienceYears,
    extractedSkills
  }
}

/**
 * Normalize a skill name to its canonical form
 *
 * @param skill - The skill name to normalize
 * @returns The canonical skill name, or the original if not found
 */
export function normalizeSkill(skill: string): string {
  const lowerSkill = skill.toLowerCase()

  for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    if (synonyms.some(s => s.toLowerCase() === lowerSkill)) {
      return canonical
    }
  }

  return skill
}

/**
 * Calculate match score between user skills and job requirements
 *
 * @param userSkills - Array of user's skills
 * @param jobSkills - Array of job's required skills
 * @param userProfile - User's profile (experience, preferences)
 * @param job - Job object with parsed data
 * @returns Match score 0-100 with breakdown
 */
export function calculateMatchScore(
  userSkills: string[],
  jobSkills: string[],
  userProfile: {
    experience_years?: number;
    job_titles?: string[];
    remote_preference?: string;
    preferred_states?: string[];
    preferred_cities?: string[];
    min_salary?: number | null;
  },
  job: { parsed_experience_years?: number; location?: string; remote_type?: string; title?: string }
): { score: number; breakdown: { skills: number; experience: number; location: number; title: number; salary: number }; gate_failed: 'skills' | 'title' | null } {
  // Normalize both skill sets
  const normalizedUserSkills = userSkills.map(s => normalizeSkill(s).toLowerCase())
  const normalizedJobSkills = jobSkills.map(s => normalizeSkill(s).toLowerCase())
  const uniqueJobSkills = [...new Set(normalizedJobSkills)]

  // Calculate skill match (50% weight)
  const matchedSkills = uniqueJobSkills.filter(s => normalizedUserSkills.includes(s.toLowerCase()))
  const skillScore = uniqueJobSkills.length > 0
    ? (matchedSkills.length / uniqueJobSkills.length) * 50
    : 0

  // Calculate skill percentage for gate-pass check
  const skillPercentage = uniqueJobSkills.length > 0
    ? (matchedSkills.length / uniqueJobSkills.length) * 100
    : 0

  // Calculate experience match (20% weight)
  let experienceScore = 20 // Default full points if no requirements
  if (job.parsed_experience_years && userProfile.experience_years !== undefined) {
    if (userProfile.experience_years >= job.parsed_experience_years) {
      experienceScore = 20
    } else {
      // Partial credit based on how close they are
      const ratio = userProfile.experience_years / job.parsed_experience_years
      experienceScore = Math.round(ratio * 20)
    }
  }

  // Location match (10% weight) - full implementation
  let locationScore = 10 // Default neutral score

  if (userProfile.location && job.location) {
    // User wants remote and job is remote → perfect match
    if (userProfile.location === 'remote' && job.remote_type === 'remote') {
      locationScore = 10
    }
    // User has specific location preferences
    else if (userProfile.preferred_states && userProfile.preferred_states.length > 0) {
      // Check if job location matches user's preferred states
      const jobLocation = (job.location || '').toLowerCase()
      const preferredStates = userProfile.preferred_states.map(s => s.toLowerCase())

      for (const state of preferredStates) {
        if (jobLocation.includes(state)) {
          locationScore = 10
          break
        }
      }
    }
    // If job location is in user's preferred cities
    else if (userProfile.preferred_cities && userProfile.preferred_cities.length > 0) {
      const jobLocation = (job.location || '').toLowerCase()
      const preferredCities = userProfile.preferred_cities.map(c => c.toLowerCase())

      for (const city of preferredCities) {
        if (jobLocation.includes(city)) {
          locationScore = 10
          break
        }
      }
    }
    // If no match but job is remote and user is open to remote
    else if (userProfile.remote_preference === 'any' && job.remote_type === 'remote') {
      locationScore = 8 // Give partial credit for remote jobs when user is flexible
    }
  }

  // Title match (10% weight) - use actual title matching
  let titleScore = 10 // Default neutral score
  if (job.title && userProfile.job_titles && userProfile.job_titles.length > 0) {
    const titleMatch = calculateTitleMatchScore(userProfile.job_titles, job.title)
    titleScore = titleMatch.score
  }

  // Salary match (10% weight) - full implementation
  let salaryScore = 10 // Default neutral score
  if (userProfile.min_salary && job.salary_max) {
    if (job.salary_max >= userProfile.min_salary) {
      salaryScore = 10
    } else {
      // Partial credit based on how close they are
      const ratio = userProfile.min_salary / job.salary_max
      salaryScore = Math.round(ratio * 10)
    }
  } else if (userProfile.min_salary && !job.salary_max) {
    // Job has no salary info but user has a minimum
    salaryScore = 5 // Neutral/partial
  }

  // Calculate base score
  let baseScore = Math.round(skillScore + experienceScore + locationScore + titleScore + salaryScore)
  baseScore = Math.min(100, Math.max(0, baseScore))

  // GATE-PASS CHECK
  let gateFailed: 'skills' | 'title' | null = null
  let finalScore = baseScore

  // Gate 1: Skills (40% threshold)
  // If user has less than 40% of required skills, cap at 35%
  if (skillPercentage < 40) {
    finalScore = Math.min(35, baseScore)
    gateFailed = 'skills'
  }
  // Gate 2: Title (30% threshold = 3 out of 10 points)
  // If title match is very poor, cap at 40%
  else if (titleScore < 3) {
    finalScore = Math.min(40, baseScore)
    gateFailed = 'title'
  }

  return {
    score: finalScore,
    breakdown: {
      skills: Math.round(skillScore),
      experience: experienceScore,
      location: locationScore,
      title: titleScore,
      salary: salaryScore
    },
    gate_failed: gateFailed
  }
}
