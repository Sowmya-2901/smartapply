TASK: Implement 4 improvements to SmartApply inspired by the Career-Ops open-source project.

Think step by step. Brainstorm the best approach. Research correct implementation.
Ask me questions if ANY gaps or doubts. Show me the PLAN FIRST for ALL 4 items.
Only implement when I say GO AHEAD.

Use these skills: backend-patterns, postgres-patterns, prompt-optimizer, coding-standards, verification-loop

══════════════════════════════════════════════════════════════
OVERVIEW — 4 IMPROVEMENTS TO MAKE
══════════════════════════════════════════════════════════════

1. Gate-pass scoring rule (fix match scoring logic)
2. 7-step keyword placement strategy (improve GPT resume prompt)
3. Add 45+ new companies to seed database
4. Better duplicate job detection

Do them in this order. Plan ALL 4 first. Ask questions. 
Wait for GO AHEAD before implementing any of them.

══════════════════════════════════════════════════════════════
IMPROVEMENT 1 — GATE-PASS SCORING RULE
══════════════════════════════════════════════════════════════

PROBLEM:
Right now, a job could score 75% overall because it has great salary,
location, and title match — even though the user has ZERO of the
required skills. That's a useless recommendation.

SOLUTION:
Add a "gate-pass" rule to the match scoring system. Two dimensions
are mandatory minimums — if either fails, the overall score is capped.

