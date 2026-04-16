/**
 * JobPreferencesForm Component
 *
 * Comprehensive form for all 11 job preference filters.
 * Reusable in both onboarding and settings pages.
 */

'use client'

import React, { useState } from 'react'
import { TagInput } from './TagInput'
import { MultiSelectCheckbox, type MultiSelectOption } from './MultiSelectCheckbox'
import { ToggleSwitch } from './ToggleSwitch'
import { RadioGroup, type RadioOption } from './RadioGroup'
import { StateSelector } from './StateSelector'
import { SalaryInput } from './SalaryInput'
import { WORK_AUTHORIZATION_OPTIONS, type WorkAuthorizationStatus, getWorkAuthorizationFilters } from '@/lib/filters/workAuthorization'

// ============================================================================
// TYPES
// ============================================================================

export interface JobPreferencesData {
  job_titles: string[]
  seniority_preferences: string[]
  experience_years: number
  no_new_grad: boolean
  work_authorization: WorkAuthorizationStatus
  show_clearance_jobs: boolean
  only_show_sponsoring: boolean
  remote_preference: string
  preferred_states: string[]
  preferred_cities: string[]
  min_salary: number | null
  no_contract: boolean
  excluded_companies: string[]
  company_size_preference: string[]
  freshness_preference: string
}

export interface JobPreferencesFormProps {
  initialData?: Partial<JobPreferencesData>
  onSave: (data: JobPreferencesData) => Promise<void>
  loading?: boolean
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
}

// ============================================================================
// OPTIONS
// ============================================================================

const SENIORITY_OPTIONS: MultiSelectOption[] = [
  { value: 'Entry Level', label: 'Entry Level / Junior', description: '0-2 years of experience' },
  { value: 'Mid Level', label: 'Mid Level', description: '3-5 years of experience' },
  { value: 'Senior', label: 'Senior', description: '5+ years of experience' },
  { value: 'Staff', label: 'Staff', description: 'Individual contributor role' },
  { value: 'Principal', label: 'Principal / Distinguished', description: 'High-level IC role' },
  { value: 'Lead', label: 'Lead', description: 'Team or technical lead' }
]

const REMOTE_OPTIONS: RadioOption[] = [
  { value: 'remote', label: 'Remote only', description: 'Work from home full-time' },
  { value: 'hybrid', label: 'Hybrid', description: 'Some days in office, some remote' },
  { value: 'onsite', label: 'Onsite only', description: 'Work from office full-time' },
  { value: 'any', label: 'Any', description: 'Show all work arrangements' }
]

const COMPANY_SIZE_OPTIONS: MultiSelectOption[] = [
  { value: 'startup', label: 'Startups', description: '1-50 employees' },
  { value: 'mid-size', label: 'Mid-size', description: '51-500 employees' },
  { value: 'large', label: 'Large', description: '500+ employees' },
  { value: 'all', label: 'Show all sizes', description: 'Any company size' }
]

const FRESHNESS_OPTIONS: RadioOption[] = [
  { value: '4hours', label: 'Last 4 hours' },
  { value: '24hours', label: 'Last 24 hours (Today)' },
  { value: '3days', label: 'Last 3 days' },
  { value: '7days', label: 'Last 7 days (This week)' },
  { value: '30days', label: 'Last 30 days' },
  { value: 'all', label: 'All time' }
]

// ============================================================================
// COMPONENT
// ============================================================================

