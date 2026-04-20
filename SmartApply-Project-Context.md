# SmartApply — Complete Project Context (April 2026)

## WHAT IS SMARTAPPLY

SmartApply is an AI job search co-pilot web app for software engineers. It does 3 things:
1. **Finds real jobs** from 104+ tech companies via Greenhouse/Lever/Ashby APIs every day, filters out staffing agencies
2. **AI-tailors your resume** using GPT-4o-mini for each specific job description, following user's custom rules
3. **Tracks applications** — logs every job applied to, which resume version was used, JD snapshot saved

**Co-pilot mode:** App finds/scores/tailors, user reviews and submits. NOT auto-apply.

---

## TECH STACK

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router) + TypeScript + Tailwind CSS |
| Auth & Database | Supabase (PostgreSQL + Auth + Storage) |
| AI/LLM | OpenAI GPT-4o-mini |
| Hosting | Vercel (Hobby plan) |
| Job Data | Greenhouse, Lever, Ashby free public APIs |

**Live URL:** https://smartapply-nine.vercel.app
**GitHub:** https://github.com/Sowmya-2901/smartapply
**Project Location:** ~/Documents/Projects/smartapply (MacOS)
**User:** Sowmya Bheemineedi (sowmyabheem), complete beginner (no coding experience)
**Supabase URL:** https://aocbhskbeymvfniiirut.supabase.co

---

## DATABASE SCHEMA (6 tables + Storage)

### companies table
- id, name, slug, ats_platform (greenhouse/lever/ashby), careers_url, website_url
- employee_count, industry, is_staffing_agency, staffing_detection_score
- verified, last_polled_at, created_at, updated_at
- **104 companies seeded** (Stripe, Airbnb, Anthropic, etc.)

### jobs table
- id, company_id (FK), external_id, title, description_html, description_text
- location, remote_type, salary_min, salary_max, department, employment_type
- required_skills (text[]), parsed_experience_years, seniority_level
- apply_url, source_api, filter_tags (text[] with GIN index)
- dedup_key (unique), is_active, posted_at, discovered_at
- **1,479 real jobs fetched**

### profiles table (35+ columns)
- id (refs auth.users), full_name, email, phone, linkedin/github/portfolio URLs
- Job preferences: job_titles[], preferred_states[], preferred_cities[], remote_preference, min_salary, experience_years, seniority_preferences[], no_new_grad, no_contract, work_authorization, show_clearance_jobs, only_show_sponsoring, excluded_companies[], company_size_preference[], freshness_preference, match_threshold
- Resume rules: formatting_rules, content_rules, banned_words[], custom_rules
- Profile: current_salary, expected_salary, willing_to_relocate, notice_period, screening_answers (jsonb)
- onboarding_completed_at (timestamptz)

### resumes table
- id, user_id (FK), type ('raw_base'/'master_optimized'/'job_tailored')
- job_id (FK, nullable), file_url, pdf_url, parsed_text, parsed_skills[]
- change_summary (jsonb), is_current, created_at

### applications table
- id, user_id (FK), job_id (FK), resume_id (FK)
- status ('saved'/'applied'/'phone_screen'/'interview'/'offer'/'accepted'/'rejected'/'withdrawn')
- match_score_at_application, applied_at, status_updated_at, notes, follow_up_date
- jd_snapshot (full JD saved at application time)

### user_job_matches table
- user_id + job_id (composite PK), match_score (0-100)
- skill_matches (jsonb), breakdown (jsonb), gate_failed, calculated_at

### Supabase Storage
- Bucket: 'resumes' with policies for authenticated users (SELECT, INSERT, UPDATE)
- RLS enabled on ALL tables

---

## WHAT'S BUILT (Status: ~90% complete)

### ✅ COMPLETED

**Phase 1 — Foundation:**
- Next.js project with TypeScript + Tailwind
- Supabase connection (browser + server + admin clients)
- 6 database tables with RLS policies
- Email/password + Google OAuth + GitHub OAuth authentication

**Phase 2 — Landing Page + Onboarding:**
- Landing page with hero, features, CTA
- 7-step onboarding wizard: upload resume → resume rules → AI optimization → job preferences → auto-fill profile → answer bank → finish
- Resume upload with success confirmation (green checkmark, skill count)
- Resume rules editor (formatting, content, banned words, custom rules)
- Master resume optimization (GPT-4o-mini)