LOGIC:

  Calculate all 5 dimensions as normal:
    - skill_match (50% weight)
    - experience_match (20% weight)
    - location_match (10% weight)
    - title_match (10% weight)
    - salary_match (10% weight)

  GATE-PASS CHECK (run AFTER calculating the base score):
  
    gate_1 = skill_match percentage (how many JD skills user has)
    gate_2 = title_match percentage (how close is JD title to user's preferred titles)
    
    IF gate_1 < 40% (user has less than 40% of required skills):
      → Cap the final score at maximum 35%
      → Add a flag: gate_failed = "skills"
      → This job will NOT appear in the feed (below 60% threshold)
    
    IF gate_2 < 30% (job title is completely different from what user wants):
      → Cap the final score at maximum 40%
      → Add a flag: gate_failed = "title"
    
    IF both gates pass:
      → Use the normal calculated score

  Store the gate_failed flag in user_job_matches table so the
  job detail page can explain WHY a job scored low if needed.

WHERE TO IMPLEMENT:
  Find the existing match scoring function (likely in src/lib/ somewhere).
  Add the gate-pass logic after the base score calculation.
  Update the user_job_matches table schema if needed to store gate_failed.

══════════════════════════════════════════════════════════════
IMPROVEMENT 2 — 7-STEP KEYWORD PLACEMENT STRATEGY
══════════════════════════════════════════════════════════════

PROBLEM:
Our current GPT prompt for resume tailoring says "add keywords naturally"
but doesn't specify WHERE to place them. ATS systems weight different
sections differently — keywords in the Summary get more weight than
keywords buried in the 4th bullet of your 2nd job.

SOLUTION:
Update the GPT system prompt for resume tailoring (the per-JD
optimization in the /api/resume/optimize route) to follow this
specific 7-step keyword placement strategy:

NEW INSTRUCTIONS TO ADD TO THE GPT SYSTEM PROMPT:

```
KEYWORD PLACEMENT STRATEGY — Follow these 7 steps in order:

Step 1 — EXTRACT: Identify the top 15-20 keywords and phrases from 
the job description. Prioritize: required skills, tools, technologies,
methodologies, and domain-specific terms.

Step 2 — SUMMARY PLACEMENT (highest ATS weight): 
Place the 5 most important keywords naturally into the 
Professional Summary section. ATS parsers read and weight the 
summary section most heavily. Every critical skill should appear here.

Step 3 — FIRST BULLET PLACEMENT (second highest weight):
For each work experience entry, ensure the FIRST bullet point 
contains 1-2 relevant JD keywords. ATS systems often weight 
the first bullet of each role more heavily than subsequent bullets.
Rewrite the first bullet to naturally include the most relevant 
keyword for that role.

Step 4 — SKILLS SECTION PLACEMENT:
Add ALL missing technical skills to the Skills section.
Group them logically under existing categories.
This ensures keyword-for-keyword ATS matching.

Step 5 — EXPERIENCE REORDERING:
Reorder bullet points within each job so that the most 
JD-relevant bullets appear FIRST. Do NOT delete any bullets —
only change the order. Most relevant experience floats to the top.

Step 6 — PROJECT SELECTION:
If the resume has a Projects section, ensure the most relevant 
projects to this JD are listed first. Add JD keywords to project 
descriptions where they naturally fit.

Step 7 — FINAL KEYWORD AUDIT:
After all changes, verify that each of the top 15 keywords appears
at least ONCE in the resume. For the top 5 most important keywords,
verify they appear at least TWICE (once in Summary + once in 
Experience or Skills). Report the final keyword match count.

IMPORTANT: Keywords must read NATURALLY in context. Never stuff 
keywords into sentences where they don't make sense. A resume that 
reads naturally with 12/15 keywords is better than one that sounds 
robotic with 15/15 keywords.
```

WHERE TO IMPLEMENT:
  Find the existing GPT system prompt for resume tailoring.
  It's likely in:
    - src/app/api/resume/optimize/route.ts
    - Or a separate prompt file/constant
  Add the 7-step strategy to the system prompt BEFORE the existing rules.
  The existing rules (formatting, banned words, custom rules) still apply
  on top of this strategy.

Also update the change_summary response to include:
  - keywords_found: number (how many of top 15 JD keywords are in the resume)
  - keywords_total: number (total top keywords from JD)
  - keyword_placement: { summary: [...], first_bullets: [...], skills: [...] }

══════════════════════════════════════════════════════════════
IMPROVEMENT 3 — ADD 45+ NEW COMPANIES
══════════════════════════════════════════════════════════════

PROBLEM:
We have 90 companies. Career-Ops has 45+ companies that include 
many AI startups and specialized tech companies we might be missing.

SOLUTION:
Add these companies to our seed database. Check which ones we 
already have and only add the NEW ones.

COMPANIES TO ADD (check if we already have each one first):

AI LABS:
  - Anthropic (greenhouse or ashby — check which ATS they use)
  - OpenAI (check ATS)
  - Mistral (check ATS)
  - Cohere (check ATS)
  - LangChain (check ATS)
  - Pinecone (check ATS)

VOICE AI:
  - ElevenLabs (check ATS)
  - Deepgram (check ATS)
  - Hume AI (check ATS)

AI PLATFORMS:
  - Retool (check ATS)
  - Temporal (check ATS)
  - Glean (check ATS)
  - Arize AI (check ATS)

DEVELOPER TOOLS:
  - Vercel (check ATS — we might already have this)
  - n8n (check ATS)
  - Zapier (check ATS)

EUROPEAN TECH:
  - Factorial (check ATS)
  - Attio (check ATS)
  - Tinybird (check ATS)

OTHER NOTABLE:
  - Sierra AI (check ATS)
  - Ada (check ATS)
  - LivePerson (check ATS)
  - Weights & Biases (check ATS)
  - Langfuse (check ATS)

FOR EACH COMPANY:
1. Check if we already have it in our companies table
2. If NOT, find their career page URL
3. Determine which ATS they use (greenhouse, lever, or ashby)
4. Find their board_token/slug
5. Add to the companies table

HOW TO FIND THE ATS AND SLUG:
  - Visit the company's careers page
  - Check if URL contains: 
    boards.greenhouse.io/{slug} → Greenhouse
    jobs.lever.co/{slug} → Lever
    jobs.ashbyhq.com/{slug} → Ashby
  - Or check page source for greenhouse/lever/ashby references
  - The slug is usually the company name in lowercase

WHERE TO IMPLEMENT:
  Either add to the existing seed JSON file and re-run the seed script,
  or insert directly into Supabase companies table.

══════════════════════════════════════════════════════════════
IMPROVEMENT 4 — BETTER DUPLICATE JOB DETECTION
══════════════════════════════════════════════════════════════

PROBLEM:
Currently we only dedup by external_id (the job ID from the ATS API).
But the same job can appear from different sources with different IDs.
For example:
  - "Senior Backend Engineer" at Stripe via Greenhouse = external_id "123"
  - Same job discovered again when we add JSearch later = different ID

SOLUTION:
Add a second dedup layer using normalized company name + job title.

LOGIC:

  Function: normalizeForDedup(companyName: string, jobTitle: string): string
  
  1. Convert both to lowercase
  2. Remove common suffixes: "Inc", "Inc.", "LLC", "Ltd", "Corp", "Co."
  3. Remove extra whitespace
  4. Remove special characters except hyphens
  5. Combine: `${normalizedCompany}::${normalizedTitle}`
  6. Return the combined string as a dedup key
  
  Examples:
    "Stripe, Inc." + "Senior Backend Engineer" 
    → "stripe::senior backend engineer"
    
    "Stripe" + "Senior Backend Engineer"
    → "stripe::senior backend engineer"  (MATCH — same job!)
    
    "Stripe, Inc." + "Senior Frontend Engineer"
    → "stripe::senior frontend engineer" (DIFFERENT — not a dupe)

WHERE TO IMPLEMENT:

  1. Add a column to the jobs table: dedup_key (text, nullable)
     Add a UNIQUE index on dedup_key (or handle conflicts in code)
  
  2. In the job polling pipeline (the route that fetches jobs from APIs):
     Before inserting a new job, calculate the dedup_key.
     Check if a job with the same dedup_key already exists.
     If YES → skip it (it's a duplicate)
     If NO → insert normally
  
  3. Backfill: Run a one-time script to calculate dedup_key for all 
     existing 1,479 jobs in the database.
  
  4. Handle edge cases:
     - Same company, same title, different location = NOT a dupe
       → Include location in dedup key: `${company}::${title}::${location}`
     - Same company, slightly different title ("Sr." vs "Senior") = IS a dupe
       → Normalize "sr." to "senior", "jr." to "junior", etc.

══════════════════════════════════════════════════════════════
PLAN REQUIREMENTS
══════════════════════════════════════════════════════════════

Before implementing ANYTHING, show me a plan that covers:

For EACH of the 4 improvements:
  1. What files you'll create or modify
  2. What the current code looks like (show me the relevant existing code)
  3. What you'll change and why
  4. Any database migrations needed
  5. How you'll test it works
  6. Any risks or things that could break

Also tell me:
  - Which improvements depend on each other (if any)
  - What order you recommend implementing them
  - Estimated time for each
  - Any questions or gaps you found

Think step by step. Brainstorm. Ask questions. 
Show me the complete plan. Wait for my GO AHEAD.
