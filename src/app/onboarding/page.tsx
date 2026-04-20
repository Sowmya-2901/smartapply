'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { JobPreferencesForm, type JobPreferencesData } from '@/components/forms/JobPreferencesForm'
import { WORK_AUTHORIZATION_OPTIONS } from '@/lib/filters/workAuthorization'

/**
 * Onboarding Page - 7 Step Wizard
 *
 * Steps:
 * 1. Upload Resume
 * 2. Resume Rules
 * 3. Master Resume Optimization
 * 4. Job Search Preferences
 * 5. Auto-fill Profile
 * 6. Answer Bank
 * 7. Done
 */

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

interface OnboardingData {
  resumeId?: string
  parsedText?: string
  parsedSkills?: string[]
  formattingRules?: string
  contentRules?: string
  bannedWords?: string[]
  customRules?: string
  optimizedText?: string
  // Job preferences - now using JobPreferencesData structure
  jobPreferences?: Partial<JobPreferencesData>
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [data, setData] = useState<OnboardingData>({
    formattingRules: 'Never change the original formatting, fonts, colors, or spacing\nKeep resume to 2 pages maximum\nSkills section must be plain text (never use tables)\nUse standard section headings (Summary, Experience, Skills, Education, Projects)\nNo unicode bullets or special characters',
    contentRules: 'Add missing JD skills to Skills section\nWrite new bullet points for missing skills under relevant experience/projects\nEvery bullet must have: Action verb + What you did + How + Result with numbers\nUse varied bullet patterns (never start 3+ bullets the same way)\nAdd approximate metrics where exact numbers aren\'t available, marked with (~)\nNever remove existing bullet points from the original resume\nNever change job titles, company names, dates, GPA, or degrees\nNever invent companies or certifications',
    bannedWords: ['passionate', 'synergy', 'leverage', 'spearheaded', 'guru', 'ninja', 'rockstar', 'innovative', 'dynamic', 'detail-oriented', 'results-driven', 'team player', 'cutting-edge', 'utilized', 'leveraged', 'robust', 'scalable solutions', 'best practices'],
    customRules: '',
    jobPreferences: {
      work_authorization: 'US Citizen',
      remote_preference: 'any',
      no_new_grad: true,
      no_contract: true,
      freshness_preference: '7days',
      experience_years: 0,
      job_titles: [],
      seniority_preferences: [],
      show_clearance_jobs: false,
      only_show_sponsoring: false,
      preferred_states: [],
      preferred_cities: [],
      min_salary: null,
      excluded_companies: [],
      company_size_preference: []
    }
  })

  // Check if user already completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('experience_years, onboarding_completed_at')
          .eq('id', user.id)
          .single()

