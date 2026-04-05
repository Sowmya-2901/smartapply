# SmartApply — Complete Implementation Plan
# For: Complete beginner using Claude Code on MacOS

---

## PART 0 — SETUP YOUR MAC (Do this BEFORE touching Claude Code)

You need to install a few free tools on your Mac first. Open the "Terminal" app
(press Cmd+Space, type "Terminal", press Enter).

Then copy-paste each command below one at a time and press Enter after each:

### Step 0.1 — Install Homebrew (Mac's package manager)
```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
Follow the on-screen instructions. When done, close and reopen Terminal.

### Step 0.2 — Install Node.js (required for Next.js)
```
brew install node
```
Verify it worked:
```
node --version
npm --version
```
Both should show version numbers. If they do, you're good.

### Step 0.3 — Install Git (for version control)
```
brew install git
```

### Step 0.4 — Install Claude Code
```
npm install -g @anthropic-ai/claude-code
```
Then authenticate:
```
claude
```
It will open a browser window to log in with your Anthropic account.
Follow the instructions to authenticate.

### Step 0.5 — Create accounts (free) on these services
Open each link in your browser and sign up:

1. **Supabase** — https://supabase.com (sign up with GitHub)
   - After signup, click "New Project"
   - Name it "smartapply"
   - Choose a database password (SAVE THIS — you'll need it)
   - Region: choose closest to you
   - Wait for project to be created
   - Go to Settings → API → copy these two values:
     - Project URL (looks like: https://xxxxx.supabase.co)
     - anon public key (long string starting with "eyJ...")
   - Go to Settings → API → Service Role key → copy this too

2. **OpenAI** — https://platform.openai.com
   - Sign up and go to API Keys
   - Create a new API key — copy and save it
   - Go to Billing → Add $5-10 credit (this lasts a LONG time)

3. **Vercel** — https://vercel.com (sign up with GitHub)
   - You'll deploy here later — just create the account for now

4. **GitHub** — https://github.com (if you don't have one already)
   - You'll store your code here

### Step 0.6 — Create project folder
```
mkdir -p ~/Documents/Projects
cd ~/Documents/Projects
```
This creates a "Projects" folder inside your Documents folder.
All SmartApply code will live at: ~/Documents/Projects/smartapply

---

## PART 1 — HOW TO USE CLAUDE CODE

Claude Code is a terminal tool. You type instructions in plain English
and it writes code, creates files, runs commands for you.

### How to start Claude Code:
```
cd ~/Documents/Projects
claude
```

### How to give instructions:
Just type what you want in plain English. For example:
"Create a new Next.js project with Tailwind CSS"

### Key commands inside Claude Code:
- Type your instruction and press Enter → Claude writes code
- Type /clear → clears conversation history
- Type /quit or Ctrl+C → exits Claude Code
- If Claude asks a question → answer it
- If Claude says "should I run this?" → type "yes"

### Golden rule:
NEVER type more than one task at a time. Give Claude ONE instruction,
wait for it to finish, verify it works, then give the next instruction.

---

## PART 2 — THE BUILD PLAN (Step by Step)

Below is the EXACT sequence of instructions to give Claude Code.
Do them IN ORDER. Do NOT skip steps. Wait for each step to complete
before starting the next.

---

### PHASE 1: PROJECT SETUP
**Estimated time: 30 minutes**
**⚠️ REMINDER: Plan each step first. Ask questions. Only implement on "GO AHEAD".**

#### Step 1.1 — Create Next.js Project
Open Terminal, navigate to your folder, and start Claude Code:
```
cd ~/Documents/Projects
claude
```

Then paste this instruction into Claude Code:

```
STEP 1.1 — Create the Next.js project.

Think step by step. Research the correct way. 
Show me your plan first. Ask questions if any gaps or doubts.
Only implement when I say GO AHEAD.

The project should be created at: ~/Documents/Projects/smartapply

Requirements:
- Next.js 14+ with App Router (not Pages Router)
- TypeScript
- Tailwind CSS for styling
- src/ directory structure
- Project name: "smartapply"

After creating the project, install these additional packages:
- @supabase/supabase-js (for database and auth)
- @supabase/ssr (for server-side Supabase)
- openai (for GPT API calls)
- mammoth (for parsing .docx files)
- pdf-parse (for parsing .pdf files)
- docx (for generating .docx files)
- date-fns (for date formatting like "2 hours ago")

Create a .env.local file with these placeholder variables:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENAI_API_KEY=your_openai_key_here

Add .env.local to .gitignore.
Initialize a git repository.

Show me the plan first. Ask questions. Wait for GO AHEAD.
```

After Claude finishes, update .env.local with your REAL keys from Step 0.5.

#### Step 1.2 — Setup Supabase Client
```
Create a Supabase client configuration for Next.js:

1. Create src/lib/supabase/client.ts — browser client (for client components)
2. Create src/lib/supabase/server.ts — server client (for API routes and server components)
3. Create src/lib/supabase/middleware.ts — for auth session handling

Follow the official Supabase + Next.js App Router pattern.
Make sure the server client uses the service role key for admin operations
(like the job polling cron) and the anon key for user-facing operations.
```

#### Step 1.3 — Setup Database Schema
```
I need you to create a Supabase SQL migration file at src/lib/supabase/schema.sql
that creates ALL the following tables. Use UUID for all primary keys.
Enable Row Level Security (RLS) on every table.

TABLE 1: companies
- id (uuid, primary key, default gen_random_uuid())
- name (text, not null)
- slug (text, not null) — the board token for ATS API
- ats_platform (text: 'greenhouse', 'lever', 'ashby', 'remoteok', 'other')
- careers_url (text)
- website_url (text)
- employee_count (integer, nullable)
- industry (text, nullable)
- is_staffing_agency (boolean, default false)
- staffing_detection_score (integer, default 0)
- verified (boolean, default false)
- last_polled_at (timestamptz)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

TABLE 2: jobs
- id (uuid, primary key, default gen_random_uuid())
- company_id (uuid, foreign key to companies, not null)
- external_id (text, not null) — job ID from ATS API
- title (text, not null)
- description_html (text)
- description_text (text) — cleaned plain text
- location (text)
- remote_type (text: 'remote', 'hybrid', 'onsite', null)
- salary_min (integer, nullable)
- salary_max (integer, nullable)
- salary_currency (text, default 'USD')
- department (text, nullable)
- employment_type (text: 'full_time', 'contract', 'part_time', 'intern')
- required_skills (text array)
- parsed_experience_years (integer, nullable)
- seniority_level (text, nullable)
- apply_url (text, not null)
- source_api (text, not null)
- filter_tags (text array) — tags like 'requires_us_citizenship', 'contract_job', 'new_grad_job', 'remote_job'
- is_active (boolean, default true)
- posted_at (timestamptz, nullable)
- discovered_at (timestamptz, default now())
- updated_at (timestamptz, default now())
- UNIQUE constraint on (company_id, external_id)
- INDEXES on: company_id, is_active, discovered_at, filter_tags (GIN index)

