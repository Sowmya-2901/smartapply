/**
 * Synonym Filter Engine
 *
 * Tags job descriptions with standardized filter labels at ingestion time.
 * This runs ONCE per job when it's first ingested, not at query time.
 */

// ============================================================================
// FILTER DEFINITIONS
// ============================================================================

export const FILTER_DEFINITIONS = {
  /**
   * Phrases indicating US citizenship/clearance requirements
   * Tag: 'requires_us_citizenship'
   */
  requires_us_citizenship: {
    action: 'tag',
    match_any: [
      'us citizen',
      'u.s. citizen',
      'united states citizen',
      'security clearance',
      'clearance required',
      'TS/SCI',
      'TS SCI',
      'top secret',
      'secret clearance',
      'no international students',
      'without sponsorship',
      'no visa sponsorship',
      'will not sponsor',
      'cannot sponsor',
      'does not sponsor',
      'unable to sponsor',
      'not sponsor',
      'us persons only',
      'u.s. persons',
      'ITAR',
      'EAR',
      'ITAR restricted',
      'permanent work authorization',
      'authorized to work in the united states',
      'must be authorized to work',
      'legally authorized to work',
      'work authorization required',
      'no opt',
      'no cpt',
      'no ead',
      'green card required',
      'permanent resident',
      'us citizenship required',
      'must be us citizen',
      'require us citizenship',
      'citizenship required'
    ]
  },

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
   * Phrases indicating new grad/entry level
   * Tag: 'new_grad_job'
   */
  new_grad_job: {
    action: 'tag',
    match_any: [
      'new grad',
      'new graduate',
      'recent graduate',
      'entry level',
      'entry-level',
      '0-1 years',
      '0-2 years',
      'no experience required',
      'junior level',
      'university hire',
      'campus hire',
      'rotational program',
      'early career',
      'early-career',
      'recent college graduate',
      'rcg',
      'associate engineer',
      'internship',
      'apprenticeship'
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
  'Python': ['Python', 'Py'],
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
  'pytest': ['pytest', 'py-test'],
  'JUnit': ['JUnit', 'junit', 'unit testing']
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
      // Use word boundary matching to avoid partial matches
      const regex = new RegExp(`\\b${synonym.toLowerCase()}\\b`, 'i')
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
  userProfile: { experience_years?: number },
  job: { parsed_experience_years?: number; location?: string; remote_type?: string; title?: string }
): { score: number; breakdown: { skills: number; experience: number; location: number; title: number } } {
  // Normalize both skill sets
  const normalizedUserSkills = userSkills.map(s => normalizeSkill(s).toLowerCase())
  const normalizedJobSkills = jobSkills.map(s => normalizeSkill(s).toLowerCase())
  const uniqueJobSkills = [...new Set(normalizedJobSkills)]

  // Calculate skill match (50% weight)
  const matchedSkills = uniqueJobSkills.filter(s => normalizedUserSkills.includes(s.toLowerCase()))
  const skillScore = uniqueJobSkills.length > 0
    ? (matchedSkills.length / uniqueJobSkills.length) * 50
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

  // Location match (10% weight) - simplified for now
  const locationScore = 10 // Assume match for now

  // Title match (10% weight) - simplified for now
  const titleScore = 10 // Assume match for now

  // Salary match (10% weight) - simplified for now
  const salaryScore = 10 // Assume match for now

  const totalScore = Math.round(skillScore + experienceScore + locationScore + titleScore + salaryScore)

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    breakdown: {
      skills: Math.round(skillScore),
      experience: experienceScore,
      location: locationScore,
      title: titleScore
    }
  }
}
