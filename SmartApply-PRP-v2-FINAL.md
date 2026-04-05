# SmartApply — Final Product Requirements Prompt (PRP) v2

## Product Overview

**Name:** SmartApply
**Tagline:** "Your AI co-pilot for landing tech jobs — smarter applications, not more applications."
**One-sentence idea:** A web app that finds software engineering jobs from real companies, AI-tailors your resume for each job description using your custom rules, and helps you apply faster — without the spam, staffing agencies, or account bans.

---

## Target Audience

- Software engineers and tech workers actively job searching
- Experience levels: Junior to Senior (user sets their own level)
- One account can search for MULTIPLE job roles (e.g., Backend Engineer + Fullstack + Platform Engineer) — the AI tailors the same base resume differently for each role
- Primary market: United States (remote + onsite)
- Pain points:
  - Drowning in job listings from staffing agencies and recruiters
  - Spending 30+ minutes per application customizing resumes
  - Applying to jobs that don't match their skills
  - Losing track of what they applied to and which resume version they used
  - Getting rejected by ATS systems because resumes aren't keyword-optimized
  - Seeing contract/staffing jobs mixed with real full-time positions
  - Missing freshly posted jobs because platforms bury them under promoted listings

---

## Core Product Philosophy

**Co-Pilot Mode:** The app does the heavy lifting (finding jobs, scoring matches, tailoring resumes, auto-filling forms) but the USER stays in control. The user reviews every job, reviews every tailored resume, and clicks submit themselves. This is NOT an auto-apply bot. Quality over quantity.

**Key differentiators:**
1. Resume tailoring quality — deep AI optimization with user-defined custom rules, not shallow keyword stuffing
2. Only real companies — staffing agencies filtered out automatically
3. Smart filtering — understands that "no visa sponsorship" and "US citizens only" and "clearance required" all mean the same thing
4. Freshest jobs first — polls every 2 hours, shows jobs minutes/hours after posting
5. Two-step resume system — master optimization once, then per-JD tailoring every time

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | **Next.js 14+ (React)** with App Router | Best for SEO, fast, Claude Code knows it well |
| Styling | **Tailwind CSS** | Rapid UI development, modern look |
| Auth and Database | **Supabase** (PostgreSQL + Auth) | Free tier, handles login + data, real-time capable |
| AI/LLM | **OpenAI GPT-4o-mini API** | Cheapest option for resume tailoring (~$0.01-0.03/call) |
| Hosting | **Vercel** | Free tier, deploys Next.js perfectly, auto-scaling |
| Job Data | **Greenhouse, Lever, Ashby public APIs** (free) | Covers 60-70% of tech company jobs at zero cost |
| Chrome Extension | **Manifest V3** | For auto-filling career page forms (Phase 2) |
| File Generation | **docx library** (like docx.js or python-docx) | For generating tailored resume files |

---

## Design Direction