TABLE 3: profiles
- id (uuid, primary key, references auth.users on delete cascade)
- full_name (text)
- email (text)
- phone (text)
- linkedin_url (text)
- github_url (text)
- portfolio_url (text)
- current_salary (integer, nullable)
- expected_salary (integer, nullable)
- work_authorization (text)
- willing_to_relocate (boolean)
- notice_period (text)
- screening_answers (jsonb, default '{}') — answer bank as JSON
- job_titles (text array) — preferred titles
- locations (text array)
- remote_preference (text: 'remote', 'hybrid', 'onsite', 'any')
- min_salary (integer, nullable)
- experience_years (integer)
- seniority_preferences (text array)
- no_new_grad (boolean, default true)
- no_contract (boolean, default true)
- visa_sponsorship_required (boolean, default false)
- us_citizen_only_filter (boolean, default false)
- excluded_companies (text array)
- company_size_preference (text array)
- freshness_preference (text, default 'all')
- match_threshold (integer, default 60)
- formatting_rules (text) — resume formatting rules
- content_rules (text) — resume content rules
- banned_words (text array) — banned words list
- custom_rules (text) — free text custom instructions
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

TABLE 4: resumes
- id (uuid, primary key, default gen_random_uuid())
- user_id (uuid, foreign key to profiles, not null)
- type (text: 'raw_base', 'master_optimized', 'job_tailored')
- job_id (uuid, foreign key to jobs, nullable) — only for job_tailored type
- file_url (text) — Supabase Storage URL
- pdf_url (text)
- parsed_text (text)
- parsed_skills (text array)
- change_summary (jsonb, nullable)
- is_current (boolean, default true)
- created_at (timestamptz, default now())
- INDEX on: user_id, type, is_current

