'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
  jobTitles?: string[]
  locations?: string[]
  remotePreference?: string
  minSalary?: number
  experienceYears?: number
  noNewGrad?: boolean
  noContract?: boolean
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
    remotePreference: 'remote',
    noNewGrad: true,
    noContract: true
  })

  // Check if user already completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('experience_years')
          .eq('id', user.id)
          .single()

        // If profile exists and has onboarding data, redirect to dashboard
        if (profile?.experience_years) {
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
        return <Step1UploadResume data={data} updateData={updateData} nextStep={nextStep} setError={setError} />
      case 2:
        return <Step2ResumeRules data={data} updateData={updateData} />
      case 3:
        return <Step3MasterOptimization data={data} updateData={updateData} />
      case 4:
        return <Step4JobPreferences data={data} updateData={updateData} />
      case 5:
        return <Step5AutofillProfile data={data} updateData={updateData} />
      case 6:
        return <Step6AnswerBank data={data} updateData={updateData} />
      case 7:
        return <Step7Complete />
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
function Step1UploadResume({ data, updateData, nextStep, setError }: {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  nextStep: () => void
  setError: (error: string | null) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

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
        updateData({
          resumeId: result.resumeId,
          parsedText: result.parsedText,
          parsedSkills: result.parsedSkills
        })
        nextStep()
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
function Step4JobPreferences({ data, updateData }: {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}) {
  const [newTitle, setNewTitle] = useState('')
  const [newLocation, setNewLocation] = useState('')

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900 mb-4">Job search preferences</h2>
      <p className="text-slate-600 mb-8">
        Tell us what kind of jobs you're looking for. This helps us find the best matches.
      </p>

      {/* Job Titles */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Job Titles</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {data.jobTitles?.map(title => (
            <span
              key={title}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
            >
              {title}
              <button onClick={() => updateData({ jobTitles: data.jobTitles?.filter(t => t !== title) })}>&times;</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newTitle.trim()) {
                updateData({ jobTitles: [...(data.jobTitles || []), newTitle.trim()] })
                setNewTitle('')
              }
            }}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
            placeholder="Add a job title (e.g., Backend Engineer)"
          />
          <button
            onClick={() => {
              if (newTitle.trim()) {
                updateData({ jobTitles: [...(data.jobTitles || []), newTitle.trim()] })
                setNewTitle('')
              }
            }}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg"
          >
            Add
          </button>
        </div>
      </div>

      {/* Locations */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Locations</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {data.locations?.map(location => (
            <span
              key={location}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
            >
              {location}
              <button onClick={() => updateData({ locations: data.locations?.filter(l => l !== location) })}>&times;</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newLocation.trim()) {
                updateData({ locations: [...(data.locations || []), newLocation.trim()] })
                setNewLocation('')
              }
            }}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
            placeholder="Add a location (e.g., Remote, San Francisco)"
          />
          <button
            onClick={() => {
              if (newLocation.trim()) {
                updateData({ locations: [...(data.locations || []), newLocation.trim()] })
                setNewLocation('')
              }
            }}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg"
          >
            Add
          </button>
        </div>
      </div>

      {/* Remote Preference */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Remote Preference</label>
        <div className="flex gap-4">
          {['remote', 'hybrid', 'onsite', 'any'].map(pref => (
            <label key={pref} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="remote"
                value={pref}
                checked={data.remotePreference === pref}
                onChange={(e) => updateData({ remotePreference: e.target.value })}
                className="w-4 h-4 text-blue-600"
              />
              <span className="capitalize">{pref}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience Years */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Years of Experience</label>
        <input
          type="number"
          value={data.experienceYears || ''}
          onChange={(e) => updateData({ experienceYears: parseInt(e.target.value) || 0 })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg"
          placeholder="Enter your years of experience"
          min="0"
          max="50"
        />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.noNewGrad}
            onChange={(e) => updateData({ noNewGrad: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-slate-700">Hide new grad/entry level positions</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.noContract}
            onChange={(e) => updateData({ noContract: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-slate-700">Hide contract/temp positions</span>
        </label>
      </div>
    </div>
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
            <option value="US Citizen">US Citizen</option>
            <option value="Green Card">Green Card</option>
            <option value="H1-B">H1-B</option>
            <option value="OPT">OPT</option>
            <option value="EAD">EAD</option>
            <option value="Other">Other</option>
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
function Step7Complete() {
  const router = useRouter()
  const [saving, setSaving] = useState(true)

  useEffect(() => {
    const saveProfile = async () => {
      setSaving(true)
      // In a real implementation, save all the onboarding data to the profile
      setSaving(false)
    }
    saveProfile()
  }, [])

  if (saving) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Saving your profile...</h2>
      </div>
    )
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
        onClick={() => router.push('/dashboard')}
        className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700"
      >
        Go to Dashboard
      </button>
    </div>
  )
}