export function JobPreferencesForm({
  initialData,
  onSave,
  loading = false,
  submitLabel = 'Save Preferences',
  cancelLabel = 'Cancel',
  onCancel
}: JobPreferencesFormProps) {
  // Form state
  const [jobTitles, setJobTitles] = useState<string[]>(initialData?.job_titles || [])
  const [seniorityPreferences, setSeniorityPreferences] = useState<string[]>(initialData?.seniority_preferences || [])
  const [experienceYears, setExperienceYears] = useState<number>(initialData?.experience_years || 0)
  const [noNewGrad, setNoNewGrad] = useState<boolean>(initialData?.no_new_grad ?? true)
  const [workAuthorization, setWorkAuthorization] = useState<WorkAuthorizationStatus>(
    (initialData?.work_authorization as WorkAuthorizationStatus) || 'US Citizen'
  )
  const [showClearanceJobs, setShowClearanceJobs] = useState<boolean>(initialData?.show_clearance_jobs || false)
  const [onlyShowSponsoring, setOnlyShowSponsoring] = useState<boolean>(initialData?.only_show_sponsoring || false)
  const [remotePreference, setRemotePreference] = useState<string>(initialData?.remote_preference || 'any')
  const [preferredStates, setPreferredStates] = useState<string[]>(initialData?.preferred_states || [])
  const [preferredCities, setPreferredCities] = useState<string[]>(initialData?.preferred_cities || [])
  const [minSalary, setMinSalary] = useState<number | null>(initialData?.min_salary || null)
  const [noContract, setNoContract] = useState<boolean>(initialData?.no_contract ?? true)
  const [excludedCompanies, setExcludedCompanies] = useState<string[]>(initialData?.excluded_companies || [])
  const [companySizePreference, setCompanySizePreference] = useState<string[]>(initialData?.company_size_preference || [])
  const [freshnessPreference, setFreshnessPreference] = useState<string>(initialData?.freshness_preference || '7days')

  // Get filter description based on work authorization status
  const authFilters = getWorkAuthorizationFilters(workAuthorization, {
    showClearance: showClearanceJobs,
    onlySponsoring: onlyShowSponsoring
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data: JobPreferencesData = {
      job_titles: jobTitles,
      seniority_preferences: seniorityPreferences,
      experience_years: experienceYears,
      no_new_grad: noNewGrad,
      work_authorization: workAuthorization,
      show_clearance_jobs: showClearanceJobs,
      only_show_sponsoring: onlyShowSponsoring,
      remote_preference: remotePreference,
      preferred_states: preferredStates,
      preferred_cities: preferredCities,
      min_salary: minSalary,
      no_contract: noContract,
      excluded_companies: excludedCompanies,
      company_size_preference: companySizePreference,
      freshness_preference: freshnessPreference
    }

    await onSave(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* SECTION 1: What roles are you looking for? */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">What roles are you looking for?</h3>

        {/* Job Titles */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Job Titles <span className="text-red-500">*</span>
          </label>
          <TagInput
            value={jobTitles}
            onChange={setJobTitles}
            placeholder="e.g., Backend Engineer, SDE II, Platform Engineer"
          />
        </div>

        {/* Seniority Level */}
        <div className="mb-6">
          <MultiSelectCheckbox
            options={SENIORITY_OPTIONS}
            value={seniorityPreferences}
            onChange={setSeniorityPreferences}
            label="Seniority Level"
            columns={2}
          />
        </div>

        {/* Years of Experience */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Years of Experience
          </label>
          <input
            type="number"
            value={experienceYears || ''}
            onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
            min="0"
            max="50"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your years of experience"
          />
          <p className="text-xs text-slate-500 mt-1">
            We'll show jobs requiring this number of years or fewer
          </p>
        </div>

        {/* New Grad Toggle */}
        <ToggleSwitch
          checked={noNewGrad}
          onChange={setNoNewGrad}
          label="Hide new grad positions only"
          description="Jobs specifically tagged as new grad, campus hire, or university hire won't appear in your feed"
        />
      </section>

      {/* SECTION 2: Work Authorization */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Work Authorization</h3>

        {/* Work Authorization Dropdown */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            What is your work authorization status? <span className="text-red-500">*</span>
          </label>
          <select
            value={workAuthorization}
            onChange={(e) => setWorkAuthorization(e.target.value as WorkAuthorizationStatus)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {WORK_AUTHORIZATION_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            {WORK_AUTHORIZATION_OPTIONS.find(o => o.value === workAuthorization)?.description}
          </p>
        </div>

        {/* Override Toggles */}
        <div className="space-y-4 mb-6">
          <ToggleSwitch
            checked={showClearanceJobs}
            onChange={setShowClearanceJobs}
            label="Show jobs requiring security clearance"
            description="Include jobs that require security clearance (US citizens and Green Card holders can obtain clearance)"
          />
          <ToggleSwitch
            checked={onlyShowSponsoring}
            onChange={setOnlyShowSponsoring}
            label="Only show jobs that explicitly offer visa sponsorship"
            description="Hide all jobs that don't explicitly mention visa sponsorship"
          />
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>How your jobs are filtered:</strong> {authFilters.description}
          </p>
        </div>
      </section>

      {/* SECTION 3: Location Preferences */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Location Preferences</h3>

        {/* Remote Preference */}
        <div className="mb-6">
          <RadioGroup
            name="remote_preference"
            options={REMOTE_OPTIONS}
            value={remotePreference}
            onChange={setRemotePreference}
            label="Work Type"
            layout="horizontal"
          />
        </div>

        {/* States */}
        <div className="mb-6">
          <StateSelector
            value={preferredStates}
            onChange={setPreferredStates}
            label="Preferred States"
            placeholder="Select states you're willing to work in"
          />
        </div>

        {/* Cities (Optional) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Preferred Cities <span className="text-slate-400">(Optional)</span>
          </label>
          <TagInput
            value={preferredCities}
            onChange={setPreferredCities}
            placeholder="e.g., San Francisco, Austin, Seattle"
          />
          <p className="text-xs text-slate-500 mt-1">
            Optional - add specific cities if you want to narrow down your search within selected states
          </p>
        </div>
      </section>

      {/* SECTION 4: Salary & Job Type */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Salary & Job Type</h3>

        {/* Minimum Salary */}
        <div className="mb-6">
          <SalaryInput
            value={minSalary}
            onChange={setMinSalary}
            label="Minimum Expected Salary"
            placeholder="Enter your minimum expected salary"
            showRange={true}
          />
          <p className="text-xs text-slate-500 mt-1">
            We'll only show jobs with a maximum salary at or above this amount. Jobs without salary info will still be shown.
          </p>
        </div>

        {/* Contract Toggle */}
        <div className="mb-6">
          <ToggleSwitch
            checked={noContract}
            onChange={setNoContract}
            label="Hide contract and temporary positions"
            description="Jobs tagged as contract or temporary won't appear in your feed"
          />
        </div>

        {/* Job Freshness */}
        <div>
          <RadioGroup
            name="freshness"
            options={FRESHNESS_OPTIONS}
            value={freshnessPreference}
            onChange={setFreshnessPreference}
            label="Show jobs posted within"
            layout="horizontal"
          />
        </div>
      </section>

      {/* SECTION 5: Company Preferences */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Company Preferences</h3>

        {/* Excluded Companies */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Companies to Exclude <span className="text-slate-400">(Optional)</span>
          </label>
          <TagInput
            value={excludedCompanies}
            onChange={setExcludedCompanies}
            placeholder="e.g., Amazon, Meta, Google"
          />
          <p className="text-xs text-slate-500 mt-1">
            Add companies you don't want to see (e.g., where you've already been rejected)
          </p>
        </div>

        {/* Company Size */}
        <div>
          <MultiSelectCheckbox
            options={COMPANY_SIZE_OPTIONS}
            value={companySizePreference}
            onChange={setCompanySizePreference}
            label="Company Size"
            columns={2}
          />
        </div>
      </section>

      {/* Submit Buttons - Only show in settings page, not onboarding */}
      {onCancel && (
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : submitLabel}
          </button>
        </div>
      )}
    </form>
  )
}