- **Vibe:** Modern, posh, easy to use. Premium feel without being corporate.
- **Color palette:** Dark navy (#0F172A) primary, soft gradient accents (blue-purple), clean white cards, subtle shadows. Think Vercel meets Linear.
- **Typography:** Clean, modern sans-serif. NOT generic — use something distinctive like Satoshi or General Sans for headings, clean system font for body text.
- **Layout:** Spacious, generous whitespace, cards with subtle hover effects, smooth transitions.
- **Key principle:** Every screen should feel like it has ONE clear action. No clutter, no overwhelm.

---

## User Journey and Screens

### Screen 1: Landing Page (Public — no login needed)
- Hero section: "Stop spraying resumes. Start landing interviews."
- Explain the 3-step value prop: Find, Tailor, Apply
- Show that jobs come from real companies only (Stripe, Spotify, Airbnb logos as examples)
- Highlight: "No staffing agencies. No ghost jobs. Only real companies."
- CTA: "Get Started Free"
- Pricing: Free for now (no pricing section needed yet)

### Screen 2: Sign Up / Login
- Supabase Auth: Email + password, Google OAuth, GitHub OAuth
- Keep it simple — one-page sign up
- After signup redirect to onboarding

### Screen 3: Onboarding (First-time setup)

**Step 1 — Upload Resume**
- Drag-and-drop or click to upload ONE base resume (.docx or .pdf)
- App parses and extracts: name, email, phone, skills, experience, education
- Show parsed preview: "We found these details — look correct?"
- This is the RAW base resume — it will be optimized in the next step

**Step 2 — Resume Optimization Rules**
This is a critical differentiator. User sets rules that the AI follows EVERY time.

Pre-filled default rules (user can edit/add/remove):

FORMATTING RULES (defaults):
- Never change the original formatting, fonts, colors, or spacing
- Keep resume to 2 pages maximum
- Skills section must be plain text (never use tables)
- Use standard section headings (Summary, Experience, Skills, Education, Projects)
- No unicode bullets or special characters

CONTENT RULES (defaults):
- Add missing JD skills to the Skills section
- Write new bullet points for missing skills under relevant experience/projects
- Every bullet must have: Action verb + What you did + How + Result with numbers
- Use varied bullet patterns (never start 3+ bullets the same way)
- Add approximate metrics where exact numbers aren't available, marked with (~)
- Never remove existing bullet points from the original resume
- Never change job titles, company names, dates, GPA, or degrees
- Never invent companies or certifications

BANNED WORDS (defaults):
passionate, synergy, leverage (as noun), spearheaded, guru, ninja, rockstar, innovative, dynamic, detail-oriented, results-driven, team player, cutting-edge, utilized, leveraged, robust, scalable solutions, best practices

CUSTOM RULES (empty — user adds their own):
Free text area where user types any additional instructions.
Examples:
- "Always keep my summary under 4 lines"
- "Emphasize my AWS experience in every resume"
- "Never mention my first job at XYZ Corp"
- "Always list Python before Java in skills"
- "For skills I don't have, frame as exposure/project level"
- "Add relevant skills to Projects section as well"

**Step 3 — Master Resume Optimization**
After rules are saved, the app runs the FIRST optimization:
- Sends raw base resume + all rules to GPT-4o-mini
- GPT checks the resume against all rules and optimizes it:
  - Fixes formatting issues
  - Improves weak bullet points (adds metrics, active verbs)
  - Removes banned words
  - Ensures ATS compatibility
  - Applies all custom rules
- Shows side-by-side: Original (left) vs Optimized (right)
- User reviews, can edit anything
- User saves this as the "Master Optimized Resume"
- This master version is used as the BASE for all future per-job tailoring

**Step 4 — Job Search Preferences**
All of these should be editable anytime from Settings:
- Job titles (multiple): e.g., "Backend Engineer", "SDE II", "Platform Engineer", "Fullstack Developer"
- Locations: specific cities or "Remote"
- Remote / Hybrid / Onsite toggle
- Salary range: minimum expected (slider)
- Experience level: number of years (e.g., "3 years" — app searches for jobs requiring this or less)
- Seniority: Junior / Mid / Senior / Staff / Principal
- "No New Grad positions" toggle (on/off, default on)
- "No Contract/Temp jobs" toggle (on/off, default on — hides contract positions)
- Visa sponsorship required: Yes / No
- US Citizen only positions: Show / Hide
- Exclude companies: text field to add company names to blocklist
- Company size preference: Startups (1-50) / Mid-size (51-500) / Large (500+) / Show all
- Job freshness preference: Last 4 hours / Today / Last 3 days / This week / All

**Step 5 — Auto-fill Profile (for career page forms in Phase 2)**
- Full name, email, phone
- LinkedIn URL, GitHub URL, Portfolio URL
- Current/expected salary
- Work authorization status
- Willingness to relocate: Yes / No
- Notice period: Immediate / 2 weeks / 1 month / Other

**Step 6 — Answer Bank (for screening questions in Phase 2)**
Pre-saved answers to common application questions:

Technical experience answers:
- Years of Python experience: [number]
- Years of Java experience: [number]
- Years of JavaScript/React experience: [number]
- Years of AWS/Cloud experience: [number]
- (user can add more skill-year pairs)

Standard screening answers:
- Willing to undergo background check: Yes/No
- Willing to take drug test: Yes/No
- Have you worked for this company before: Yes/No
- How did you hear about this position: [text]
- Available start date: [text]

Template answers (editable per application):
- "Why are you interested in this role?": [template text with placeholders]
- "Why this company?": [template text]
- "Describe a challenging project": [pre-written story]
- "What are your strengths?": [pre-written answer]
- (user can add more Q&A pairs)

**Step 7 — Done!**
- "Your co-pilot is ready! Let's find your next job."
- Redirect to Job Dashboard

### Screen 4: Job Dashboard (Main Screen — after login)

**Layout:**
- Top nav bar: SmartApply logo, search bar, notification bell, profile icon
- Stats bar below nav: New Matches count, Applied count, Saved count, Average Match Score
- Left sidebar: Navigation (Jobs, Resumes, Tracker, Saved, Rules, Settings)
- Main area: Job feed — scrollable list of job cards sorted by match score and recency

**Each job card shows:**
- Match score percentage with color coding (90%+ green, 70-89% blue, 60-69% yellow)
- Job title, company name, location
- Salary range (if available from API)
- Company size (employee count if known)
- Key matching skills as tags (green = you have it, orange = adjacent, gray = missing)
- Verification badge: "Real company" with source (Greenhouse/Lever/Ashby)
- Job freshness: "Posted 2 hours ago", "Posted yesterday", etc.
- Employment type badge: "Full-time" (contract jobs hidden by default)
- 3 action buttons: View JD, Optimize Resume, Apply
- Save/bookmark heart button

**IMPORTANT: Only show jobs with 60%+ match score.** Jobs below 60% match are not shown unless user explicitly changes the threshold in filters.

**Filtering and Sorting:**
- Filter by match score threshold (90%+, 80%+, 70%+, 60%+ default, All)
- Filter by freshness: Last 4 hours, Today, Last 3 days, This week, All
- Filter by location, remote/onsite, salary range
- Sort by: Best match (default), Newest first, Salary (highest first)
- Search bar for keyword search within results
- Toggle: Show/hide contract jobs (hidden by default)
- Toggle: Show/hide staffing agency jobs (hidden by default)

### Screen 5: Job Detail Page
When user clicks "View JD" on a job card:
- Full job description displayed cleanly (parsed from HTML to readable format)
- Side panel showing:
  - Match score with detailed breakdown
  - Skills analysis:
    - Green: "Skills you have: Python, AWS, Kafka" (matched directly)
    - Blue: "Adjacent skills: PySpark (you have Spark)" (close match)
    - Red: "Skills to add: Kubernetes, Terraform" (will be added during optimization)
  - Experience match: "JD requires 5+ years, you have 5 years — Match"
  - Detected filters: "Full-time", "Remote", "No visa sponsorship mentioned"
  - Company info: name, size, industry, website link, ATS source
  - Posted: "2 hours ago" with exact date
- Big CTA buttons: Optimize Resume for This Job, Save, Apply Direct
- Link to company career page

### Screen 6: Resume Optimizer
When user clicks "Optimize Resume" for a specific job:

**What happens behind the scenes (Two-Step System):**

The master optimized resume (from onboarding Step 3) is used as the base — NOT the raw original.

GPT-4o-mini receives:
1. SYSTEM PROMPT: All user's resume rules (formatting rules + content rules + banned words + custom rules) — loaded from database every time, never forgotten
2. USER PROMPT: "Here is my master resume: [text]. Here is the job description: [full JD text]. Optimize this resume for this specific job. Add ALL missing skills from the JD to the Skills section. Write new bullet points for missing skills under the most relevant experience or project section. Adjust existing bullets to use JD keywords naturally. Follow every rule in the system prompt exactly."

GPT performs:
1. Identifies ALL skills in JD that are missing from resume
2. Adds missing skills to the Skills section
3. Writes new bullet points for missing skills (framed according to user's rules — could be project-level, exposure-level, or full experience depending on what rules the user set)
4. Adjusts existing bullet wording to use JD-specific keywords
5. Ensures the summary/profile section reflects this role
6. Follows all formatting rules (no layout changes)
7. Follows all banned words
8. Follows all custom rules
9. Returns the per-JD tailored resume

**What the user sees:**
- Loading state: "Tailoring your resume for [Job Title] at [Company]..."
- Side-by-side comparison: Master Resume (left) vs JD-Tailored Resume (right)
- Changes highlighted in color:
  - Green = new content added (new skills, new bullets)
  - Yellow = existing content modified (reworded for JD keywords)
  - Unchanged text = normal color
- Summary of changes at top:
  - "Added 4 skills to Skills section: Kubernetes, Terraform, gRPC, Redis"
  - "Added 3 new bullet points under Experience"
  - "Modified 2 existing bullets to use JD keywords"
  - "ATS keyword match: 14/16 top JD keywords present"
- Edit capability: user can click on any section and manually edit
- Download buttons: Download .docx, Download .pdf
- "Apply with this resume" button

**CRITICAL: The .docx output must preserve the master resume's formatting.** The AI only changes TEXT content — fonts, colors, spacing, margins, layout remain identical to the master. The app should use the master .docx file as a template and replace/add text content only.

### Screen 7: Application Tracker
Shows history of all applications in a table/list view:

Columns: Date Applied, Company, Role, Match Score, Status, Resume Used, Notes, Actions

For each application stored in database:
- Company name and logo (if available)
- Job title
- Match score at time of application
- Full JD snapshot (saved at time of application — persists even if posting is removed)
- Resume version used (the specific per-JD tailored version, downloadable as .docx/.pdf)
- Date applied
- Status: Saved, Applied, Phone Screen, Interview, Offer, Accepted, Rejected, Withdrawn
- Notes field (user can add personal notes)
- Link to original job posting
- Follow-up reminder date (optional)

Status updates: User manually updates. Each change timestamped. Visual pipeline showing count per stage.

Filter tracker by: Status, Company, Date range, Role type
Sort by: Date (newest first), Company, Status

### Screen 8: My Resumes
Three sections:
1. **Raw Base Resume** — the original uploaded file, stored permanently
2. **Master Optimized Resume** — the rules-optimized version, can be re-generated anytime if rules change
3. **Per-Job Tailored Resumes** — list of every tailored version with: which job it was tailored for, company name, date created, download links (.docx and .pdf)

User can:
- Upload a new base resume (replaces the current one, old one stays in history)
- Re-run master optimization (if they changed their rules)
- View/download any past tailored version
- Version history: never auto-delete old versions

### Screen 9: Resume Rules
Dedicated page for managing all resume optimization rules (also accessible during onboarding):

Sections:
- Formatting Rules (checkboxes + text)
- Content Rules (checkboxes + text)
- Banned Words (tag-style input — add/remove words)
- Custom Rules (free text area)
- "Test Rules" button — re-runs master optimization with current rules to preview changes
- Save Rules button

When rules are saved, show a prompt: "Rules updated! Your master resume should be re-optimized. Re-optimize now?"

### Screen 10: Settings and Profile
Organized in tabs:
- **Job Preferences:** All filters (titles, location, experience, salary, seniority, no new grad, no contract, visa, citizenship, exclude companies, company size, freshness)
- **Auto-fill Profile:** Personal info for form filling
- **Answer Bank:** Screening question answers and template responses
- **Account:** Email, password, delete account
- **Notifications:** Email alerts for new high-match jobs (future feature)

Everything editable anytime. Changes take effect immediately for future job searches.

---

## Job Data Pipeline (Backend)

### Data Sources (all free)

**Primary — ATS Public APIs (polled every 2 hours):**
- Greenhouse: GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
- Lever: GET https://api.lever.co/v0/postings/{company_slug}?mode=json
- Ashby: GET https://api.ashbyhq.com/posting-api/job-board/{clientname}?includeCompensation=true

**Secondary — Free job sources (polled every 4-6 hours):**
- RemoteOK: GET https://remoteok.com/api (free, no key needed)
- The Muse API: Free with API key
- Hacker News Who Is Hiring: Via Algolia API (free)
- We Work Remotely: RSS feed (free)

### Job Polling Schedule

```
Every 2 hours — Vercel Cron or Supabase Edge Function triggers:
1. Loop through ALL companies in the companies table
2. For each company, call the appropriate ATS API
3. For each job returned:
   a. Check if job already exists in database (by external_id)
   b. If new job:
      - Parse all fields (title, description, location, salary, etc.)
      - Run JD through the Synonym Filter Engine (see below)
      - Run staffing agency detection
      - Extract skills from JD
      - Calculate freshness timestamp
      - Store in jobs table with discovered_at = NOW()
   c. If existing job:
      - Update any changed fields
      - Keep original discovered_at timestamp
   d. If previously seen job is NO LONGER in API response:
      - Mark as is_active = false (job was filled/removed)
4. Log poll results: "Found 47 new jobs, updated 12, removed 8"
```

**Volume estimate for 500 companies polled every 2 hours:**
- 1,500 API calls per poll cycle (500 x 3 ATS platforms)
- 18,000 API calls per day
- Each call returns JSON in under 1 second
- Total data transfer: minimal (job listings are small JSON objects)
- This is well within free tier limits for all three ATS platforms

### Synonym Filter Engine (Smart Filtering)

When a new job is ingested, scan the JD text against a synonym dictionary to tag it with standardized filter labels. This runs ONCE per job at ingestion time, not at query time.

**The synonym dictionary structure:**

```
FILTER_DEFINITIONS = {
  
  "requires_us_citizenship": {
    "action": "tag",
    "match_any": [
      "us citizen", "u.s. citizen", "united states citizen",
      "security clearance", "clearance required", "TS/SCI",
      "TS SCI", "top secret", "secret clearance",
      "no international students",
      "without sponsorship", "no visa sponsorship",
      "will not sponsor", "cannot sponsor", "does not sponsor",
      "unable to sponsor", "not sponsor",
      "us persons only", "u.s. persons",
      "ITAR", "EAR", "ITAR restricted",
      "permanent work authorization",
      "authorized to work in the united states",
      "must be authorized to work",
      "legally authorized to work",
      "work authorization required",
      "no OPT", "no CPT", "no EAD",
      "green card required", "permanent resident"
    ]
  },

  "contract_job": {
    "action": "tag",
    "match_any": [
      "contract position", "contract role", "contract-to-hire",
      "contract to hire", "C2H", "CTH", "temp to perm",
      "temporary position", "6 month contract", "12 month contract",
      "1099", "W2/C2C", "W2 or C2C", "corp to corp", "C2C",
      "contract only", "contract basis",
      "temp position", "temporary role",
      "staff augmentation", "SOW based"
    ],
    "exclude_if_also_contains": [
      "full-time", "full time", "permanent", "FTE", "direct hire"
    ]
  },

  "new_grad_job": {
    "action": "tag",
    "match_any": [
      "new grad", "new graduate", "recent graduate",
      "entry level", "entry-level", "0-1 years",
      "0-2 years", "no experience required",
      "fresh graduate", "junior level",
      "university hire", "campus hire",
      "associate engineer", "rotational program",
      "early career", "early-career"
    ]
  },

  "remote_job": {
    "action": "tag",
    "match_any": [
      "remote", "work from home", "WFH",
      "distributed team", "location flexible",
      "work from anywhere", "fully remote", "100% remote",
      "remote-first", "remote first",
      "anywhere in the US", "US remote"
    ]
  },

  "hybrid_job": {
    "action": "tag",
    "match_any": [
      "hybrid", "2 days in office", "3 days in office",
      "partial remote", "flexible location",
      "2 days onsite", "3 days onsite",
      "in-office and remote", "mix of remote"
    ]
  },

  "employment_type_fulltime": {
    "action": "tag",
    "match_any": [
      "full-time", "full time", "FTE", "permanent",
      "direct hire", "permanent position",
      "salaried position", "regular full-time"
    ]
  }
}
```

**Experience level parsing (special logic):**

Scan JD for experience requirement patterns:
- Regex: (\d+)\+?\s*years? → extract number
- "5+ years of experience" → required_years = 5
- "3-5 years" → required_years = 3 (use minimum)
- "minimum 7 years" → required_years = 7
- "senior" or "Sr." in title → infer 5+ years
- "staff" or "principal" in title → infer 8+ years
- "junior" or "Jr." in title → infer 0-2 years
- "mid-level" or "II" in title → infer 2-5 years
- "lead" in title → infer 6+ years

Store parsed experience requirement in the jobs table.

**Skills synonym dictionary (for matching user skills to JD skills):**

```
SKILL_SYNONYMS = {
  "Python": ["Python", "Python3", "Python 3", "Python 3.x", "CPython"],
  "JavaScript": ["JavaScript", "JS", "ES6", "ES2015", "ECMAScript"],
  "TypeScript": ["TypeScript", "TS"],
  "React": ["React", "React.js", "ReactJS", "React JS"],
  "Node.js": ["Node.js", "Node", "NodeJS"],
  "AWS": ["AWS", "Amazon Web Services"],
  "GCP": ["GCP", "Google Cloud", "Google Cloud Platform"],
  "Azure": ["Azure", "Microsoft Azure"],
  "Kubernetes": ["Kubernetes", "K8s", "k8s"],
  "Docker": ["Docker", "Containerization", "containers"],
  "PostgreSQL": ["PostgreSQL", "Postgres", "psql"],
  "MongoDB": ["MongoDB", "Mongo"],
  "Redis": ["Redis", "Redis cache"],
  "Kafka": ["Kafka", "Apache Kafka", "event streaming"],
  "Spring Boot": ["Spring Boot", "SpringBoot", "Spring Framework", "Spring"],
  "CI/CD": ["CI/CD", "CICD", "continuous integration", "continuous delivery",
             "Jenkins", "GitHub Actions", "GitLab CI", "CircleCI"],
  "GraphQL": ["GraphQL", "GQL"],
  "REST": ["REST", "RESTful", "REST API", "RESTful API"],
  "SQL": ["SQL", "MySQL", "SQL Server", "MSSQL", "T-SQL"],
  "Terraform": ["Terraform", "TF", "IaC", "Infrastructure as Code"],
  "Go": ["Go", "Golang"],
  "Rust": ["Rust", "Rust lang"],
  "Java": ["Java", "J2EE", "JDK", "JVM"],
  "C++": ["C++", "CPP"],
  "Spark": ["Spark", "Apache Spark", "PySpark"],
  "Hadoop": ["Hadoop", "HDFS", "MapReduce"],
  "Elasticsearch": ["Elasticsearch", "Elastic", "ELK", "Elastic Stack"],
  "RabbitMQ": ["RabbitMQ", "AMQP"],
  "gRPC": ["gRPC", "protobuf", "Protocol Buffers"],
  "Microservices": ["microservices", "micro-services", "microservice architecture"],
  "Agile": ["Agile", "Scrum", "Kanban", "Sprint"],
  "Machine Learning": ["Machine Learning", "ML", "deep learning", "DL"],
  "TensorFlow": ["TensorFlow", "TF", "tf.keras"],
  "PyTorch": ["PyTorch", "torch"]
}
```

This dictionary should be stored as a JSON config file and be expandable. Start with ~200 tech skill synonyms covering the most common ones. New synonyms can be added as you discover gaps.

**How filtering works at query time:**

```
User opens dashboard:
1. Query jobs table WHERE:
   - is_active = true
   - is_staffing_agency = false (unless user toggled to show)
   - match_score >= 60 (user's threshold)
   - NOT tagged "contract_job" (unless user toggled to show)
   - NOT tagged "new_grad_job" (if user has "no new grad" on)
   - NOT tagged "requires_us_citizenship" (if user needs visa sponsorship)
   - matches user's location preferences
   - matches user's remote/hybrid/onsite preference
   - parsed_experience_years <= user's experience years
   - salary_min >= user's minimum salary (if both available)
2. ORDER BY: discovered_at DESC, match_score DESC
3. LIMIT 20 (paginated, infinite scroll)
```

---

## Match Scoring Algorithm

For each job, calculate a match score (0-100%) against the user's parsed resume skills:

```
MATCH SCORE CALCULATION:

1. Extract required skills from JD (using skill_synonyms dictionary)
   Example JD mentions: Python, AWS, Kafka, Kubernetes, PostgreSQL, React
   → 6 required skills

2. Compare against user's resume skills (also normalized via synonyms)
   User has: Python, AWS, Kafka, PostgreSQL, Java, Spring Boot
   
3. Count matches:
   - Python → Match (direct)
   - AWS → Match (direct)
   - Kafka → Match (direct)
   - Kubernetes → No match
   - PostgreSQL → Match (direct)
   - React → No match
   
   4 out of 6 skills matched = 67% skill match

4. Calculate weighted total:
   - Skill match (50% weight): 67% → contributes 33.5 points
   - Experience level match (20% weight): 
     JD wants 5+ years, user has 5 → 100% → contributes 20 points
   - Location match (10% weight):
     JD is Remote, user wants Remote → 100% → contributes 10 points
   - Title match (10% weight):
     JD title "Backend Engineer", user searches "Backend Engineer" → 100% → 10 points
   - Salary match (10% weight):
     JD offers $180K, user minimum $160K → within range → 100% → 10 points
   
   TOTAL: 33.5 + 20 + 10 + 10 + 10 = 83.5% match

5. Only show if score >= 60% (user's threshold)
   83.5% >= 60% → SHOW THIS JOB
```

Store the match_score in a user_job_matches junction table (since the score is different for each user-job pair).

---

## Staffing Agency Detection System

Three layers, run on every new company discovered:

**Layer 1 — Name keyword check:**
Instant flag if company name contains: Staffing, Recruiting, Recruitment, Talent Solutions, Personnel, Workforce, Placement, Temps.
Warning if contains: Solutions LLC, Consulting LLC, Technologies LLC, Group, Resources, Associates — require corroboration from Layer 2 or 3.

**Layer 2 — Known company blocklist:**
Maintain a table of ~500 known staffing companies: TEKsystems, Insight Global, Robert Half, Randstad, Adecco, Kforce, CyberCoders, Apex Systems, Infosys BPO, Wipro, TCS, Cognizant (staffing division), Accenture Federal, ManpowerGroup, Kelly Services, Hays, Michael Page, etc.

**Layer 3 — JD keyword scan:**
Flag if job description contains: "our client", "on behalf of", "W2/C2C/1099", "contract to hire" (without "full-time"), "right to represent", "bench", "hotlist", "end client", "bill rate", "corp to corp", "employer of record", "staff augmentation".

**Result:** Each company gets is_staffing_agency: true/false. Staffing agency jobs hidden by default. User can toggle in Settings to see them.

---

## Resume Optimization System (Two-Step)

### Step 1 — Master Optimization (runs once, re-runs when rules change)

**Input:**
- Raw base resume text (parsed from uploaded .docx/.pdf)
- All user's resume rules (formatting + content + banned words + custom)

**System prompt sent to GPT-4o-mini:**
```
You are an expert resume optimizer. Your job is to improve this resume 
following the rules below EXACTLY. Do not deviate from any rule.

FORMATTING RULES:
[loaded from user's saved formatting rules]

CONTENT RULES:
[loaded from user's saved content rules]

BANNED WORDS — never use these anywhere:
[loaded from user's saved banned words list]

CUSTOM RULES:
[loaded from user's saved custom rules]

Now optimize the following resume. Only change text content. 
Do not change the structure or layout. Fix weak bullets, add metrics,
use active verbs, remove banned words, ensure ATS compatibility.
Return the optimized resume text with clear section markers.
```

**Output:** Master Optimized Resume text, stored in database.

**The master .docx file:** Take the user's original .docx file as a template. Replace text content with the optimized text. Preserve all formatting (fonts, colors, spacing, margins). Store both the text and the .docx file.

### Step 2 — Per-JD Tailoring (runs every time user clicks "Optimize Resume")

**Input:**
- Master Optimized Resume text (NOT the raw original)
- The specific job description text
- All user's resume rules (loaded fresh from database every time)

**System prompt sent to GPT-4o-mini:**
```
You are an expert resume tailor. Your job is to customize this resume
for a specific job description following the rules below EXACTLY.

RULES (these NEVER change — follow them every single time):
[loaded from user's saved formatting rules]
[loaded from user's saved content rules]
[loaded from user's saved banned words list]
[loaded from user's saved custom rules]

RESUME TO TAILOR:
[master optimized resume text]

JOB DESCRIPTION:
[full JD text]

INSTRUCTIONS:
1. Identify ALL skills mentioned in the JD that are missing from the resume
2. Add every missing skill to the Skills section
3. For each missing skill, write a new bullet point under the most relevant 
   Experience or Projects section. Frame these bullets according to the 
   content rules above.
4. Adjust existing bullet points to naturally incorporate JD keywords
   where they fit (do not force keywords that make sentences sound unnatural)
5. Ensure the Summary/Profile section reflects this specific role
6. Follow ALL formatting rules — do not change fonts, spacing, or layout
7. Follow ALL banned words — never use any of them
8. Follow ALL custom rules exactly as written
9. Return the tailored resume with clear section markers

Also return a summary of changes:
- Skills added: [list]
- New bullets added: [count and brief description]
- Existing bullets modified: [count]
- ATS keyword match: [X out of Y top JD keywords now present]
```

**Output:** Per-JD tailored resume text + change summary.

**Generate .docx:** Use the master .docx as template, replace text with tailored version, preserve formatting. Also generate .pdf version.

---

## Database Schema

### companies table
```
id (uuid, primary key)
name (text, not null)
slug (text, not null) — board token for ATS API
ats_platform (text: 'greenhouse', 'lever', 'ashby', 'remoteok', 'other')
careers_url (text)
website_url (text)
employee_count (integer, nullable)
industry (text, nullable)
is_staffing_agency (boolean, default false)
staffing_detection_score (integer, default 0) — score from detection system
verified (boolean, default false)
last_polled_at (timestamp)
created_at (timestamp, default now())
updated_at (timestamp, default now())
```

### jobs table
```
id (uuid, primary key)
company_id (uuid, foreign key to companies, not null)
external_id (text, not null) — job ID from ATS API
title (text, not null)
description_html (text) — raw HTML from API
description_text (text) — cleaned plain text
location (text)
remote_type (text: 'remote', 'hybrid', 'onsite', null)
salary_min (integer, nullable)
salary_max (integer, nullable)
salary_currency (text, default 'USD')
department (text, nullable)
employment_type (text: 'full_time', 'contract', 'part_time', 'intern')
required_skills (text[], extracted from JD)
parsed_experience_years (integer, nullable) — extracted from JD
seniority_level (text, nullable)
apply_url (text, not null) — direct application link
source_api (text, not null)
filter_tags (text[]) — tags from synonym filter engine: 
  'requires_us_citizenship', 'contract_job', 'new_grad_job', 
  'remote_job', 'hybrid_job', 'fulltime_job'
is_active (boolean, default true)
posted_at (timestamp, nullable) — from API if available
discovered_at (timestamp, default now()) — when our system found it
updated_at (timestamp, default now())

INDEXES: company_id, is_active, discovered_at, filter_tags (GIN index)
UNIQUE: (company_id, external_id) — prevent duplicates
```

### profiles table
```
id (uuid, primary key, references auth.users)
full_name (text)
email (text)
phone (text)
linkedin_url (text)
github_url (text)
portfolio_url (text)
current_salary (integer, nullable)
expected_salary (integer, nullable)
work_authorization (text)
willing_to_relocate (boolean)
notice_period (text)
screening_answers (jsonb) — answer bank stored as JSON

-- Job search preferences
job_titles (text[]) — array of preferred titles
locations (text[])
remote_preference (text: 'remote', 'hybrid', 'onsite', 'any')
min_salary (integer, nullable)
experience_years (integer)
seniority_preferences (text[])
no_new_grad (boolean, default true)
no_contract (boolean, default true)
visa_sponsorship_required (boolean, default false)
us_citizen_only_filter (boolean, default false) — hide jobs requiring citizenship
excluded_companies (text[])
company_size_preference (text[]: 'startup', 'midsize', 'large')
freshness_preference (text: '4h', 'today', '3days', 'week', 'all')
match_threshold (integer, default 60) — minimum match score to show

-- Resume rules
formatting_rules (text) — user's formatting rules
content_rules (text) — user's content rules
banned_words (text[]) — array of banned words
custom_rules (text) — free text custom instructions

created_at (timestamp, default now())
updated_at (timestamp, default now())
```

### resumes table
```
id (uuid, primary key)
user_id (uuid, foreign key to profiles, not null)
type (text: 'raw_base', 'master_optimized', 'job_tailored')
job_id (uuid, foreign key to jobs, nullable) — only for job_tailored type
file_url (text) — Supabase Storage URL for .docx file
pdf_url (text) — Supabase Storage URL for .pdf file
parsed_text (text) — full text content
parsed_skills (text[]) — extracted skills array
change_summary (jsonb, nullable) — for tailored versions: skills added, bullets modified, etc.
is_current (boolean, default true) — for base/master: marks the active version
created_at (timestamp, default now())

INDEX: user_id, type, is_current
```

### applications table
```
id (uuid, primary key)
user_id (uuid, foreign key to profiles, not null)
job_id (uuid, foreign key to jobs, not null)
resume_id (uuid, foreign key to resumes, not null) — which tailored resume was used
status (text: 'saved', 'applied', 'phone_screen', 'interview', 
        'offer', 'accepted', 'rejected', 'withdrawn')
match_score_at_application (integer) — score when they applied
applied_at (timestamp)
status_updated_at (timestamp)
notes (text)
follow_up_date (date, nullable)
jd_snapshot (text, not null) — full JD text saved at application time

INDEX: user_id, status, applied_at
```

### user_job_matches table (for caching match scores per user per job)
```
user_id (uuid, foreign key to profiles)
job_id (uuid, foreign key to jobs)
match_score (integer, 0-100)
skill_matches (jsonb) — detailed breakdown: {matched: [...], missing: [...], adjacent: [...]}
calculated_at (timestamp, default now())

PRIMARY KEY: (user_id, job_id)
```

### Supabase Row Level Security
- profiles: Users can only read/update their own row
- resumes: Users can only read/write their own resumes
- applications: Users can only read/write their own applications
- user_job_matches: Users can only read their own matches
- companies: Read-only for all authenticated users
- jobs: Read-only for all authenticated users

---

## Build Phases

### Phase 1 — Core MVP (Build FIRST)
Priority order — build and test each before moving to next:

1. **Project setup:** Next.js + Tailwind + Supabase + Vercel
2. **Database:** Create all tables with RLS policies
3. **Auth:** Supabase login/signup with Google + GitHub OAuth
4. **Landing page:** Hero, value prop, CTA
5. **Onboarding flow:**
   a. Resume upload + parsing
   b. Resume rules editor (formatting, content, banned words, custom)
   c. Master resume optimization (first GPT integration)
   d. Job preferences setup
   e. Auto-fill profile setup
   f. Answer bank setup
6. **Company seed database:** Import curated list of 500+ tech companies with board tokens
7. **Job polling system:** Cron job calling Greenhouse + Lever + Ashby APIs every 2 hours
8. **Synonym filter engine:** Tag every job with standardized filter labels at ingestion
9. **Staffing agency detection:** All 3 layers, run at company ingestion
10. **Match scoring:** Calculate and cache scores per user per job
11. **Job dashboard:** Feed with cards, filtering, sorting, freshness display, 60%+ threshold
12. **Job detail page:** Full JD, skill gap analysis, match breakdown
13. **Per-JD resume optimizer:** Second GPT integration, side-by-side comparison, change highlighting
14. **Resume download:** Generate .docx and .pdf from tailored content
15. **Application tracker:** Log applications, status updates, JD snapshots, resume version linking
16. **My Resumes page:** Raw, master, and all tailored versions
17. **Resume Rules page:** Dedicated editor for all rule types
18. **Settings page:** All preferences editable
19. **Responsive design:** Desktop-first, works on mobile browsers

### Phase 2 — Chrome Extension
1. Chrome extension (Manifest V3) detects Greenhouse/Lever/Ashby career page forms
2. Auto-fills form fields from user's SmartApply profile
3. Matches screening questions against answer bank
4. Uploads the per-JD tailored resume file
5. Color-codes fields:
   - Green: filled correctly with high confidence
   - Yellow: filled but user should review/personalize
   - Red: couldn't fill, user must enter manually
6. User reviews everything, edits yellow/red fields
7. User clicks Submit themselves
8. Extension sends confirmation back to SmartApply to log in tracker

### Phase 3 — Enhancements
1. Add JSearch API for broader job coverage (LinkedIn, Indeed, Glassdoor jobs)
2. Email notifications: daily digest of new high-match jobs
3. Cover letter generator using same GPT + rules system
4. Interview prep: suggest questions based on JD + your resume gaps
5. Analytics: application success rate, common skill gaps, best-performing resume versions
6. Company research panel: employee count, Glassdoor rating, recent news

### Phase 4 — Growth and Monetization
1. Freemium: free tier (5 resume tailors/month), paid tier (unlimited, $19-29/month)
2. Mobile app or PWA for job browsing and notifications
3. Team features
4. Employer-side features (optional revenue stream)

---

## Important Technical Notes for Claude Code

1. **Security:** Enable Supabase RLS on EVERY table. Never expose API keys client-side. All GPT calls must go through Next.js API routes (server-side). Never send user's resume text to the client unencrypted.

2. **Environment variables:** Store in .env.local (add to .gitignore):
   - OPENAI_API_KEY
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

3. **Resume file handling:** Use Supabase Storage for all file uploads/downloads. Parse .docx with mammoth.js, parse .pdf with pdf-parse. For generating .docx output, use docx.js or a similar library that can create Word documents programmatically while preserving formatting.

4. **Job polling architecture:** Use Vercel Cron Jobs (vercel.json cron config) to trigger a Next.js API route every 2 hours. The route loops through companies and calls ATS APIs. Store results in Supabase. Never call external APIs in response to user dashboard requests.

5. **Match score caching:** Calculate match scores when new jobs are ingested OR when user updates their profile/resume. Store in user_job_matches table. Dashboard queries this table directly for fast loading.

6. **Synonym dictionaries:** Store as JSON config files in the project. Easy to update without database migrations. Load into memory at server startup.

7. **Rate limiting:** Track daily resume optimization count per user in profiles table or a separate usage table. Enforce limit in the API route before calling GPT. Return friendly error: "You've used 5/5 free optimizations today. Upgrade for unlimited."

8. **Error handling:** Every screen needs: loading skeleton, empty state (no jobs found, no applications yet), error state with retry button. If GPT is slow (>15 seconds), show progress indicator. If GPT fails, show error with "Try again" button.

9. **Performance:** Paginate job feed (20 per page, infinite scroll). Use database indexes on all filtered/sorted columns. Cache match scores. Use Supabase realtime subscriptions for live tracker updates (optional).

10. **Company seed data:** Create a seed script that imports a JSON file of ~500-1000 companies on first deploy. Include: company name, ATS platform, board token/slug, careers URL. Sources: remoteintech/remote-jobs GitHub repo, Solomon04/top-tech-companies, and manually verified board tokens from top tech companies.

11. **Deployment checklist:**
    - Deploy to Vercel (connect GitHub repo)
    - Create Supabase project (free tier)
    - Set all environment variables in Vercel dashboard
    - Run database migrations (create all tables + RLS policies)
    - Run company seed script
    - Enable Vercel Cron for job polling
    - Test: sign up → onboard → see jobs → optimize resume → track application

---

## Reference Links

- Greenhouse Job Board API: https://developers.greenhouse.io/job-board.html
- Lever Postings API: https://github.com/lever/postings-api
- Ashby API docs: https://developers.ashbyhq.com/docs/public-job-posting-api
- Supabase docs: https://supabase.com/docs
- OpenAI API docs: https://platform.openai.com/docs
- RemoteOK API: https://remoteok.com/api
- Next.js docs: https://nextjs.org/docs
- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
- Tailwind CSS: https://tailwindcss.com/docs
- mammoth.js: https://github.com/mwilliamson/mammoth.js
- pdf-parse: https://www.npmjs.com/package/pdf-parse
- docx.js: https://docx.js.org/
