import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, TabStopPosition, TabStopType, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'

/**
 * Generate a Word document (.docx) from resume text
 *
 * Creates a clean, ATS-friendly resume document with proper formatting.
 *
 * @param resumeText - The full resume text with section markers
 * @param filename - The output filename (without extension)
 * @returns Buffer containing the docx file
 */
export async function generateDocxFromText(resumeText: string, filename: string = 'resume') {
  // Parse the resume text into sections
  const sections = parseResumeSections(resumeText)

  // Create a new document
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Header section (name, contact info)
        ...sections.header.map(para => new Paragraph({
          text: para,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        })),

        // Contact info (smaller, centered)
        sections.contact ? new Paragraph({
          text: sections.contact,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 200,
          },
        }) : undefined,

        // Add some spacing after header
        new Paragraph({
          text: '',
          spacing: { after: 200 },
        }),

        // Summary section
        ...sections.summary.map(para => new Paragraph({
          text: para,
        })),

        // Skills section
        ...sections.skills.map((para, idx) => new Paragraph({
          text: para,
          bullet: idx > 0 ? { level: 'bullet' } : undefined,
        })),

        // Experience section
        ...sections.experience.flatMap((exp, idx) => [
          idx > 0 ? new Paragraph({
            text: '',
            spacing: { after: 100 },
          }) : undefined,
          new Paragraph({
            text: exp.title,
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: exp.company || '',
          }),
          ...exp.bullets.map(bullet => new Paragraph({
            text: bullet,
            bullet: { level: 'bullet' },
          })),
        ].filter(Boolean)),

        // Projects section
        ...sections.projects.flatMap((proj, idx) => [
          idx > 0 ? new Paragraph({
            text: '',
            spacing: { after: 100 },
          }) : undefined,
          new Paragraph({
            text: proj.title,
            heading: HeadingLevel.HEADING_2,
          }),
          ...proj.bullets.map(bullet => new Paragraph({
            text: bullet,
            bullet: { level: 'bullet' },
          })),
        ].filter(Boolean)),

        // Education section
        ...sections.education.map(edu => [
          new Paragraph({
            text: edu.school,
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: [edu.degree, edu.year].filter(Boolean).join(' | '),
          }),
          new Paragraph({
            text: '',
            spacing: { after: 200 },
          }),
        ]),
      ].filter(Boolean),
    }],
  })

  // Generate the document
  const buffer = await Packer.toBuffer(doc)

  return buffer
}

/**
 * Download the resume as a .docx file
 */
export async function downloadResumeDocx(resumeText: string, filename: string = 'tailored-resume') {
  const buffer = await generateDocxFromText(resumeText, filename)

  // Create blob and download
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })

  saveAs(blob, `${filename}.docx`)
}

/**
 * Parse resume text into structured sections
 *
 * Handles various resume formats with section headers like:
 * - SUMMARY / PROFILE
 * - SKILLS / TECHNICAL SKILLS
 * - EXPERIENCE / WORK EXPERIENCE
 * - PROJECTS
 * - EDUCATION
 */