**Phase 3 — Job Data Pipeline:**
- 104 real tech companies with verified ATS slugs
- Greenhouse, Lever, Ashby API integrations
- 1,479 real jobs fetched
- Synonym filter engine (visa tags, contract, new grad, remote, experience parsing)
- Staffing agency detection (3 layers: name keywords + blocklist + JD scan)
- Job polling cron (once daily on Vercel Hobby plan)
- Career page URLs auto-generated for all companies
- Direct apply URLs with source tracking (?gh_src=smartapply, ?lever_source[]=smartapply, ?utm_source=smartapply)

**Phase 4 — Job Dashboard:**
- Job feed with cards showing match scores, skills, badges
- 11 filters: job titles, seniority, experience years, new grad, work authorization (10 visa types with smart filtering), location (remote + 50 states + cities), salary, contract, exclude companies, company size, freshness
- Sort by newest/best match
- Job detail page with full JD, match analysis, career page link, ATS badge
- "Via Greenhouse/Lever/Ashby" badges on all job cards

**Phase 5 — Resume Optimizer:**
- GPT-4o-mini per-JD resume tailoring with 7-step keyword placement strategy
- Side-by-side comparison view
- Change summary (skills added, bullets modified, keyword match count)
- .docx download
- All user's custom rules sent to GPT every call

**Phase 6 — Remaining Pages:**
- Application tracker with status pipeline
- My Resumes page (raw, master, tailored versions)
- Resume Rules editor page
- Settings page with all 11 filters

**Phase 7 — Deployment:**
- Deployed to Vercel at https://smartapply-nine.vercel.app
- GitHub repo at https://github.com/Sowmya-2901/smartapply
- Google OAuth + GitHub OAuth configured
- Supabase production URL configured

**CareerOps-Inspired Improvements:**
- Gate-pass scoring: skills < 40% → cap at 35%, title < 30% → cap at 40%
- 7-step keyword placement strategy in GPT prompt
- Better dedup detection (company::title::location normalization)
- 14 additional companies added (Confluent, Mistral, Cohere, etc.)

**Work Authorization System (10 visa types):**
- US Citizen, Green Card, H1-B, H4 EAD, STEM OPT, OPT, L1, TN, Other, No Auth
- Each status auto-hides incompatible jobs based on 8 filter tags
- Override toggles: show clearance jobs, only show sponsoring companies

---

## ✅ RECENTLY FIXED BUGS (commit 009e617)

### FIXED: "Go to Dashboard" button slow
- Added loading spinner animation
- Button disabled after first click (prevents double-clicks)
- Shows "Redirecting to dashboard..." text while navigating
- File: src/app/onboarding/page.tsx

### FIXED: My Resumes page empty
- Master optimized resume now saves to database after GPT optimization
- Query improved: sorts by created_at DESC for most recent resumes
- Database migration added: unique constraint (one is_current per type per user)
- Files: src/app/onboarding/page.tsx, src/app/dashboard/resumes/page.tsx

### FIXED: No jobs showing on dashboard
- Created "Fetch Jobs Now" button (JobFetchButton component)
- Button calls /api/jobs/poll via server action
- Shows "Fetching jobs from 104 companies..." during poll
- Displays success/error messages, refreshes dashboard automatically
- Files: src/app/dashboard/actions.ts (NEW), src/components/dashboard/JobFetchButton.tsx (NEW), src/app/dashboard/page.tsx

### FIXED: Resume upload confirmation
- Shows green checkmark, file name, extracted skills count after upload
- "Continue to Step 2" button (no longer auto-advances)
- File: src/app/onboarding/page.tsx

### FIXED: Onboarding infinite loop
- Added onboarding_completed_at timestamp column
- Completion check now uses EITHER experience_years OR onboarding_completed_at
- Fallback: if preferences save fails, at least saves experience_years
- File: src/app/onboarding/page.tsx

---

## ⏳ REMAINING ISSUES

