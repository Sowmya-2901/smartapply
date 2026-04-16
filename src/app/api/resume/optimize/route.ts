import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Resume Optimization API Route
 *
 * Accepts resume text and user's resume rules, calls GPT-4o-mini
 * to optimize the resume following all rules.
 *
 * POST /api/resume/optimize
 * Body: { resumeText, rules, mode: 'master' | 'tailored', jobDescription? }
 * Returns: { success: true, optimizedText, changeSummary }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { resumeText, rules, mode = 'master', jobDescription } = body

    if (!resumeText) {
      return NextResponse.json(
        { success: false, error: 'Resume text is required' },
        { status: 400 }
      )
    }

    // Get user's profile with rules if not provided
    let userRules = rules
    if (!userRules) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('formatting_rules, content_rules, banned_words, custom_rules')
        .eq('id', user.id)
        .single()

      if (profile) {
        userRules = {
          formatting: profile.formatting_rules || '',
          content: profile.content_rules || '',
          bannedWords: profile.banned_words || [],
          custom: profile.custom_rules || ''
        }
      }
    }

    // Build the system prompt based on mode
    let systemPrompt = ''
    let userPrompt = ''

    if (mode === 'master') {
      // Master optimization mode
      systemPrompt = `You are an expert resume optimizer. Your job is to improve resumes following the rules below EXACTLY.

FORMATTING RULES:
${userRules?.formatting || '- Never change the original formatting, fonts, colors, or spacing\n- Keep resume to 2 pages maximum\n- Skills section must be plain text (never use tables)\n- Use standard section headings (Summary, Experience, Skills, Education, Projects)\n- No unicode bullets or special characters'}

CONTENT RULES:
${userRules?.content || '- Add missing JD skills to Skills section\n- Write new bullet points for missing skills under relevant experience/projects\n- Every bullet must have: Action verb + What you did + How + Result with numbers\n- Use varied bullet patterns (never start 3+ bullets the same way)\n- Add approximate metrics where exact numbers aren\'t available, marked with (~)\n- Never remove existing bullet points from the original resume\n- Never change job titles, company names, dates, GPA, or degrees\n- Never invent companies or certifications'}

BANNED WORDS — never use these anywhere:
${(userRules?.bannedWords || []).join(', ')}

CUSTOM RULES:
${userRules?.custom || 'None'}

Now optimize the following resume. Only change text content. Do not change the structure or layout.
Fix weak bullets, add metrics, use active verbs, remove banned words, ensure ATS compatibility.

Return the optimized resume with clear section headers (SUMMARY, EXPERIENCE, SKILLS, EDUCATION, PROJECTS).
Also return a JSON summary at the end with this format:
{"changes_summary": "Brief description of changes made", "bullets_added": number, "bullets_improved": number, "banned_words_removed": number}`

      userPrompt = `Here is my resume:\n\n${resumeText}\n\nPlease optimize this resume following all the rules above.`
    } else {
      // Per-JD tailoring mode
      if (!jobDescription) {
        return NextResponse.json(
          { success: false, error: 'Job description is required for tailored mode' },
          { status: 400 }
        )
      }

      systemPrompt = `You are an expert resume tailor. Your job is to customize a resume for a specific job description following the rules below EXACTLY.

KEYWORD PLACEMENT STRATEGY — Follow these 7 steps in order:

Step 1 — EXTRACT: Identify the top 15-20 keywords and phrases from the job description. Prioritize: required skills, tools, technologies, methodologies, and domain-specific terms.

Step 2 — SUMMARY PLACEMENT (highest ATS weight): Place the 5 most important keywords naturally into the Professional Summary section. ATS parsers read and weight the summary section most heavily. Every critical skill should appear here.

Step 3 — FIRST BULLET PLACEMENT (second highest weight): For each work experience entry, ensure the FIRST bullet point contains 1-2 relevant JD keywords. ATS systems often weight the first bullet of each role more heavily than subsequent bullets. Rewrite the first bullet to naturally include the most relevant keyword for that role.

Step 4 — SKILLS SECTION PLACEMENT: Add ALL missing technical skills to the Skills section. Group them logically under existing categories. This ensures keyword-for-keyword ATS matching.

Step 5 — EXPERIENCE REORDERING: Reorder bullet points within each job so that the most JD-relevant bullets appear FIRST. Do NOT delete any bullets — only change the order. Most relevant experience floats to the top.

Step 6 — PROJECT SELECTION: If the resume has a Projects section, ensure the most relevant projects to this JD are listed first. Add JD keywords to project descriptions where they naturally fit.

Step 7 — FINAL KEYWORD AUDIT: After all changes, verify that each of the top 15 keywords appears at least ONCE in the resume. For the top 5 most important keywords, verify they appear at least TWICE (once in Summary + once in Experience or Skills). Report the final keyword match count.

IMPORTANT: Keywords must read NATURALLY in context. Never stuff keywords into sentences where they don't make sense. A resume that reads naturally with 12/15 keywords is better than one that sounds robotic with 15/15 keywords.

---

RULES (these NEVER change — follow them every single time):
FORMATTING RULES:
${userRules?.formatting || '- Never change the original formatting, fonts, colors, or spacing\n- Keep resume to 2 pages maximum\n- Skills section must be plain text (never use tables)\n- Use standard section headings\n- No unicode bullets or special characters'}

CONTENT RULES:
${userRules?.content || '- Add missing JD skills to Skills section\n- Write new bullet points for missing skills under relevant experience/projects\n- Every bullet: Action verb + What + How + Result with numbers\n- Use varied bullet patterns\n- Add approximate metrics where exact numbers unavailable, marked with (~)\n- Never remove existing bullet points\n- Never change job titles, company names, dates, or degrees'}

BANNED WORDS — never use these anywhere:
${(userRules?.bannedWords || []).join(', ')}

CUSTOM RULES:
${userRules?.custom || 'None'}

INSTRUCTIONS:
1. Identify ALL skills mentioned in the JD that are missing from the resume
2. Add every missing skill to the Skills section
3. For each missing skill, write a new bullet point under the most relevant Experience or Projects section
4. Adjust existing bullet points to naturally incorporate JD keywords where they fit
5. Ensure the Summary/Profile section reflects this specific role
6. Follow ALL formatting rules — do not change fonts, spacing, or layout
7. Follow ALL banned words — never use any of them
8. Follow ALL custom rules exactly as written

Return the tailored resume with clear section headers.
Also return a JSON summary at the end with this format:
{"skills_added": ["skill1", "skill2"], "bullets_added": number, "bullets_modified": number, "keywords_found": 12, "keywords_total": 15, "keyword_placement": {"summary": ["React", "Node.js"], "first_bullets": ["TypeScript"], "skills": ["Python", "AWS"]}}`

      userPrompt = `RESUME TO TAILOR:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nPlease tailor this resume for this job following all the rules above.`
    }

    // Call OpenAI API
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })

    const optimizedText = completion.choices[0]?.message?.content

    if (!optimizedText) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate optimized resume' },
        { status: 500 }
      )
    }

    // Extract the JSON summary from the response
    let changeSummary = null
    const jsonMatch = optimizedText.match(/\{[\s\S]*?"changes_summary"[\s\S]*?\}|\{[\s\S]*?"skills_added"[\s\S]*?\}/)
    if (jsonMatch) {
      try {
        changeSummary = JSON.parse(jsonMatch[0])
      } catch (e) {
        console.error('Failed to parse change summary JSON:', e)
      }
    }

    // If this is master optimization, save to database
    let savedResume = null
    if (mode === 'master') {
      // Remove any JSON summary from the text for storage
      const cleanText = optimizedText.replace(/\{[\s\S]*?"changes_summary"[\s\S]*?\}|\{[\s\S]*?"skills_added"[\s\S]*?\}/g, '').trim()

      const { data } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          type: 'master_optimized',
          parsed_text: cleanText,
          parsed_skills: null, // Will be extracted later
          change_summary: changeSummary,
          is_current: true
        })
        .select()
        .single()

      // Mark previous master as not current
      await supabase
        .from('resumes')
        .update({ is_current: false })
        .eq('user_id', user.id)
        .eq('type', 'master_optimized')
        .neq('id', data?.id || '')

      savedResume = data
    }

    return NextResponse.json({
      success: true,
      optimizedText,
      changeSummary,
      savedResume
    })

  } catch (error) {
    console.error('Optimization error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
