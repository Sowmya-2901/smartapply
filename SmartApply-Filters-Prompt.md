TASK: Build/update the complete Job Preferences & Filters system for SmartApply.

Think step by step. Brainstorm the best approach. Research correct implementation.
Ask me questions if ANY gaps or doubts. Show me the plan FIRST.
Only implement when I say GO AHEAD.

Use these skills: frontend-patterns, backend-patterns, postgres-patterns, coding-standards

══════════════════════════════════════════════════════════════
WHAT TO BUILD
══════════════════════════════════════════════════════════════

A comprehensive Job Preferences page where users select ALL their 
filters, save them, and the app ONLY shows jobs matching those filters.

This affects THREE places in the app:
1. Settings → Job Preferences page (where user sets/edits filters)
2. Onboarding Step 4 (where user sets filters for the first time)
3. Job Dashboard feed query (filters applied when showing jobs)

ALL filters must be saved to the profiles table in Supabase.
ALL filters must be used when querying jobs for the dashboard.

══════════════════════════════════════════════════════════════
COMPLETE LIST OF FILTERS TO BUILD
══════════════════════════════════════════════════════════════

FILTER 1 — JOB TITLES (what roles to search for)
  - Multi-tag input (user types and presses Enter to add)
  - Can add multiple: "Backend Engineer", "SDE II", "Platform Engineer"
  - These are matched against job titles in the database
  - Save as: text array in profiles.job_titles

FILTER 2 — EXPERIENCE LEVEL (seniority)
  - Multi-select checkboxes, user can pick one or more:
    ☐ Entry Level / Junior
    ☐ Mid Level
    ☐ Senior
    ☐ Staff
    ☐ Principal / Distinguished
    ☐ Lead
  - Save as: text array in profiles.seniority_preferences

FILTER 3 — YEARS OF EXPERIENCE
  - Number input with label: "I have ___ years of experience"
  - App shows jobs requiring THIS number or FEWER years
  - Example: User enters "5" → sees jobs asking for 0-5 years, 
    hides jobs asking for 7+ years
  - Save as: integer in profiles.experience_years

FILTER 4 — NEW GRAD POSITIONS
  - Toggle switch with label:
    "Hide New Grad / Entry Level positions" [ON/OFF]
  - Default: OFF (show everything)
  - When ON: hides jobs tagged as 'new_grad_job'
  - Save as: boolean in profiles.no_new_grad

FILTER 5 — WORK AUTHORIZATION (this is the critical one)
  
  Step A — User selects their status:
  Dropdown or radio buttons:
    "What is your work authorization status?"
    ○ US Citizen
    ○ Green Card / Permanent Resident
    ○ H1B Visa
    ○ H4 EAD (H4 with Employment Authorization)
    ○ STEM OPT
    ○ OPT (non-STEM)
    ○ L1 Visa
    ○ TN Visa
    ○ Other Work Authorization
    ○ No Work Authorization (need full sponsorship)
  Save as: text in profiles.work_authorization
  
  Step B — Based on their selection, AUTOMATICALLY apply these filter rules:

  IF user = "US Citizen" or "Green Card":
    → Show ALL jobs (no restrictions apply to them)
    → They can work anywhere, clearance eligible, no sponsorship needed
  
  IF user = "H1B Visa":
    → HIDE jobs that say: "no H1B", "US citizens only", 
      "clearance required", "must be US person", "no sponsorship",
      "cannot sponsor", "will not sponsor"
    → SHOW jobs that say: "H1B welcome", "visa sponsorship available",
      "will sponsor", OR jobs that don't mention any restriction
  
  IF user = "H4 EAD":
    → HIDE same as H1B plus: "no H4", "no EAD"
    → SHOW jobs that don't restrict work authorization
  
  IF user = "STEM OPT":
    → HIDE jobs that say: "no OPT", "no STEM OPT", "no international 
      students", "US citizens only", "clearance required", 
      "permanent work authorization required", "no sponsorship"
    → SHOW jobs that say: "OPT welcome", "sponsorship available",
      OR jobs that don't mention any restriction
  
  IF user = "OPT (non-STEM)":
    → Same as STEM OPT but stricter (shorter work period)
    → HIDE all jobs requiring sponsorship long-term
  
  IF user = "L1 Visa" or "TN Visa":
    → HIDE jobs requiring US citizenship or clearance
    → SHOW most other jobs
  
  IF user = "No Work Authorization":
    → ONLY show jobs that explicitly say "visa sponsorship available"
      or "will sponsor"
    → HIDE everything else

  Step C — Additional toggles (user can override):
    ☐ "Show jobs requiring security clearance" [default OFF for non-citizens]
    ☐ "Only show jobs that explicitly offer visa sponsorship" [default OFF]

  Save override toggles as: booleans in profiles