TABLE 5: applications
- id (uuid, primary key, default gen_random_uuid())
- user_id (uuid, foreign key to profiles, not null)
- job_id (uuid, foreign key to jobs, not null)
- resume_id (uuid, foreign key to resumes, not null)
- status (text: 'saved', 'applied', 'phone_screen', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn')
- match_score_at_application (integer)
- applied_at (timestamptz)
- status_updated_at (timestamptz)
- notes (text)
- follow_up_date (date, nullable)
- jd_snapshot (text, not null)
- INDEX on: user_id, status, applied_at

TABLE 6: user_job_matches (for caching match scores)
- user_id (uuid, foreign key to profiles)
- job_id (uuid, foreign key to jobs)
- match_score (integer, 0-100)
- skill_matches (jsonb) — breakdown: {matched: [], missing: [], adjacent: []}
- calculated_at (timestamptz, default now())
- PRIMARY KEY: (user_id, job_id)

RLS POLICIES:
- profiles: Users can only SELECT, UPDATE, INSERT their own row (where id = auth.uid())
- resumes: Users can only access their own (where user_id = auth.uid())
- applications: Users can only access their own (where user_id = auth.uid())
- user_job_matches: Users can only read their own (where user_id = auth.uid())
- companies: All authenticated users can SELECT (read-only)
- jobs: All authenticated users can SELECT (read-only)

Also create a Supabase Storage bucket called 'resumes' for file uploads.

Generate the complete SQL and tell me how to run it in Supabase.
```

After Claude generates the SQL, go to your Supabase dashboard → SQL Editor → paste the SQL → click Run.

#### Step 1.4 — Setup Auth
```
Set up Supabase authentication for Next.js App Router:

1. Create middleware.ts at the project root that:
   - Refreshes auth session on every request
   - Redirects unauthenticated users to /login (except for / landing page)
   - Redirects authenticated users from /login to /dashboard

2. Create src/app/login/page.tsx with:
   - Email + password login form
   - Google OAuth button
   - GitHub OAuth button
   - Link to signup page
   - Modern, clean design using Tailwind CSS
   - Dark navy (#0F172A) background, white cards, subtle gradients

3. Create src/app/signup/page.tsx with:
   - Email + password signup form
   - Google OAuth button
   - GitHub OAuth button
   - After signup, create a profile row in the profiles table
   - Redirect to /onboarding after signup

4. Create src/app/auth/callback/route.ts for OAuth callback handling

5. Create a logout function accessible from the nav bar

Use Supabase Auth helpers for Next.js. Make sure auth state persists across page loads.
```

---

### PHASE 2: LANDING PAGE AND ONBOARDING
**Estimated time: 2-3 hours**
**⚠️ REMINDER: Plan each step first. Ask questions. Only implement on "GO AHEAD".**

#### Step 2.1 — Landing Page
```
Create the SmartApply landing page at src/app/page.tsx:

Design specs:
- Dark navy (#0F172A) background
- Hero section with large heading: "Stop spraying resumes. Start landing interviews."
- Subheading: "SmartApply finds real tech jobs, AI-tailors your resume for each one, and helps you apply in minutes — not hours."
- CTA button: "Get Started Free" → links to /signup
- 3-column feature section:
  1. "Smart Job Matching" — icon + "Jobs from 500+ real tech companies. No staffing agencies. No ghost jobs."
  2. "AI Resume Tailoring" — icon + "Your resume rewritten for each job description. ATS-optimized. Human-quality writing."
  3. "Track Everything" — icon + "Every application tracked with the exact resume version you sent."
- Company logo section: "Jobs from companies like:" with placeholder logos for Stripe, Spotify, Airbnb, Discord, Reddit, Figma
- Footer with links

Make it visually stunning — use Tailwind CSS. Modern, posh, premium feel.
Subtle gradient effects, smooth animations, professional typography.
Use Satoshi or General Sans font from Google Fonts for headings.
```

#### Step 2.2 — Onboarding Flow
```
Create the onboarding flow at src/app/onboarding/page.tsx:

This should be a multi-step wizard with a progress bar at the top showing which step the user is on. Steps should transition smoothly.

STEP 1 — Upload Resume:
- Drag-and-drop zone with "Upload your resume (.docx or .pdf)" text
- Also a "Click to browse" fallback button
- After upload:
  - Parse the file (use mammoth for .docx, pdf-parse for .pdf)
  - Extract text content
  - Store the raw file in Supabase Storage 'resumes' bucket
  - Create a row in resumes table with type='raw_base'
  - Show a preview: "We extracted your resume. Here are the skills we found: [list of detected skills]"
  - Let user confirm or edit the extracted skills
- "Next" button

STEP 2 — Resume Optimization Rules:
- Section: "Formatting Rules" with pre-filled defaults as checkboxes:
  ☑ Never change original formatting, fonts, colors, or spacing
  ☑ Keep resume to 2 pages maximum
  ☑ Skills section must be plain text (never use tables)
  ☑ Use standard section headings
  ☑ No unicode bullets or special characters

- Section: "Content Rules" with pre-filled defaults as checkboxes:
  ☑ Add missing JD skills to Skills section
  ☑ Write new bullet points for missing skills
  ☑ Every bullet: Action verb + What + How + Result with numbers
  ☑ Use varied bullet patterns
  ☑ Add approximate metrics marked with (~) where exact numbers unavailable
  ☑ Never remove existing bullet points
  ☑ Never change job titles, company names, dates, GPA, or degrees

- Section: "Banned Words" — tag-style input:
  Pre-filled with: passionate, synergy, leverage, spearheaded, guru, ninja, rockstar, innovative, dynamic, detail-oriented, results-driven, team player, cutting-edge, utilized, leveraged, robust, scalable solutions, best practices
  User can add or remove words by clicking X or typing new ones.

- Section: "Custom Rules" — large text area:
  Placeholder: "Add any additional rules here. For example: 'Always keep my summary under 4 lines' or 'Emphasize AWS experience in every resume'"

- Save all rules to the profiles table
- "Next" button

STEP 3 — Master Resume Optimization:
- Show a message: "Let's optimize your base resume with your rules..."
- Call an API route that sends the raw resume text + all rules to OpenAI GPT-4o-mini
- System prompt includes ALL the user's rules from Step 2
- User prompt: "Optimize this resume following all rules exactly. Fix weak bullets, add metrics, use active verbs, remove banned words, ensure ATS compatibility."
- Show loading animation while GPT processes
- When done, show side-by-side comparison: Original (left) vs Optimized (right)
- Highlight changes in green (added) and yellow (modified)
- Let user edit the optimized version
- "Save as Master Resume" button — stores in resumes table with type='master_optimized'
- "Next" button

STEP 4 — Job Search Preferences:
- Job titles: multi-tag input (type and press Enter to add)
  Placeholder: "Backend Engineer, SDE II, Platform Engineer"
- Locations: multi-tag input
  Placeholder: "Remote, San Francisco, New York"
- Remote preference: radio buttons (Remote / Hybrid / Onsite / Any)
- Salary range: slider with min value input ($0 - $500K)
- Experience years: number input
- Seniority: multi-select checkboxes (Junior, Mid, Senior, Staff, Principal)
- Toggles (with labels):
  ☑ Hide New Grad positions
  ☑ Hide Contract/Temp jobs
  ☐ I need visa sponsorship (show only sponsoring companies)
  ☐ Hide "US Citizens only" positions
- Exclude companies: multi-tag input
- Company size: multi-select (Startups 1-50, Mid-size 51-500, Large 500+, Show all)
- Save to profiles table
- "Next" button

STEP 5 — Auto-fill Profile:
- Full name (pre-filled from resume parsing if detected)
- Email (pre-filled from auth)
- Phone
- LinkedIn URL
- GitHub URL
- Portfolio URL
- Expected salary
- Work authorization dropdown: (US Citizen, Green Card, H1-B, OPT, EAD, Other)
- Willing to relocate: Yes/No toggle
- Notice period dropdown: (Immediately, 2 weeks, 1 month, 2 months, Other)
- Save to profiles table
- "Next" button

STEP 6 — Answer Bank:
- Section: "Technical Experience" — dynamic form where user adds skill+years pairs:
  [Python] [5 years] [+ Add another]
  [Java] [3 years]
  [AWS] [4 years]

- Section: "Common Screening Answers":
  Willing to undergo background check: Yes/No
  Have you worked for this company before: Yes/No (default)
  How did you hear about us: [text input, default "Company career page"]
  Available start date: [text input]

- Section: "Template Answers" — expandable text areas:
  "Why interested in this role?" → large text area with placeholder example
  "Why this company?" → large text area
  "Describe a challenging project" → large text area

- All stored as JSON in profiles.screening_answers
- "Finish Setup" button → redirect to /dashboard

Make the entire onboarding flow look modern, clean, and encouraging.
Progress bar at top. Smooth transitions between steps. Save data at each step
so nothing is lost if user refreshes.
```

---

### PHASE 3: JOB DATA PIPELINE
**Estimated time: 3-4 hours**
**⚠️ REMINDER: Plan each step first. Ask questions. Only implement on "GO AHEAD".**

#### Step 3.1 — Company Seed Data
```
Create a seed data file at src/lib/data/companies.json containing a curated list
of 100 real tech companies (to start with — we'll add more later).

For each company, include:
- name: company name
- slug: their board token for the ATS API
- ats_platform: "greenhouse", "lever", or "ashby"
- careers_url: URL to their careers page
- website_url: company website
- employee_count: approximate (nullable)

Include at least these well-known companies (research and find their correct
board tokens/slugs for Greenhouse, Lever, or Ashby):

Greenhouse companies: Stripe, Airbnb, HubSpot, Discord, Coinbase, Figma,
Pinterest, DoorDash, Squarespace, Gusto, Brex, Plaid, Notion, Databricks,
HashiCorp, GitLab, Cloudflare, Airtable, Webflow, Lattice

Lever companies: Spotify, Netflix, Atlassian, Eventbrite, KPMG,
Handshake, Lever itself, Postman

Ashby companies: Reddit, Duolingo, Ramp, OpenAI

Also create a seed script at src/lib/data/seed.ts that:
1. Reads companies.json
2. Inserts all companies into the Supabase companies table
3. Skips duplicates (check by slug + ats_platform)
4. Can be run manually: npx ts-node src/lib/data/seed.ts

IMPORTANT: Research the actual board tokens. For Greenhouse, the board token
is typically the company name in lowercase (e.g., "stripe" for boards.greenhouse.io/stripe).
For Lever, it's similar (e.g., "spotify" for jobs.lever.co/spotify).
For Ashby, check the company's career page URL pattern.
```

#### Step 3.2 — Synonym Filter Engine
```
Create a comprehensive synonym/keyword filter engine at src/lib/filters/synonyms.ts:

This module exports filter definitions used to tag job descriptions at ingestion time.

Create these filter dictionaries:

1. CITIZENSHIP_FILTERS — phrases indicating US citizenship/clearance requirements:
   Include at least 25 variations like: "us citizen", "u.s. citizen", "security clearance",
   "clearance required", "TS/SCI", "no international students", "without sponsorship",
   "no visa sponsorship", "will not sponsor", "cannot sponsor", "does not sponsor",
   "us persons only", "ITAR", "permanent work authorization", "must be authorized",
   "no OPT", "no CPT", "green card required", etc.

2. CONTRACT_FILTERS — phrases indicating contract/temp work:
   "contract position", "contract-to-hire", "C2H", "CTH", "temporary", "1099",
   "W2/C2C", "corp to corp", "C2C", "staff augmentation", "SOW based",
   "6 month contract", "12 month contract", "temp position", etc.
   EXCLUDE if also contains: "full-time", "full time", "permanent", "FTE", "direct hire"

3. NEW_GRAD_FILTERS — phrases indicating new grad/entry level:
   "new grad", "new graduate", "recent graduate", "entry level", "entry-level",
   "0-1 years", "0-2 years", "no experience required", "junior level",
   "university hire", "campus hire", "rotational program", "early career", etc.

4. REMOTE_FILTERS — phrases indicating remote work:
   "remote", "work from home", "WFH", "distributed team", "fully remote",
   "100% remote", "remote-first", "anywhere in the US", "US remote", etc.

5. HYBRID_FILTERS — phrases indicating hybrid:
   "hybrid", "2 days in office", "3 days in office", "partial remote",
   "flexible location", etc.

6. EXPERIENCE_PARSER — regex patterns to extract years of experience:
   Match patterns like "5+ years", "3-5 years", "minimum 7 years",
   "at least 3 years", etc. Return the parsed number.
   Also infer from title: "Senior"/"Sr." = 5+, "Staff" = 8+,
   "Junior"/"Jr." = 0-2, "Lead" = 6+, "Mid" = 2-5

7. SKILL_SYNONYMS — map of tech skill variations:
   Include at least 100 skill synonym groups:
   Python = Python3, Python 3.x, CPython
   JavaScript = JS, ES6, ECMAScript
   TypeScript = TS
   React = React.js, ReactJS
   Node.js = Node, NodeJS
   AWS = Amazon Web Services
   GCP = Google Cloud, Google Cloud Platform
   Kubernetes = K8s, k8s
   Docker = containerization, containers
   PostgreSQL = Postgres, psql
   MongoDB = Mongo
   Redis = Redis cache
   Kafka = Apache Kafka, event streaming
   Spring Boot = SpringBoot, Spring Framework
   CI/CD = CICD, continuous integration, Jenkins, GitHub Actions, GitLab CI
   GraphQL = GQL
   REST = RESTful, REST API
   Terraform = TF, Infrastructure as Code, IaC
   Go = Golang
   Java = J2EE, JDK, JVM
   Spark = Apache Spark, PySpark
   ... and many more

Create a function: tagJobDescription(descriptionText: string) that:
- Scans text against all filter dictionaries (case-insensitive)
- Returns an array of filter tags: ['requires_us_citizenship', 'remote_job', 'fulltime_job']
- Also returns parsed_experience_years if found
- Also returns extracted_skills array

Create a function: calculateMatchScore(userSkills: string[], jobSkills: string[], userProfile: Profile, job: Job) that:
- Uses SKILL_SYNONYMS to match user skills against job skills
- Returns a score 0-100 with detailed breakdown
- Weights: skill_match (50%), experience (20%), location (10%), title (10%), salary (10%)
```

#### Step 3.3 — Staffing Agency Detection
```
Create the staffing agency detection module at src/lib/filters/staffingDetector.ts:

Layer 1 — Name keyword check:
- INSTANT_FLAG words in company name: Staffing, Recruiting, Recruitment,
  Talent Solutions, Personnel, Workforce, Placement, Temps
- WARNING words: Solutions LLC, Consulting LLC, Technologies LLC

Layer 2 — Known blocklist:
- Create src/lib/data/staffing-companies.json with a list of at least 200
  known staffing company names: TEKsystems, Insight Global, Robert Half,
  Randstad, Adecco, Kforce, CyberCoders, Apex Systems, Infosys BPO,
  Wipro, TCS, Cognizant, ManpowerGroup, Kelly Services, Hays,
  Michael Page, Accenture Federal, Collabera, Syntel, HCL,
  Tata Consultancy, Capgemini, NTT Data, UST Global, Mindtree,
  Persistent Systems, Mphasis, Hexaware, NIIT Technologies,
  Tech Mahindra, LTIMindtree, Zensar, Birlasoft, Cyient,
  Mastech Holdings, iGate, Synechron, Virtusa, Globant (staffing arm),
  Jobot, Dice (staffing), etc.

Layer 3 — JD keyword scan:
- Flag phrases: "our client", "on behalf of", "W2/C2C/1099",
  "right to represent", "bench", "hotlist", "end client",
  "bill rate", "corp to corp", "employer of record",
  "staff augmentation"

Function: detectStaffingAgency(companyName: string, jdText?: string): {
  isStaffing: boolean,
  confidence: 'high' | 'medium' | 'low',
  reasons: string[]
}
```

#### Step 3.4 — ATS API Integration
```
Create API integration modules for each ATS platform:

1. src/lib/ats/greenhouse.ts:
   - Function: fetchGreenhouseJobs(boardToken: string)
   - Calls: GET https://boards-api.greenhouse.io/v1/boards/{boardToken}/jobs?content=true
   - Parses response into standardized Job format
   - Extracts: title, location, content (HTML description), departments, offices
   - Returns array of parsed jobs

2. src/lib/ats/lever.ts:
   - Function: fetchLeverJobs(companySlug: string)
   - Calls: GET https://api.lever.co/v0/postings/{companySlug}?mode=json
   - Parses response into standardized Job format
   - Extracts: text, categories (location, team, commitment), salary info
   - Returns array of parsed jobs

3. src/lib/ats/ashby.ts:
   - Function: fetchAshbyJobs(clientName: string)
   - Calls: GET https://api.ashbyhq.com/posting-api/job-board/{clientName}?includeCompensation=true
   - Parses response into standardized Job format
   - Extracts: title, location, compensation, employment type
   - Returns array of parsed jobs

4. src/lib/ats/types.ts:
   - Define a standardized RawJob interface that all three return
   - Include: externalId, title, descriptionHtml, descriptionText, location,
     salaryMin, salaryMax, department, applyUrl, postedAt

Each module should:
- Handle errors gracefully (API down, invalid response, etc.)
- Return empty array on failure (don't crash the whole pipeline)
- Log errors for debugging
- Strip HTML tags from descriptions to get plain text
```

#### Step 3.5 — Job Polling Pipeline
```
Create the job polling pipeline as a Next.js API route:
src/app/api/jobs/poll/route.ts

This route will be called by Vercel Cron every 2 hours.

The pipeline should:
1. Fetch all companies from the companies table
2. Group them by ats_platform
3. For each company:
   a. Call the appropriate ATS API (greenhouse, lever, or ashby)
   b. For each job returned:
      - Check if job already exists (by company_id + external_id)
      - If NEW:
        * Run tagJobDescription() to get filter tags + parsed experience + extracted skills
        * Run detectStaffingAgency() on the company name + JD text
        * Insert into jobs table with all parsed data
        * Set discovered_at = now()
      - If EXISTS:
        * Update any changed fields (title, description, salary, etc.)
        * Keep original discovered_at
      - If a previously stored job is NOT in the API response anymore:
        * Set is_active = false
   c. Update company's last_polled_at timestamp
4. Return a summary: { newJobs: X, updatedJobs: Y, removedJobs: Z, errors: [] }

Also set up Vercel Cron:
- Create vercel.json at project root with cron config
- Schedule: every 2 hours ("0 */2 * * *")
- Route: /api/jobs/poll

Add a manual trigger button in the admin/settings area for testing.

Handle rate limiting:
- Add a small delay (200ms) between API calls to be respectful
- If any single company API call fails, log the error and continue to the next company
- Don't let one failure stop the entire poll cycle
```

---

### PHASE 4: JOB DASHBOARD
**Estimated time: 3-4 hours**
**⚠️ REMINDER: Plan each step first. Ask questions. Only implement on "GO AHEAD".**

#### Step 4.1 — Dashboard Layout
```
Create the main dashboard layout at src/app/dashboard/layout.tsx:

Layout structure:
- Top navigation bar (sticky):
  - SmartApply logo (left)
  - Search bar (center) — search within job results
  - Notification bell icon (right, placeholder for now)
  - User avatar/profile dropdown (right)

- Left sidebar (fixed, 250px wide):
  - Navigation links with icons:
    📋 Jobs (active state highlighted)
    📄 My Resumes
    📊 Application Tracker
    📝 Resume Rules
    ⚙️ Settings

- Main content area (right of sidebar, scrollable)

Design:
- Sidebar: dark navy (#0F172A) background, white text
- Main area: light gray (#F8FAFC) background
- Nav bar: white with subtle bottom border
- Smooth transitions, hover effects on nav items
- Active nav item has a colored left border or background highlight
- Responsive: on mobile, sidebar becomes a hamburger menu
```

#### Step 4.2 — Job Feed
```
Create the job feed page at src/app/dashboard/page.tsx:

TOP SECTION — Stats Bar:
- Row of 4 stat cards:
  🟢 "X New Today" (jobs discovered in last 24 hours matching preferences)
  📤 "X Applied" (total applications)
  ❤️ "X Saved" (bookmarked jobs, simple bookmark — no learning)
  📊 "Avg Match: X%" (average match score of visible jobs)

FILTER BAR (below stats):
- Match score filter: dropdown or buttons [All] [90%+] [80%+] [70%+] [60%+]
- Freshness filter: [All] [Last 4 hours] [Today] [Last 3 days] [This week]
- Sort: dropdown [Best Match] [Newest First] [Highest Salary]
- Location filter: dropdown with user's saved locations
- Remote filter: [All] [Remote] [Hybrid] [Onsite]

JOB CARDS (main feed, infinite scroll, 20 at a time):
Each card is a white card with subtle shadow and rounded corners.
Card contents:
- Top right: Match score badge (green 90%+, blue 70-89%, yellow 60-69%)
  Show as: "⭐ 87% Match"
- Job title (large, bold)
- Company name + verification badge "✅ via Greenhouse"
- Location + Remote badge if applicable
- Salary range (if available): "💰 $180K - $220K"
- Company size (if known): "🏢 1,200 employees"
- Skills as tags: matched skills in green, missing skills in gray
- Posted time: "Posted 2 hours ago" (use date-fns formatDistanceToNow)
- Employment type: "Full-time" badge
- Three buttons at bottom:
  [View JD] → opens job detail page
  [Optimize Resume] → opens resume optimizer
  [Apply ↗] → opens apply_url in new tab
- Bookmark icon (top right, simple save — stores in applications with status='saved')

IMPORTANT QUERY LOGIC:
- Only show jobs where:
  - is_active = true
  - company.is_staffing_agency = false
  - match_score >= user's match_threshold (default 60)
  - NOT tagged 'contract_job' (if user has no_contract = true)
  - NOT tagged 'new_grad_job' (if user has no_new_grad = true)
  - NOT tagged 'requires_us_citizenship' (if user has visa_sponsorship_required = true)
  - matches user's remote_preference
  - matches user's location preferences (if specified)
  - parsed_experience_years <= user's experience_years (if parsed)
  - job.company_id NOT IN user's excluded_companies

- Default sort: discovered_at DESC (newest first), then match_score DESC

- Calculate match scores using the calculateMatchScore function
  and cache in user_job_matches table

Make the infinite scroll smooth. Show loading skeletons while fetching.
Show empty state if no jobs match: "No matching jobs found. Try broadening your filters."
```

#### Step 4.3 — Job Detail Page
```
Create the job detail page at src/app/dashboard/jobs/[id]/page.tsx:

LEFT SIDE (60% width) — Full Job Description:
- Company name + logo placeholder + "✅ Verified via Greenhouse"
- Job title (large)
- Location | Remote badge | Salary range | Posted time
- Apply URL link
- Full job description rendered from HTML (sanitized)
  Use a clean, readable format with proper headings, lists, paragraphs

RIGHT SIDE (40% width) — Match Analysis Panel (sticky):
- Overall match score: large number with color (e.g., "87%")

- Skills Analysis:
  ✅ Matched Skills (green): Python, AWS, Kafka
  🔵 Adjacent Skills (blue): "PySpark (you have Spark)"
  ❌ Missing Skills (red): Kubernetes, Terraform
  "You match 4/6 required skills"

- Experience Match:
  "JD requires 5+ years. You have 5 years. ✅ Match"

- Detected Info:
  Employment: Full-time
  Remote: Yes
  Visa sponsorship: Not mentioned
  Seniority: Senior level

- Company Info:
  Name, employee count, industry, website link

- Action Buttons (large, stacked):
  [🔧 Optimize Resume for This Job] → goes to resume optimizer
  [📤 Apply Now] → opens apply_url in new tab
  [🔖 Save Job] → bookmarks
  [↩ Back to Feed] → returns to dashboard
```

---

### PHASE 5: RESUME OPTIMIZER
**Estimated time: 2-3 hours**
**⚠️ REMINDER: Plan each step first. Ask questions. Only implement on "GO AHEAD".**

#### Step 5.1 — Resume Optimization API Route
```
Create the resume optimization API route at src/app/api/resume/optimize/route.ts:

This route accepts:
- resumeText: string (the master optimized resume text)
- jobDescription: string (full JD text)
- userId: string (to load their rules)

It should:
1. Load the user's resume rules from profiles table:
   - formatting_rules
   - content_rules
   - banned_words
   - custom_rules
2. Build the system prompt including ALL rules
3. Build the user prompt with the resume + JD
4. Call OpenAI GPT-4o-mini with:
   - model: "gpt-4o-mini"
   - system prompt: all rules
   - user prompt: "Optimize this resume for this JD. Add ALL missing skills from the JD to the Skills section. Write new bullet points for missing skills. Adjust existing bullets to use JD keywords naturally. Follow every rule in the system prompt. Return the optimized resume AND a JSON summary of changes."
5. Parse the response to extract:
   - Tailored resume text
   - Change summary: { skills_added: [], bullets_added: number, bullets_modified: number, keyword_match: "14/16" }
6. Store the tailored resume in resumes table with type='job_tailored'
7. Return the tailored text + change summary

Rate limiting:
- Check user's daily optimization count (store in a simple counter)
- For now, limit to 20 per day (can adjust later)
- Return 429 error with friendly message if exceeded

Error handling:
- If OpenAI times out: return 504 with "AI is busy, please try again"
- If OpenAI returns error: return 500 with "Something went wrong"
- Log all errors for debugging
```

#### Step 5.2 — Resume Optimizer UI
```
Create the resume optimizer page at src/app/dashboard/optimize/[jobId]/page.tsx:

This page is shown when user clicks "Optimize Resume" on a job card.

FLOW:
1. Load the job data and user's master resume
2. Show job title + company at the top
3. Show a "Optimizing..." loading state with animation
4. Call the /api/resume/optimize route
5. When done, show the results:

LAYOUT — Side by Side Comparison:
LEFT (50%): "Your Master Resume"
- Shows the master optimized resume text in a readable format
- Read-only

RIGHT (50%): "Tailored for [Job Title] at [Company]"
- Shows the tailored resume text
- Changes highlighted:
  - Green background: new content added
  - Yellow background: modified content
- EDITABLE: user can click and edit any section

TOP BAR — Change Summary:
- "✅ Added 4 skills: Kubernetes, Terraform, gRPC, Redis"
- "✅ Added 3 new bullet points"
- "✅ Modified 2 existing bullets"
- "📊 ATS keyword match: 14/16"

BOTTOM — Action Buttons:
- [📥 Download .docx] — generates and downloads Word file
- [📥 Download .pdf] — generates and downloads PDF file
- [📤 Apply with this resume] — opens apply_url in new tab + creates application record
- [↩ Back to Job] — returns to job detail page

When user clicks "Apply with this resume":
1. Open the apply_url in a new tab
2. Create an application record in the applications table:
   - user_id, job_id, resume_id (the tailored version)
   - status: 'applied'
   - applied_at: now()
   - match_score_at_application: the match score
   - jd_snapshot: full JD text
3. Show a toast notification: "Application logged! Good luck! 🎉"
```

#### Step 5.3 — Resume File Generation
```
Create a utility at src/lib/resume/generateDocx.ts that:

1. Takes tailored resume text (structured by sections)
2. Uses the docx library (docx.js) to generate a Word document
3. Formatting:
   - Clean, professional layout
   - Standard headings: Summary, Skills, Experience, Projects, Education
   - Simple, ATS-friendly formatting (no tables for skills, no fancy graphics)
   - Font: Calibri or Arial, 11pt body, 14pt headings
   - Proper spacing and margins
4. Returns a buffer that can be downloaded

Also create generatePdf.ts that converts the .docx to .pdf
(simplest approach: use the docx content to generate a clean HTML → print to PDF
using a library like puppeteer or jspdf, whichever is simpler).

Or if that's too complex for MVP, just offer .docx download and
add PDF later. The .docx is the most important for ATS anyway.
```

---

### PHASE 6: APPLICATION TRACKER AND REMAINING PAGES
**Estimated time: 2-3 hours**
**⚠️ REMINDER: Plan each step first. Ask questions. Only implement on "GO AHEAD".**

#### Step 6.1 — Application Tracker
```
Create the application tracker at src/app/dashboard/tracker/page.tsx:

TOP — Pipeline Summary:
Visual cards showing count per status:
[Saved: 3] → [Applied: 8] → [Phone Screen: 2] → [Interview: 1] → [Offer: 0]
Each card is clickable to filter the table below.

MAIN — Applications Table:
Columns: Date | Company | Role | Match Score | Status | Resume | Notes | Actions

Each row shows:
- Date: formatted date
- Company: company name
- Role: job title (clickable → opens job detail if still active)
- Match score: percentage badge
- Status: dropdown to update (Saved, Applied, Phone Screen, Interview, Offer, Accepted, Rejected, Withdrawn)
  - Status change updates the database immediately
  - Each change saves a timestamp
- Resume: "View v3" link → opens the specific tailored resume used
- Notes: truncated text, click to expand/edit
- Actions: [Set follow-up reminder] [View JD snapshot]

FEATURES:
- Filter by status (dropdown)
- Filter by date range
- Search by company or role name
- Sort by date, company, status
- Empty state: "No applications yet. Start applying from the Jobs feed!"

When user clicks "View JD snapshot" → show a modal with the full JD text
that was saved at the time of application.
```

#### Step 6.2 — My Resumes Page
```
Create the resumes page at src/app/dashboard/resumes/page.tsx:

THREE SECTIONS:

Section 1 — Raw Base Resume:
- Card showing the original uploaded file
- "Uploaded: [date]"
- [Download] [Replace with new file] buttons
- Replacing triggers re-parse and re-optimization

Section 2 — Master Optimized Resume:
- Card showing the rules-optimized version
- "Last optimized: [date]"
- [Download .docx] [View] [Re-optimize] buttons
- "Re-optimize" re-runs GPT with current rules on the current base resume

Section 3 — Tailored Versions:
- List/grid of all per-JD tailored resumes
- Each card shows:
  - "Tailored for: [Job Title] at [Company]"
  - Date created
  - Change summary: "+4 skills, +3 bullets"
  - [Download .docx] [View] buttons
- Sorted by newest first
- Paginated if many versions exist
```

#### Step 6.3 — Resume Rules Page
```
Create the resume rules page at src/app/dashboard/rules/page.tsx:

Same form as onboarding Step 2, but as a standalone page.

Sections:
1. Formatting Rules (checkboxes)
2. Content Rules (checkboxes)
3. Banned Words (tag input)
4. Custom Rules (text area)

At the bottom:
- [Save Rules] button
- After saving, show prompt: "Rules updated! Your master resume should be re-optimized with the new rules. [Re-optimize now] [Later]"
- If user clicks "Re-optimize now" → re-runs master optimization with new rules
```

#### Step 6.4 — Settings Page
```
Create settings at src/app/dashboard/settings/page.tsx:

Tab-based layout:

Tab 1 — Job Preferences:
Same form as onboarding Step 4 (job titles, locations, remote, salary, etc.)
Pre-filled with saved values. Save button.

Tab 2 — Auto-fill Profile:
Same form as onboarding Step 5.
Pre-filled with saved values. Save button.

Tab 3 — Answer Bank:
Same form as onboarding Step 6.
Pre-filled with saved values. Save button.

Tab 4 — Account:
- Email (read-only)
- Change password button
- Delete account button (with confirmation modal: "This will permanently delete all your data. Are you sure?")
- Sign out button
```

---

### PHASE 7: TESTING AND DEPLOYMENT
**Estimated time: 1-2 hours**

#### Step 7.1 — Test the Full Flow
```
Let's test the complete user flow end-to-end. Walk me through:

1. Visit the landing page — verify it loads and CTA works
2. Sign up with email — verify account is created
3. Go through onboarding:
   - Upload a sample resume (create a simple test .docx)
   - Set resume rules
   - Run master optimization (verify GPT call works)
   - Set job preferences
   - Set auto-fill profile
   - Set answer bank
4. Verify job polling works:
   - Manually trigger /api/jobs/poll
   - Check that jobs appear in the database
   - Check that staffing agencies are flagged
   - Check that filter tags are applied
5. Open dashboard:
   - Verify job feed loads with match scores
   - Verify filters work (match score, freshness, remote)
   - Verify contract/staffing jobs are hidden
6. Click View JD on a job — verify detail page
7. Click Optimize Resume — verify GPT tailoring works
8. Download .docx — verify file generates
9. Click Apply — verify application is logged in tracker
10. Open tracker — verify application appears
11. Update status — verify it saves
12. Open My Resumes — verify all versions appear

Fix any bugs found during testing.
```

#### Step 7.2 — Deploy to Vercel
```
Deploy SmartApply to Vercel:

1. Initialize git repository (if not already):
   git init
   git add .
   git commit -m "Initial commit - SmartApply MVP"

2. Push to GitHub:
   - Create a new repository on github.com called "smartapply"
   - Push: git remote add origin https://github.com/YOUR_USERNAME/smartapply.git
   - git push -u origin main

3. Deploy to Vercel:
   - Go to vercel.com
   - Click "Import Project"
   - Select the GitHub repository
   - Set environment variables:
     NEXT_PUBLIC_SUPABASE_URL = [your value]
     NEXT_PUBLIC_SUPABASE_ANON_KEY = [your value]
     SUPABASE_SERVICE_ROLE_KEY = [your value]
     OPENAI_API_KEY = [your value]
   - Deploy

4. Set up Vercel Cron:
   - Verify vercel.json has the cron config
   - The cron should trigger /api/jobs/poll every 2 hours

5. Set up a custom domain (optional):
   - Buy smartapply.com or similar from Namecheap/GoDaddy
   - Add custom domain in Vercel settings
   - Update DNS records as instructed

6. Test the deployed version:
   - Sign up on the live site
   - Go through the full flow
   - Verify everything works the same as local

Let me know when deployment is successful.
```

---

## PART 3 — STARTING CLAUDE CODE (Follow these steps exactly)

### Step A — Copy the PRP file into your project folder
Before starting Claude Code, you need to put the PRP file where Claude Code can find it.

1. Download both files from this conversation:
   - SmartApply-PRP-v2-FINAL.md
   - SmartApply-Implementation-Plan.md (this file)

2. Move them to your project folder. In Terminal:
```
cp ~/Downloads/SmartApply-PRP-v2-FINAL.md ~/Documents/Projects/
cp ~/Downloads/SmartApply-Implementation-Plan.md ~/Documents/Projects/
```
(If they downloaded somewhere else, adjust the path)

### Step B — Start Claude Code
```
cd ~/Documents/Projects
claude
```

### Step C — Paste this ENTIRE block as your FIRST message to Claude Code

Copy everything between the ═══ lines below and paste it:

```
══════════════════════════════════════════════════════════════
CRITICAL INSTRUCTIONS — READ THIS BEFORE DOING ANYTHING
══════════════════════════════════════════════════════════════

You are building SmartApply — a job search co-pilot web app for 
software engineers. The complete product spec is in the file 
SmartApply-PRP-v2-FINAL.md — READ THAT ENTIRE FILE FIRST before 
doing anything else.

I am a COMPLETE BEGINNER. I do not know how to code. Follow these 
rules EXACTLY:

══════════════════════════════════════════════════════════════
RULE 1 — ALWAYS PLAN FIRST. NEVER CODE WITHOUT MY APPROVAL.
══════════════════════════════════════════════════════════════

For EVERY step, follow this exact process:

  1. THINK step by step about what needs to be built
  2. RESEARCH the correct way to implement it
  3. BRAINSTORM the best approach — consider alternatives
  4. PRESENT the plan to me in simple terms:
     - What you're going to build
     - What files you'll create or modify
     - What packages/tools you'll use and why
     - How it connects to the rest of the app
     - Estimated time
  5. ASK ME if I have any questions or changes
  6. ASK FOR GAPS — if ANYTHING is unclear, missing, or ambiguous
     in the PRP or my instructions, ASK ME before guessing.
     Do NOT assume. Do NOT make up requirements. ASK.
  7. WAIT for me to say "GO AHEAD" before writing ANY code

  If I say "PLAN" → show me the plan, ask questions, wait
  If I say "GO AHEAD" → implement the plan you showed me
  If I say "CHANGE" → modify the plan based on my feedback
  If I say "SKIP" → move to the next step

  NEVER start coding until I explicitly say "GO AHEAD"

══════════════════════════════════════════════════════════════
RULE 2 — ASK QUESTIONS WHEN IN DOUBT
══════════════════════════════════════════════════════════════

  - If you find a gap in the PRP → ASK ME
  - If two approaches could work → tell me both, recommend one, ASK ME
  - If a requirement is ambiguous → ASK ME to clarify
  - If you need info I haven't given (like API keys) → ASK ME
  - If something might break another part of the app → WARN ME
  - If a step will take a long time → TELL ME before starting
  - NEVER guess. NEVER assume. ALWAYS ask.

══════════════════════════════════════════════════════════════
RULE 3 — HOW TO WRITE CODE (when I say go ahead)
══════════════════════════════════════════════════════════════

  - Write ALL code yourself — never tell me to "add this to file X"
  - Create files, install packages, run commands directly
  - If something errors → fix it yourself before moving on
  - Explain what you're doing in SIMPLE terms as you go
  - After each major piece → TEST it works before continuing
  - If a test fails → fix it, don't move on broken

══════════════════════════════════════════════════════════════
RULE 4 — QUALITY STANDARDS
══════════════════════════════════════════════════════════════

  - Production-ready code — not quick hacks
  - Proper error handling on EVERY page and API route
  - Loading states, empty states, error states on every screen
  - Security: RLS on all tables, API keys in env vars only
  - TypeScript: proper types, no "any" types
  - Clean code: readable, commented where complex
  - Test each feature works before moving to the next

══════════════════════════════════════════════════════════════
RULE 5 — PROJECT LOCATION
══════════════════════════════════════════════════════════════

  The project must be created at: ~/Documents/Projects/smartapply
  ALL files go inside this folder. Do not create files elsewhere.
  The PRP file (SmartApply-PRP-v2-FINAL.md) is in the parent folder
  (~/Documents/Projects/).

══════════════════════════════════════════════════════════════
RULE 6 — USE YOUR SKILLS (VERY IMPORTANT)
══════════════════════════════════════════════════════════════

  You have plugin skills installed. USE THEM. For each step of 
  the project, check which skills are relevant and apply their 
  best practices. Here is the mapping:

  PLANNING PHASE (use for every step):
  - Use "blueprint" skill when planning architecture
  - Use "strategic-compact" for keeping code organized

  FRONTEND CODE (React/Next.js pages and components):
  - Use "frontend-patterns" for all React/Next.js code
  - Use "coding-standards" for clean, consistent code

  BACKEND CODE (API routes, server logic):
  - Use "backend-patterns" for all API routes
  - Use "api-design" for designing clean endpoints

  DATABASE (Supabase/PostgreSQL):
  - Use "postgres-patterns" for all database queries
  - Use "database-migrations" for schema changes

  AI/PROMPTS (GPT integration):
  - Use "prompt-optimizer" for ALL GPT prompts
    (resume tailoring prompt, match scoring prompt, etc.)
    This is CRITICAL — optimize every prompt before using it

  SECURITY (check after every phase):
  - Use "security-review" to review code after each phase
  - Use "security-scan" to scan for vulnerabilities
  - Run security review after Phase 1, 3, 5, and 7

  TESTING (after every major feature):
  - Use "verification-loop" to verify each step works
  - Use "tdd-workflow" when writing complex logic
    (match scoring, synonym filtering, staffing detection)
  - Use "e2e-testing" for full flow testing in Phase 7

  DEPLOYMENT:
  - Use "deployment-patterns" when deploying to Vercel

  CODE REVIEW (MANDATORY after every phase):
  After completing each PHASE (not each step), you MUST:
  1. Use "security-review" to check for security issues
  2. Use "coding-standards" to check code quality
  3. Use "verification-loop" to verify everything works
  4. Fix ANY issues found before moving to next phase
  5. Tell me the results: "Review complete. Found X issues. Fixed Y."

  HOW TO USE SKILLS:
  Before writing code for any step, check which skills apply
  from the list above. Read the skill's guidance. Apply its
  patterns and best practices to your code. This is not optional.

══════════════════════════════════════════════════════════════
STARTING POINT
══════════════════════════════════════════════════════════════

1. Read the SmartApply-PRP-v2-FINAL.md file now
2. Check which plugin skills you have available (list them)
3. Then start with Step 1.1 (Project Setup) in PLAN MODE:
   - Think step by step about what needs to be done
   - Research the correct way to set up this stack
   - Brainstorm if there are better alternatives
   - Check which skills from RULE 6 apply to this step
   - Show me your plan in simple terms
   - Tell me what tools/packages you'll use and why
   - Tell me which skills you'll apply
   - Ask ANY questions if there are gaps or doubts
   - Wait for my "GO AHEAD" before writing a single line of code

BEGIN.
```

---

## QUICK REFERENCE — Build Order Checklist

Check off each item as you complete it:

```
PHASE 1 — PROJECT SETUP
[ ] 1.1 Create Next.js project + install packages
[ ] 1.2 Setup Supabase client
[ ] 1.3 Create database schema + RLS policies
[ ] 1.4 Setup auth (login, signup, OAuth, middleware)
[ ] 🔍 PHASE 1 REVIEW — Run security-review + coding-standards + verification-loop

PHASE 2 — LANDING PAGE + ONBOARDING
[ ] 2.1 Landing page
[ ] 2.2 Onboarding wizard (all 6 steps)
[ ] 🔍 PHASE 2 REVIEW — Run security-review + coding-standards + verification-loop

PHASE 3 — JOB DATA PIPELINE
[ ] 3.1 Company seed data (100 companies)
[ ] 3.2 Synonym filter engine
[ ] 3.3 Staffing agency detection
[ ] 3.4 ATS API integration (Greenhouse, Lever, Ashby)
[ ] 3.5 Job polling pipeline + Vercel Cron
[ ] 🔍 PHASE 3 REVIEW — Run security-review + security-scan + coding-standards + verification-loop

PHASE 4 — JOB DASHBOARD
[ ] 4.1 Dashboard layout (nav, sidebar)
[ ] 4.2 Job feed (cards, filters, sorting, infinite scroll)
[ ] 4.3 Job detail page (JD + match analysis)
[ ] 🔍 PHASE 4 REVIEW — Run coding-standards + verification-loop

PHASE 5 — RESUME OPTIMIZER
[ ] 5.1 GPT optimization API route (use prompt-optimizer skill!)
[ ] 5.2 Optimizer UI (side-by-side comparison)
[ ] 5.3 Resume file generation (.docx download)
[ ] 🔍 PHASE 5 REVIEW — Run security-review + prompt-optimizer + coding-standards + verification-loop

PHASE 6 — REMAINING PAGES
[ ] 6.1 Application tracker
[ ] 6.2 My Resumes page
[ ] 6.3 Resume Rules page
[ ] 6.4 Settings page
[ ] 🔍 PHASE 6 REVIEW — Run coding-standards + verification-loop

PHASE 7 — TESTING + DEPLOYMENT
[ ] 7.1 Full end-to-end test (use e2e-testing skill)
[ ] 7.2 Final security-scan of entire codebase
[ ] 7.3 Deploy to Vercel (use deployment-patterns skill)
[ ] 🔍 FINAL REVIEW — Run ALL review skills on complete codebase
```
