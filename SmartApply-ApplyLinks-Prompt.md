TASK: Add career page URLs and fix direct job application links in SmartApply.

Think step by step. Brainstorm. Research the correct approach.
Ask me questions if ANY gaps or doubts. Show me the PLAN FIRST.
Only implement when I say GO AHEAD.

Use these skills: backend-patterns, postgres-patterns, frontend-patterns, coding-standards

══════════════════════════════════════════════════════════════
WHAT TO DO — 3 THINGS
══════════════════════════════════════════════════════════════

THING 1: Store career page URLs for every company
THING 2: Store and use direct apply URLs for every job
THING 3: Add source tracking so companies know applications came from SmartApply

══════════════════════════════════════════════════════════════
THING 1 — CAREER PAGE URLs FOR EVERY COMPANY
══════════════════════════════════════════════════════════════

Each ATS platform has a predictable career page URL pattern.
We should store these in the companies table.

URL PATTERNS:

  Greenhouse companies:
    Career page: https://boards.greenhouse.io/{board_token}
    Example: https://boards.greenhouse.io/stripe

  Lever companies:
    Career page: https://jobs.lever.co/{company_slug}
    Example: https://jobs.lever.co/spotify

  Ashby companies:
    Career page: https://jobs.ashbyhq.com/{company_slug}
    Example: https://jobs.ashbyhq.com/reddit

WHAT TO DO:

1. Check if the companies table already has a careers_url column.
   If not, add it.

2. For EVERY company in our database, generate the career page URL
   using this logic:

   if ats_platform === 'greenhouse':
     careers_url = `https://boards.greenhouse.io/${slug}`
   
   if ats_platform === 'lever':
     careers_url = `https://jobs.lever.co/${slug}`
   
   if ats_platform === 'ashby':
     careers_url = `https://jobs.ashbyhq.com/${slug}`

3. Write a script to backfill careers_url for all existing companies
   that don't have one yet.

4. When adding new companies in the future (seed script or polling),
   auto-generate the careers_url from the slug and platform.

5. Show the career page link on the Job Detail page:
   "View all jobs at [Company Name] →" linking to their careers_url

══════════════════════════════════════════════════════════════
THING 2 — DIRECT APPLY URLs FOR EVERY JOB
══════════════════════════════════════════════════════════════

All 3 ATS APIs already return apply URLs in their responses.
We need to make sure we're capturing and using them correctly.

WHERE THE APPLY URL COMES FROM:

  Greenhouse API response:
    Field: absolute_url
    Example: "https://boards.greenhouse.io/stripe/jobs/127817"
    NOTE: Greenhouse puts the description AND application form
    on the same page, so absolute_url IS the apply URL.

  Lever API response:
    Field: applyUrl (dedicated apply page)
    Field: hostedUrl (job description page)
    Example applyUrl: "https://jobs.lever.co/spotify/ff7ef527/apply"
    Example hostedUrl: "https://jobs.lever.co/spotify/ff7ef527"

  Ashby API response:
    Field: applyUrl (dedicated apply page)
    Field: jobUrl (job description page)
    Example applyUrl: "https://jobs.ashbyhq.com/reddit/apply"
    Example jobUrl: "https://jobs.ashbyhq.com/reddit/product-manager"

WHAT TO DO:

1. Check the jobs table — it should have an apply_url column.
   If not, add it.

2. Check our ATS API integration code (src/lib/ats/greenhouse.ts,
   lever.ts, ashby.ts) and make sure we're extracting the correct
   apply URL field from each API response:

   Greenhouse: use job.absolute_url as apply_url
   Lever: use job.applyUrl as apply_url (NOT hostedUrl)
   Ashby: use job.applyUrl as apply_url (NOT jobUrl)

3. If any existing jobs have empty or wrong apply_url values,
   write a backfill script to fix them.

4. On the Job Detail page and Job Cards, the "Apply" button
   should open the apply_url in a NEW TAB:
   
   <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
     Apply Now ↗
   </a>

5. When user clicks "Apply", also:
   - Log the application in the applications table
   - Save a JD snapshot
   - Show a toast: "Opening application page... Good luck!"

══════════════════════════════════════════════════════════════
THING 3 — SOURCE TRACKING
══════════════════════════════════════════════════════════════

Add tracking parameters to apply URLs so companies can see that
the applicant came from SmartApply. This is standard practice
and helps if we ever want to partner with companies.

Each ATS uses a different parameter:

  Greenhouse: ?gh_src=smartapply
  Lever: ?lever_source[]=smartapply
  Ashby: ?utm_source=smartapply

WHAT TO DO:

Create a utility function that appends the correct tracking
parameter based on the ATS source:

  function getTrackedApplyUrl(applyUrl: string, atsSource: string): string {
    const url = new URL(applyUrl);
    
    if (atsSource === 'greenhouse') {
      url.searchParams.set('gh_src', 'smartapply');
    } else if (atsSource === 'lever') {
      url.searchParams.append('lever_source[]', 'smartapply');
    } else if (atsSource === 'ashby') {
      url.searchParams.set('utm_source', 'smartapply');
    }
    
    return url.toString();
  }

Use this function EVERYWHERE an apply URL is displayed:
- Job cards "Apply" button
- Job detail page "Apply Now" button
- Resume optimizer "Apply with this resume" button

Store the ATS source in the jobs table if not already there
(should be in the source_api column).

══════════════════════════════════════════════════════════════
UI CHANGES
══════════════════════════════════════════════════════════════

JOB CARD — Update the Apply button:
  Current: [Apply] (might be broken or placeholder)
  New: [Apply ↗] → opens tracked apply_url in new tab
  Also show small text below: "Opens on [Greenhouse/Lever/Ashby]"

JOB DETAIL PAGE — Two apply-related elements:
  1. Big button: [Apply Now ↗] → opens tracked apply_url
  2. Link: "View all jobs at [Company] →" → opens careers_url
  3. Small badge: "✅ Via Greenhouse" or "✅ Via Lever" etc.

RESUME OPTIMIZER PAGE — After tailoring:
  1. [Apply with this resume ↗] → opens tracked apply_url in new tab
  2. Simultaneously logs the application in the tracker
  3. Toast: "Application page opened! Your tailored resume is 
     downloaded — upload it on the application form."

══════════════════════════════════════════════════════════════
IMPORTANT NOTES
══════════════════════════════════════════════════════════════

- The "Apply" button opens the COMPANY'S application page in a
  new tab. We do NOT submit applications through our app.
  The user fills out the form on the company's site themselves.

- We CANNOT embed the application form in an iframe. ATS platforms
  block this with X-Frame-Options headers. Don't try it.

- All API calls to Greenhouse/Lever/Ashby must go through our
  Next.js API routes (server-side), NOT from the browser.
  Lever and Ashby block CORS from unauthorized domains.

- If a job's apply_url is missing or broken, fall back to the
  company's careers_url as a backup link.

══════════════════════════════════════════════════════════════
PLAN FIRST
══════════════════════════════════════════════════════════════

Think step by step.
Show me what files need to change.
Show me the current state of apply_url handling.
Ask questions if anything is unclear.
Wait for my GO AHEAD.