### ISSUE: Vercel auto-deploy may not be working
- Code pushed to GitHub via API (not git push — git push hangs on user's network)
- Fix: Vercel Dashboard → Project → Settings → Git → verify GitHub connected
- Workaround: Vercel Dashboard → Deployments → "..." → Redeploy manually

### ISSUE: Database migrations need to be run manually
- Any new columns added in code must be run as SQL in Supabase SQL Editor
- Already run: 20 profile columns + onboarding_completed_at + resume unique constraint
- Check schema.sql for any new migrations before testing

### ISSUE: Design polish needed
- Onboarding and settings pages need better visual design
- Better spacing, card layouts, section headers with icons
- Make it look premium, not prototype

---

## KEY DECISIONS MADE

1. **No favorites/learning system** — Too risky for MVP, could hide good jobs. Simple filters only.
2. **No resume variants** — One base resume, AI adjusts per JD.
3. **Co-pilot mode only** — User clicks submit. No auto-apply.
4. **60%+ match threshold** to show jobs
5. **Gate-pass scoring** — Skills < 40% or title < 30% caps the score regardless
6. **Two-step resume system** — Master optimization once, then per-JD tailoring every time
7. **Free ATS APIs** — Greenhouse/Lever/Ashby cover ~60-70% of tech jobs
8. **Redirect-to-apply** — Can't submit through API (needs company API keys). Open apply URL in new tab.
9. **Daily cron** on Vercel Hobby (free). Can use cron-job.org for every 2 hours.
10. **Work authorization dropdown** with 10 options + automatic filter rules per status

---

## FILE STRUCTURE (key files)

```
smartapply/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # Landing page
│   │   ├── login/page.tsx                    # Login page (email + OAuth)
│   │   ├── signup/page.tsx                   # Signup page
│   │   ├── auth/callback/route.ts            # OAuth callback handler
│   │   ├── onboarding/page.tsx               # 7-step onboarding wizard
│   │   ├── dashboard/
│   │   │   ├── page.tsx                      # Job feed with 11 filters
│   │   │   ├── actions.ts                    # Server actions (manual job poll)
│   │   │   ├── jobs/[id]/page.tsx            # Job detail page
│   │   │   ├── optimize/[jobId]/page.tsx     # Resume optimizer
│   │   │   ├── tracker/page.tsx              # Application tracker
│   │   │   ├── resumes/page.tsx              # My Resumes
│   │   │   ├── rules/page.tsx                # Resume Rules editor
│   │   │   └── settings/page.tsx             # Settings
│   │   └── api/
│   │       ├── resume/
│   │       │   ├── upload/route.ts           # Resume upload endpoint
│   │       │   └── optimize/route.ts         # GPT resume tailoring
│   │       ├── jobs/
│   │       │   ├── poll/route.ts             # Job polling from ATS APIs
│   │       │   └── calculate-matches/route.ts # Match score calculation
│   │       └── applications/route.ts         # Create/get applications
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                     # Browser client
│   │   │   ├── server.ts                     # Server client
│   │   │   ├── admin.ts                      # Admin client (service role)
│   │   │   └── schema.sql                    # Full database schema
│   │   ├── ats/
│   │   │   ├── greenhouse.ts                 # Greenhouse API integration
│   │   │   ├── lever.ts                      # Lever API integration
│   │   │   └── ashby.ts                      # Ashby API integration
│   │   ├── filters/
│   │   │   ├── synonyms.ts                   # Skill synonyms + match scoring + filter engine
│   │   │   ├── workAuthorization.ts          # Work auth filter logic (10 visa types)
│   │   │   └── staffingDetector.ts           # Staffing agency detection
│   │   ├── utils/
│   │   │   ├── applyTracking.ts              # Source tracking for apply URLs
│   │   │   ├── titleMatch.ts                 # Job title matching
│   │   │   └── dedup.ts                      # Duplicate job detection
│   │   └── data/
│   │       ├── companies.json                # 104 company seed data
│   │       └── staffing-companies.json       # Staffing agency blocklist
│   └── components/
│       ├── dashboard/
│       │   └── JobFetchButton.tsx             # Manual job polling button
│       ├── forms/
│       │   ├── JobPreferencesForm.tsx         # Reusable 11-filter form
│       │   ├── TagInput.tsx                   # Multi-tag input
│       │   ├── MultiSelectCheckbox.tsx
│       │   ├── ToggleSwitch.tsx
│       │   ├── RadioGroup.tsx
│       │   ├── StateSelector.tsx              # 50 US states + DC
│       │   └── SalaryInput.tsx
│       └── auth/
│           ├── OAuthButton.tsx               # Google/GitHub OAuth buttons
│           └── ProviderIcons.tsx              # OAuth provider SVG icons
├── scripts/
│   ├── backfill-career-urls.ts               # Backfill company career URLs
│   └── backfill-dedup-keys.ts                # Backfill job dedup keys
├── middleware.ts                              # Auth + route protection
├── vercel.json                               # Cron config (daily at midnight)
└── .env.local                                # API keys (gitignored)
```

---

## ENVIRONMENT VARIABLES (in .env.local and Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=https://aocbhskbeymvfniiirut.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
OPENAI_API_KEY=<openai api key>
```

---

## OAUTH CONFIGURATION

**Google OAuth:**
- Google Cloud Project: SmartApply (smartapply-493514)
- Client ID: 1002855839844-8c3ukg5mtqqne96fst7bkebprevufo2t.apps.googleusercontent.com
- Redirect URI: https://aocbhskbeymvfniiirut.supabase.co/auth/v1/callback

**GitHub OAuth:**
- App: SmartApply
- Callback URL: https://aocbhskbeymvfniiirut.supabase.co/auth/v1/callback

**Supabase Auth:**
- Site URL: https://smartapply-nine.vercel.app
- Redirect URLs: https://smartapply-nine.vercel.app/auth/callback, http://localhost:3000/auth/callback

---

## GIT PUSH ISSUE

Git push (both HTTPS and SSH) hangs on the user's Mac network. Workaround:
- All code is pushed via **GitHub API** using `gh api repos/Sowmya-2901/smartapply/contents/{path} --method PUT`
- Claude Code has a script that uploads files one by one via this API
- This is a network-specific issue, not a code issue

---

## USER'S BACKGROUND (for resume tailoring context)

- Name: Sowmya Bheemineedi
- Skills: Java, Spring Boot, AWS, Kafka, Microservices, Python, SQL
- Experience: ~2 years
- Visa: STEM OPT
- Focus: Fintech/Backend Engineering
- Has a 400+ company target list organized by sector (Big Tech, Fintech, Banking, etc.)
- Looking for: Software Engineer, Backend Engineer, Java Developer, SDE roles

---

## FUTURE FEATURES (Phase 2-4)

- Chrome extension for auto-filling career page forms with answer bank
- Smart form highlighting (green/yellow/red for filled fields)
- Interview prep / story bank (from Career-Ops analysis)
- JSearch API for broader job coverage ($25/mo)
- Email notifications for new high-match jobs
- Cover letter generator
- External cron (cron-job.org) for every-2-hour polling
- Company verification via free APIs (SEC EDGAR, OpenCorporates)
- PDF resume download
- Workday scraping for bank/enterprise jobs

---

## DOCUMENTS CREATED IN THIS SESSION

All saved at /mnt/user-data/outputs/:
1. SmartApply-PRP-v2-FINAL.md — Complete product requirements
2. SmartApply-Implementation-Plan.md — Step-by-step build guide
3. SmartApply-Claude-Code-Prompt.md — First message for Claude Code
4. SmartApply-Filters-Prompt.md — 11-filter system prompt
5. SmartApply-ApplyLinks-Prompt.md — Career URLs + apply links prompt
6. SmartApply-CareerOps-Improvements.md — 4 improvements from Career-Ops

---

## CLAUDE CODE INSTRUCTIONS (paste at start of any new session)

```
You are continuing work on SmartApply — a job search co-pilot web app.
Project location: ~/Documents/Projects/smartapply
Read SmartApply-Project-Context.md for full project context.

RULES:
1. PLAN FIRST — think step by step, ask questions, wait for GO AHEAD
2. Write ALL code yourself — I'm a complete beginner
3. Test after each change
4. Use plugin skills: frontend-patterns, backend-patterns, postgres-patterns, coding-standards, security-review, verification-loop, prompt-optimizer
5. Push to GitHub via API (git push hangs): gh api repos/Sowmya-2901/smartapply/contents/{path} --method PUT
6. After code review, upload fixed files to GitHub
```

---

## HOW TO USE THIS FILE ACROSS SESSIONS

**START of every session (Claude.ai or Claude Code):**
Upload this file and say: "Read SmartApply-Project-Context.md. Then do this ONE task: [your task]"

**END of every session:**
Say: "Update SmartApply-Project-Context.md with everything we did in this session"

**Keep it in your project folder:**
```
cp ~/Downloads/SmartApply-Project-Context.md ~/Documents/Projects/smartapply/
```

This way Claude Code can read it automatically at session start.

**SAVE TOKENS — One task per chat. Upload this file instead of explaining the project.**