function parseResumeSections(text: string) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)

  const sections: {
    header: string[]
    contact: string | null
    summary: string[]
    skills: string[]
    experience: Array<{ title: string; company: string; bullets: string[] }>
    projects: Array<{ title: string; bullets: string[] }>
    education: Array<{ school: string; degree: string; year: string }>
  } = {
    header: [],
    contact: null,
    summary: [],
    skills: [],
    experience: [],
    projects: [],
    education: [],
  }

  let currentSection: 'header' | 'summary' | 'skills' | 'experience' | 'projects' | 'education' | null = null
  let currentExperience: { title: string; company: string; bullets: string[] } | null = null
  let currentProject: { title: string; bullets: string[] } | null = null
  let currentEducation: { school: string; degree: string; year: string } | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const upperLine = line.toUpperCase()

    // Detect section headers
    if (upperLine === 'SUMMARY' || upperLine === 'PROFILE' || upperLine === 'PROFESSIONAL SUMMARY') {
      currentSection = 'summary'
      continue
    }

    if (upperLine === 'SKILLS' || upperLine === 'TECHNICAL SKILLS' || upperLine === 'TECHNOLOGIES') {
      currentSection = 'skills'
      continue
    }

    if (upperLine === 'EXPERIENCE' || upperLine === 'WORK EXPERIENCE' || upperLine === 'PROFESSIONAL EXPERIENCE') {
      currentSection = 'experience'
      currentExperience = null
      continue
    }

    if (upperLine === 'PROJECTS' || upperLine === 'PERSONAL PROJECTS') {
      currentSection = 'projects'
      currentProject = null
      continue
    }

    if (upperLine === 'EDUCATION' || upperLine === 'ACADEMIC' || upperLine === 'EDUCATION & CERTIFICATIONS') {
      currentSection = 'education'
      currentEducation = null
      continue
    }

    // Parse content based on current section
    switch (currentSection) {
      case 'header':
        if (line.includes('@') || line.includes('phone') || line.includes('linkedIn') || line.includes('github')) {
          sections.contact = line
        } else if (!sections.contact && line.length > 0) {
          sections.header.push(line)
        }
        break

      case 'summary':
        if (line.length > 0) {
          sections.summary.push(line)
        }
        break

      case 'skills':
        if (line.length > 0 && !line.startsWith('•')) {
          // Section title or just a skill
          if (upperLine === line && line.length < 50) {
            // Might be a category header, skip
          } else {
            sections.skills.push(line)
          }
        }
        // Handle bullet points
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
          const cleaned = line.replace(/^[•\-*]\s*/, '').trim()
          if (cleaned) sections.skills.push(cleaned)
        }
        break

      case 'experience':
        // Check if this is a job title line (typically uppercase, contains @, etc.)
        if (
          (line === line.toUpperCase() && line.length < 50) ||
          line.includes('@') ||
          line.includes('|')
        ) {
          // Save previous experience if exists
          if (currentExperience) {
            sections.experience.push(currentExperience)
          }

          // Parse job title line
          const parts = line.split('|').map(p => p.trim())
          currentExperience = {
            title: parts[0] || line,
            company: parts[1] || '',
            bullets: []
          }
        } else if (currentExperience && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))) {
          // Bullet point under current experience
          const cleaned = line.replace(/^[•\-*]\s*/, '').trim()
          if (cleaned) {
            currentExperience.bullets.push(cleaned)
          }
        } else if (currentExperience && line.length > 0) {
          // Regular content, might be description
          currentExperience.bullets.push(line)
        }
        break

      case 'projects':
        // Check if this is a project title
        if (line === line.toUpperCase() && line.length < 60) {
          // Save previous project if exists
          if (currentProject) {
            sections.projects.push(currentProject)
          }
          currentProject = { title: line, bullets: [] }
        } else if (currentProject) {
          if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
            const cleaned = line.replace(/^[•\-*]\s*/, '').trim()
            if (cleaned) {
              currentProject.bullets.push(cleaned)
            }
          } else if (line.length > 0) {
            currentProject.bullets.push(line)
          }
        }
        break

      case 'education':
        // Check if this is a school line
        if (line.includes('University') || line.includes('College') || line.includes('Institute') || line === line.toUpperCase() && line.length < 60) {
          // Save previous education if exists
          if (currentEducation) {
            sections.education.push(currentEducation)
          }
          currentEducation = { school: line, degree: '', year: '' }
        } else if (currentEducation && line.length > 0) {
          // Could be degree or year
          currentEducation.degree += (currentEducation.degree ? ' ' : '') + line
        }
        break
    }
  }

  // Save last items
  if (currentExperience) {
    sections.experience.push(currentExperience)
  }
  if (currentProject) {
    sections.projects.push(currentProject)
  }
  if (currentEducation) {
    sections.education.push(currentEducation)
  }

  return sections
}
