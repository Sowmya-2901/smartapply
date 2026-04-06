import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

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
{"skills_added": ["skill1", "skill2"], "bullets_added": number, "bullets_modified": number, "keyword_match": "X/Y top JD keywords present"}`

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