FILTER 6 — LOCATION
  
  Section A — Work Type:
  Radio buttons:
    ○ Remote only
    ○ Hybrid (some days in office)
    ○ Onsite only
    ○ Any (show all)
  Save as: text in profiles.remote_preference
  
  Section B — Location (shown for Hybrid, Onsite, or Any):
  
  Country: United States (pre-selected, can change later)
  
  States: Multi-select dropdown with ALL 50 US states + DC
    User can pick multiple: "California", "Texas", "New York", "Washington"
    Include an "Any state" option
  Save as: text array in profiles.locations
  
  Cities (optional): Multi-tag input
    User can type specific cities: "San Francisco", "Austin", "Seattle"
    This is optional — states are the primary filter
  Save as: text array in profiles.preferred_cities

FILTER 7 — SALARY RANGE
  - Slider or number input: "Minimum expected salary"
  - Range: $0 to $500,000
  - Label shows: "$150,000+"
  - Only show jobs where salary_max >= user's minimum
    (if job has no salary data, still show it — don't hide)
  - Save as: integer in profiles.min_salary

FILTER 8 — CONTRACT / TEMP JOBS
  - Toggle: "Hide contract and temporary positions" [ON/OFF]
  - Default: ON (hide them)
  - When ON: hides jobs tagged as 'contract_job'
  - Save as: boolean in profiles.no_contract

FILTER 9 — EXCLUDE COMPANIES
  - Multi-tag input: "Companies you don't want to see"
  - User types company names and presses Enter
  - Example: "Amazon", "Meta", "Google" (if they've already been rejected there)
  - Save as: text array in profiles.excluded_companies

FILTER 10 — COMPANY SIZE
  - Multi-select checkboxes:
    ☐ Startups (1-50 employees)
    ☐ Mid-size (51-500 employees)
    ☐ Large (500+ employees)
    ☐ Show all sizes
  - Default: Show all
  - Save as: text array in profiles.company_size_preference

FILTER 11 — JOB FRESHNESS
  - Dropdown: "Show jobs posted within:"
    - Last 4 hours
    - Last 24 hours (Today)
    - Last 3 days
    - Last 7 days (This week)
    - Last 30 days
    - All time
  - Default: Last 7 days
  - Save as: text in profiles.freshness_preference

══════════════════════════════════════════════════════════════
HOW THE FILTERS WORK IN THE JOB FEED
══════════════════════════════════════════════════════════════

When the user opens the dashboard, the job query should:

1. Load ALL user's saved preferences from profiles table
2. Query the jobs table with these conditions:

   WHERE
     jobs.is_active = true
     AND companies.is_staffing_agency = false
     
     -- FILTER 1: Job titles
     AND (jobs.title ILIKE any of user's job_titles patterns)
     
     -- FILTER 2: Seniority
     AND (jobs.seniority_level IN user's seniority_preferences OR seniority is null)
     
     -- FILTER 3: Experience years
     AND (jobs.parsed_experience_years <= user's experience_years OR parsed_experience_years is null)
     
     -- FILTER 4: New grad
     AND (if no_new_grad = true: 'new_grad_job' NOT IN jobs.filter_tags)
     
     -- FILTER 5: Work authorization
     AND (apply work authorization rules based on user's status — see logic above)
     
     -- FILTER 6: Location
     AND (if remote_preference = 'remote': jobs.remote_type = 'remote' or 'remote' in filter_tags)
     AND (if locations set: jobs.location matches any of user's states/cities)
     
     -- FILTER 7: Salary
     AND (jobs.salary_max >= user's min_salary OR salary_max is null)
     
     -- FILTER 8: Contract
     AND (if no_contract = true: 'contract_job' NOT IN jobs.filter_tags)
     
     -- FILTER 9: Excluded companies
     AND (companies.name NOT IN user's excluded_companies)
     
     -- FILTER 10: Company size
     AND (companies.employee_count in user's size range OR employee_count is null)
     
     -- FILTER 11: Freshness
     AND (jobs.discovered_at >= now() - user's freshness interval)

3. Then calculate match score for remaining jobs
4. Only show jobs with match_score >= 60%
5. Sort by discovered_at DESC, match_score DESC

══════════════════════════════════════════════════════════════
SYNONYM DICTIONARY FOR WORK AUTHORIZATION DETECTION
══════════════════════════════════════════════════════════════

The synonym filter engine must detect these phrases in job descriptions
and tag jobs appropriately:

TAG: "requires_us_citizenship"
Match phrases:
  "us citizen", "u.s. citizen", "united states citizen",
  "us citizenship required", "must be a us citizen",
  "us persons only", "u.s. persons only"

TAG: "requires_clearance"
Match phrases:
  "security clearance", "clearance required", "active clearance",
  "TS/SCI", "TS SCI", "top secret", "secret clearance",
  "public trust", "ITAR", "ITAR restricted", "EAR",
  "must be clearable", "ability to obtain clearance"

TAG: "no_sponsorship"
Match phrases:
  "no visa sponsorship", "will not sponsor", "cannot sponsor",
  "does not sponsor", "unable to sponsor", "not sponsor",
  "without sponsorship", "no sponsorship available",
  "independent work authorization required",
  "must be authorized to work without sponsorship",
  "permanent work authorization required"

TAG: "no_opt"
Match phrases:
  "no OPT", "no STEM OPT", "no CPT",
  "no international students", "not accept OPT",
  "OPT not accepted", "does not accept OPT"

TAG: "no_h1b"
Match phrases:
  "no H1B", "no H-1B", "not accept H1B",
  "H1B not accepted", "does not accept H1B",
  "no H1-B sponsorship"

TAG: "no_h4"
Match phrases:
  "no H4", "no H-4", "no H4 EAD",
  "H4 EAD not accepted", "no EAD"

TAG: "sponsors_visa"
Match phrases:
  "visa sponsorship available", "will sponsor",
  "sponsorship available", "H1B welcome",
  "open to sponsorship", "sponsor qualified candidates",
  "sponsorship provided", "we sponsor visas"

TAG: "requires_permanent_authorization"
Match phrases:
  "permanent work authorization",
  "green card or citizen",
  "permanent resident or citizen",
  "must have permanent authorization",
  "authorized to work permanently"

══════════════════════════════════════════════════════════════
WORK AUTHORIZATION FILTER LOGIC
══════════════════════════════════════════════════════════════

Based on user's work_authorization value, apply these rules:

user = "US Citizen":
  → Show ALL jobs. No filtering needed.
  
user = "Green Card / Permanent Resident":
  → HIDE: requires_us_citizenship
  → SHOW: everything else (including clearance jobs — they can get clearance)
  
user = "H1B Visa":
  → HIDE: requires_us_citizenship, requires_clearance, no_sponsorship, 
    no_h1b, requires_permanent_authorization
  → SHOW: sponsors_visa, and any job with NO authorization tags
  
user = "H4 EAD":
  → HIDE: requires_us_citizenship, requires_clearance, no_sponsorship,
    no_h1b, no_h4, requires_permanent_authorization
  → SHOW: sponsors_visa, and any job with NO authorization tags
  
user = "STEM OPT":
  → HIDE: requires_us_citizenship, requires_clearance, no_sponsorship,
    no_opt, no_h1b, requires_permanent_authorization
  → SHOW: sponsors_visa, and any job with NO authorization tags
  
user = "OPT (non-STEM)":
  → HIDE: same as STEM OPT (even stricter in practice)
  → SHOW: only sponsors_visa, and jobs with NO authorization tags
  
user = "L1 Visa":
  → HIDE: requires_us_citizenship, requires_clearance, no_sponsorship,
    requires_permanent_authorization
  → SHOW: everything else
  
user = "TN Visa":
  → HIDE: requires_us_citizenship, requires_clearance, no_sponsorship,
    requires_permanent_authorization
  → SHOW: everything else
  
user = "Other Work Authorization":
  → HIDE: requires_us_citizenship, requires_clearance, no_sponsorship,
    requires_permanent_authorization
  → SHOW: sponsors_visa, and jobs with NO authorization tags
  
user = "No Work Authorization":
  → ONLY SHOW: jobs tagged with sponsors_visa
  → HIDE: everything else

══════════════════════════════════════════════════════════════
UI DESIGN FOR THE PREFERENCES PAGE
══════════════════════════════════════════════════════════════

The Job Preferences page should be clean and organized in sections.
Each section has a card with a header and the filter controls inside.
Use the existing app design (dark navy sidebar, white cards, modern look).

Layout:

SECTION 1: "What roles are you looking for?"
  - Job titles (multi-tag input)
  - Seniority level (checkboxes)
  - Years of experience (number input)
  - New grad toggle

SECTION 2: "Work Authorization"
  - Your status (dropdown)
  - Show clearance jobs toggle (conditional)
  - Only show sponsoring companies toggle (conditional)
  - Info box: shows what's being filtered based on selection
    Example: "Based on your H1B status, we're hiding jobs that 
    require US citizenship, security clearance, or don't sponsor visas."

SECTION 3: "Location Preferences"
  - Work type (Remote / Hybrid / Onsite / Any)
  - States (multi-select dropdown — all 50 states + DC)
  - Cities (multi-tag input, optional)

SECTION 4: "Salary & Job Type"
  - Minimum salary (slider or number input)
  - Hide contract/temp jobs toggle
  - Job freshness dropdown

SECTION 5: "Company Preferences"
  - Exclude companies (multi-tag input)
  - Company size (checkboxes)

Bottom of page:
  [Save Preferences] button — saves everything to profiles table
  Show success toast: "Preferences saved! Your job feed will update."

══════════════════════════════════════════════════════════════
DATABASE CHANGES NEEDED
══════════════════════════════════════════════════════════════

Check if these columns exist in the profiles table. Add any that are missing:

  work_authorization (text) — user's visa/citizenship status
  show_clearance_jobs (boolean, default false)
  only_show_sponsoring (boolean, default false)
  preferred_states (text array) — selected US states
  preferred_cities (text array) — specific cities
  seniority_preferences (text array)
  experience_years (integer)
  no_new_grad (boolean, default false)
  no_contract (boolean, default true)
  job_titles (text array)
  remote_preference (text)
  min_salary (integer)
  excluded_companies (text array)
  company_size_preference (text array)
  freshness_preference (text, default '7days')

Also update the jobs table filter_tags to include the new authorization tags:
  requires_us_citizenship, requires_clearance, no_sponsorship,
  no_opt, no_h1b, no_h4, sponsors_visa, requires_permanent_authorization

Update the synonym filter engine to detect all the new phrases listed above.

══════════════════════════════════════════════════════════════
ALSO UPDATE THESE EXISTING PAGES
══════════════════════════════════════════════════════════════

1. ONBOARDING STEP 4 — should use the SAME filter form as the
   Preferences page. Don't build two separate forms. Create a
   reusable component that both pages use.

2. JOB DASHBOARD — update the feed query to apply ALL filters
   from the user's saved preferences.

3. JOB CARDS — show relevant badges:
   - "🟢 Sponsors Visa" badge on jobs that offer sponsorship
   - "🔒 Clearance Required" badge on clearance jobs
   - "📍 Remote" / "📍 Hybrid" / "📍 Onsite" badge

4. SETTINGS PAGE — the Job Preferences tab should link to or 
   embed the same preferences form.

══════════════════════════════════════════════════════════════
IMPORTANT NOTES
══════════════════════════════════════════════════════════════

- ALL filters must be saved to the database so they persist
  across sessions. User sets once, works forever.
- User can change any filter anytime from Settings.
- When a filter has no data (e.g., job doesn't list salary),
  DON'T hide the job — show it with "Salary not listed"
- When a job doesn't mention any work authorization requirement,
  assume it's open to everyone — DON'T hide it.
- The work authorization dropdown should show a helpful description
  under each option so users know what to pick.
- Make the preferences form a REUSABLE COMPONENT used in both
  Onboarding and Settings.

══════════════════════════════════════════════════════════════
PLAN FIRST
══════════════════════════════════════════════════════════════

Think step by step. 
Brainstorm the best way to implement this.
Check which skills apply (frontend-patterns, postgres-patterns, etc.)
Show me your plan.
Ask me questions if anything is unclear.
Wait for my GO AHEAD before coding.