        // Redirect to dashboard if onboarding is completed
        // (either has experience_years set OR has onboarding_completed_at timestamp)
        if (profile?.experience_years || profile?.onboarding_completed_at) {
          router.push('/dashboard')
        }
      }
    }
    checkOnboarding()
  }, [router, supabase])

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    if (currentStep < 7) {
      setCurrentStep((currentStep + 1) as Step)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    }
  }

  const goToStep = (step: Step) => {
    setCurrentStep(step)
  }

  // Step Components
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1UploadResume data={data} updateData={updateData} nextStep={nextStep} setError={setError} error={error} />
      case 2:
        return <Step2ResumeRules data={data} updateData={updateData} />
      case 3:
        return <Step3MasterOptimization data={data} updateData={updateData} />
      case 4:
        return <Step4JobPreferences data={data} updateData={updateData} onNextStep={nextStep} />
      case 5:
        return <Step5AutofillProfile data={data} updateData={updateData} />
      case 6:
        return <Step6AnswerBank data={data} updateData={updateData} />
      case 7:
        return <Step7Complete data={data} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-slate-900">Setup your profile</h1>
            <span className="text-sm text-slate-500">Step {currentStep} of 7</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 7) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          {currentStep < 7 ? (
            <button
              onClick={nextStep}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {currentStep === 6 ? 'Complete Setup' : 'Next'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// STEP 1: Upload Resume
// ============================================================================
function Step1UploadResume({ data, updateData, nextStep, setError, error }: {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  nextStep: () => void
  setError: (error: string | null) => void
  error?: string | null
}) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadedFile, setUploadedFile] = useState('')
  const [parsedSkillsCount, setParsedSkillsCount] = useState(0)

  const handleFile = async (file: File) => {
    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setUploadedFile(file.name)
        setParsedSkillsCount(result.parsedSkills?.length || 0)
        setUploadSuccess(true)
        updateData({
          resumeId: result.resumeId,
          parsedText: result.parsedText,
          parsedSkills: result.parsedSkills
        })
        // Don't call nextStep() - let user see success message first
      } else {
        setError(result.error || 'Failed to upload resume')
      }
    } catch (err) {
      setError('Failed to upload resume. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900 mb-4">Upload your resume</h2>
      <p className="text-slate-600 mb-8">
        Upload your current resume (.docx or .pdf). We'll extract your skills and experience to help tailor future applications.
      </p>

      {uploadSuccess ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-green-900 mb-2">Resume uploaded!</h3>
          <p className="text-green-700 mb-1">
            Uploaded: <strong>{uploadedFile}</strong>
          </p>
          <p className="text-sm text-green-600 mb-6">
            We extracted {parsedSkillsCount} skill{parsedSkillsCount !== 1 ? 's' : ''} from your resume.
          </p>
          <button
            onClick={nextStep}
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Continue to Step 2 →
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
            }`}
            onDragEnter={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false) }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".docx,.pdf,.doc"
              onChange={handleChange}
              disabled={uploading}
              className="hidden"
              id="resume-upload"
            />
            <label htmlFor="resume-upload" className="cursor-pointer">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-lg font-medium text-slate-900 mb-2">
                {uploading ? 'Uploading...' : 'Drop your resume here, or click to browse'}
              </p>
              <p className="text-sm text-slate-500">Supports .docx and .pdf files (max 5MB)</p>
            </label>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// STEP 2: Resume Rules
// ============================================================================
function Step2ResumeRules({ data, updateData }: {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}) {
  const [newBannedWord, setNewBannedWord] = useState('')

  const addBannedWord = () => {
    if (newBannedWord.trim() && !data.bannedWords?.includes(newBannedWord.trim())) {
      updateData({
        bannedWords: [...(data.bannedWords || []), newBannedWord.trim()]
      })
      setNewBannedWord('')
    }
  }

  const removeBannedWord = (word: string) => {
    updateData({
      bannedWords: data.bannedWords?.filter(w => w !== word)
    })
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900 mb-4">Resume optimization rules</h2>
      <p className="text-slate-600 mb-8">
        These rules tell the AI how to optimize your resume. Customize them to match your preferences.
      </p>

      {/* Formatting Rules */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-slate-900 mb-3">Formatting Rules</h3>
        <textarea
          value={data.formattingRules}
          onChange={(e) => updateData({ formattingRules: e.target.value })}
          rows={6}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="Enter formatting rules..."
        />
      </div>

      {/* Content Rules */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-slate-900 mb-3">Content Rules</h3>
        <textarea
          value={data.contentRules}
          onChange={(e) => updateData({ contentRules: e.target.value })}
          rows={6}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="Enter content rules..."
        />
      </div>

      {/* Banned Words */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-slate-900 mb-3">Banned Words</h3>
        <p className="text-sm text-slate-500 mb-3">Words to never use in your resume</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {data.bannedWords?.map(word => (
            <span
              key={word}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-2"
            >
              {word}
              <button onClick={() => removeBannedWord(word)} className="hover:text-red-900">&times;</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newBannedWord}
            onChange={(e) => setNewBannedWord(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addBannedWord()}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Add a banned word..."
          />
          <button
            onClick={addBannedWord}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            Add
          </button>
        </div>
      </div>

      {/* Custom Rules */}
      <div>
        <h3 className="text-lg font-medium text-slate-900 mb-3">Custom Rules</h3>
        <textarea
          value={data.customRules}
          onChange={(e) => updateData({ customRules: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="Add any additional instructions... (e.g., 'Always emphasize my AWS experience')"
        />
      </div>
    </div>
  )
}

// ============================================================================
// STEP 3: Master Resume Optimization
// ============================================================================
function Step3MasterOptimization({ data, updateData }: {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}) {
  const [optimizing, setOptimizing] = useState(false)
  const [optimizedText, setOptimizedText] = useState<string | null>(null)
  const [changeSummary, setChangeSummary] = useState<any>(null)
  const supabase = createClient()

  const runOptimization = async () => {
    setOptimizing(true)
    try {
      const response = await fetch('/api/resume/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: data.parsedText,
          rules: {
            formatting: data.formattingRules,
            content: data.contentRules,
            bannedWords: data.bannedWords,
            custom: data.customRules
          },
          mode: 'master'
        })
      })

      const result = await response.json()

      if (result.success) {
        setOptimizedText(result.optimizedText)
        setChangeSummary(result.changeSummary)
        updateData({ optimizedText: result.optimizedText })

        // Save the master_optimized resume to database
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('resumes').insert({
            user_id: user.id,
            type: 'master_optimized',
            parsed_text: result.optimizedText,
            parsed_skills: data.parsedSkills,
            change_summary: result.changeSummary,
            is_current: true
          })
        }
      } else {
        alert('Failed to optimize resume: ' + result.error)
      }
    } catch (err) {
      alert('Failed to optimize resume. Please try again.')
    } finally {
      setOptimizing(false)
    }
  }

  useEffect(() => {
    if (!optimizedText && !optimizing) {
      runOptimization()
    }
  }, [])

  if (optimizing) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Optimizing your resume...</h2>
        <p className="text-slate-600">This may take a minute. Our AI is carefully improving your resume.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900 mb-4">Your optimized resume</h2>

      {changeSummary && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-medium text-green-800 mb-2">Changes made:</h3>
          <p className="text-sm text-green-700">{changeSummary.changes_summary || 'Resume optimized successfully'}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-medium text-slate-500 mb-2">Original</h3>
          <div className="p-4 bg-slate-50 rounded-lg text-sm whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
            {data.parsedText?.substring(0, 1000)}...
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-500 mb-2">Optimized</h3>
          <div className="p-4 bg-green-50 rounded-lg text-sm whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
            {optimizedText?.substring(0, 1000)}...
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Review the optimized version on the right. Your master resume has been saved and will be used as the base for all job-specific tailoring.
      </p>
    </div>
  )
}

// ============================================================================
// STEP 4: Job Search Preferences
// ============================================================================
function Step4JobPreferences({ data, updateData, onNextStep }: {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNextStep: () => void
}) {
  const [saving, setSaving] = useState(false)

  const handleSavePreferences = async (preferences: JobPreferencesData) => {
    setSaving(true)
    // Update parent state with new preferences
    updateData({ jobPreferences: preferences })
    // Automatically advance to next step after saving
    setTimeout(() => onNextStep(), 300)
    setSaving(false)
  }

  return (
    <JobPreferencesForm
      initialData={data.jobPreferences}
      onSave={handleSavePreferences}
      loading={saving}
      submitLabel="Continue"
      cancelLabel={undefined}
      onCancel={undefined}
    />
  )
}

// ============================================================================
// STEP 5: Auto-fill Profile
// ============================================================================
function Step5AutofillProfile({ data, updateData }: {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}) {
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    workAuthorization: '',
    willingToRelocate: false,
    noticePeriod: ''
  })

  // Load user data
  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setProfile(prev => ({ ...prev, fullName: user.user_metadata?.full_name || '', email: user.email || '' }))
      }
    }
    loadProfile()
  }, [])

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900 mb-4">Auto-fill profile</h2>
      <p className="text-slate-600 mb-8">
        This information will be used to auto-fill job application forms (Phase 2).
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
          <input
            type="text"
            value={profile.fullName}
            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn URL</label>
          <input
            type="url"
            value={profile.linkedinUrl}
            onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">GitHub URL</label>
          <input
            type="url"
            value={profile.githubUrl}
            onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            placeholder="https://github.com/yourusername"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Portfolio URL</label>
          <input
            type="url"
            value={profile.portfolioUrl}
            onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            placeholder="https://yourportfolio.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Work Authorization</label>
          <select
            value={profile.workAuthorization}
            onChange={(e) => setProfile({ ...profile, workAuthorization: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
          >
            <option value="">Select...</option>
            {WORK_AUTHORIZATION_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Notice Period</label>
          <select
            value={profile.noticePeriod}
            onChange={(e) => setProfile({ ...profile, noticePeriod: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
          >
            <option value="">Select...</option>
            <option value="Immediate">Immediate</option>
            <option value="2 weeks">2 weeks</option>
            <option value="1 month">1 month</option>
            <option value="2 months">2 months</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={profile.willingToRelocate}
            onChange={(e) => setProfile({ ...profile, willingToRelocate: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-slate-700">Willing to relocate</span>
        </label>
      </div>
    </div>
  )
}

// ============================================================================
// STEP 6: Answer Bank
// ============================================================================
function Step6AnswerBank({ data, updateData }: {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}) {
  const [answers, setAnswers] = useState({
    whyInterested: '',
    whyCompany: '',
    challengingProject: '',
    strengths: ''
  })

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900 mb-4">Answer bank</h2>
      <p className="text-slate-600 mb-8">
        Pre-save answers to common application questions. These will be used for auto-fill in Phase 2.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Why are you interested in this role?
          </label>
          <textarea
            value={answers.whyInterested}
            onChange={(e) => setAnswers({ ...answers, whyInterested: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg"
            placeholder="I'm interested in this role because..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Why this company?
          </label>
          <textarea
            value={answers.whyCompany}
            onChange={(e) => setAnswers({ ...answers, whyCompany: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg"
            placeholder="I want to work at this company because..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Describe a challenging project
          </label>
          <textarea
            value={answers.challengingProject}
            onChange={(e) => setAnswers({ ...answers, challengingProject: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg"
            placeholder="One challenging project I worked on was..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            What are your strengths?
          </label>
          <textarea
            value={answers.strengths}
            onChange={(e) => setAnswers({ ...answers, strengths: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg"
            placeholder="My key strengths are..."
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// STEP 7: Complete
// ============================================================================
function Step7Complete({ data }: { data: OnboardingData }) {
  const router = useRouter()
  const [saving, setSaving] = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const saveProfile = async () => {
      setSaving(true)
      setError(null)

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) throw new Error('Not authenticated')

        // Prepare profile data with all preferences
        const prefs = data.jobPreferences || {}

        const profileData = {
          // Mark onboarding as complete
          onboarding_completed_at: new Date().toISOString(),

          // Resume rules
          formatting_rules: data.formattingRules,
          content_rules: data.contentRules,
          banned_words: data.bannedWords,
          custom_rules: data.customRules,

          // Job preferences (11 filters)
          job_titles: prefs.job_titles || [],
          seniority_preferences: prefs.seniority_preferences || [],
          experience_years: prefs.experience_years || 0,
          no_new_grad: prefs.no_new_grad ?? true,
          no_contract: prefs.no_contract ?? true,
          work_authorization: prefs.work_authorization || 'US Citizen',
          show_clearance_jobs: prefs.show_clearance_jobs || false,
          only_show_sponsoring: prefs.only_show_sponsoring || false,
          remote_preference: prefs.remote_preference || 'any',
          preferred_states: prefs.preferred_states || [],
          preferred_cities: prefs.preferred_cities || [],
          min_salary: prefs.min_salary,
          excluded_companies: prefs.excluded_companies || [],
          company_size_preference: prefs.company_size_preference || [],
          freshness_preference: prefs.freshness_preference || '7days'
        }

        // Single update with all data including onboarding_completed_at
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id)

        if (updateError) {
          console.error('Profile save error:', updateError)
          throw new Error(`Failed to save profile: ${updateError.message}`)
        }

        setSaving(false)
      } catch (err: any) {
        console.error('Onboarding save error:', err)
        setError(err.message || 'Failed to save profile. Please try again.')
        setSaving(false)
      }
    }
    saveProfile()
  }, [data])

  if (saving) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Saving your profile...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Failed to save profile</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <button
          onClick={() => router.push('/onboarding')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  const handleGoToDashboard = () => {
    setRedirecting(true)
    router.push('/dashboard')
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-3xl font-semibold text-slate-900 mb-4">You're all set!</h2>
      <p className="text-xl text-slate-600 mb-8">
        Your co-pilot is ready. Let's find your next job.
      </p>
      <button
        onClick={handleGoToDashboard}
        disabled={redirecting}
        className={`px-8 py-4 text-white rounded-xl font-semibold text-lg transition-colors ${
          redirecting
            ? 'bg-slate-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {redirecting ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Redirecting to dashboard...
          </span>
        ) : (
          'Go to Dashboard'
        )}
      </button>
    </div>
  )
}