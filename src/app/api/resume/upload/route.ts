import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Resume Upload API Route
 *
 * Accepts a .docx or .pdf file, parses it to extract text and skills,
 * stores the file in Supabase Storage, and creates a resume record.
 *
 * POST /api/resume/upload
 * Body: FormData with 'file' field
 * Returns: { success: true, resumeId, parsedText, parsedSkills }
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

    // Parse the multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/pdf',
      'application/msword', // .doc (legacy)
    ]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload .docx or .pdf' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Max 5MB allowed.' },
        { status: 400 }
      )
    }

    // Convert file to buffer for parsing
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse text from file based on type
    let parsedText = ''
    const fileName = file.name
    const fileExt = fileName.split('.').pop()?.toLowerCase()

    if (fileExt === 'pdf') {
      // Parse PDF
      try {
        const pdfParse = (await import('pdf-parse')).default
        const pdfData = await pdfParse(buffer)
        parsedText = pdfData.text
      } catch (err) {
        console.error('PDF parsing error:', err)
        return NextResponse.json(
          { success: false, error: 'Failed to parse PDF file' },
          { status: 500 }
        )
      }
    } else if (fileExt === 'docx' || fileExt === 'doc') {
      // Parse DOCX
      try {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        parsedText = result.value
      } catch (err) {
        console.error('DOCX parsing error:', err)
        return NextResponse.json(
          { success: false, error: 'Failed to parse DOCX file' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported file format' },
        { status: 400 }
      )
    }

    // Extract skills from parsed text (simple keyword matching for now)
    const commonTechSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 'Ruby', 'PHP',
      'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Node.js', 'Express', 'Nest.js',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB',
      'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'Ansible',
      'Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins', 'GitHub Actions',
      'REST', 'GraphQL', 'gRPC', 'API', 'Microservices',
      'Linux', 'Unix', 'Shell', 'Bash', ' scripting',
      'Agile', 'Scrum', 'Kanban', 'JIRA', 'Confluence',
      'TensorFlow', 'PyTorch', 'Machine Learning', 'AI', 'Data Science',
      'HTML', 'CSS', 'Tailwind', 'SASS', 'Webpack', 'Vite'
    ]

    const foundSkills = commonTechSkills.filter(skill =>
      parsedText.toLowerCase().includes(skill.toLowerCase())
    )

    // Upload file to Supabase Storage
    const filePath = `${user.id}/${Date.now()}-${fileName}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Failed to upload file to storage' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath)

    // Create resume record in database
    const { data: resumeData, error: resumeError } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        type: 'raw_base',
        file_url: urlData.publicUrl,
        parsed_text: parsedText,
        parsed_skills: foundSkills,
        is_current: true
      })
      .select()
      .single()

    if (resumeError) {
      console.error('Database insert error:', resumeError)
      // Clean up uploaded file
      await supabase.storage.from('resumes').remove([filePath])
      return NextResponse.json(
        { success: false, error: 'Failed to save resume record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      resumeId: resumeData.id,
      parsedText,
      parsedSkills: foundSkills,
      fileUrl: urlData.publicUrl
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
