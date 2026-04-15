'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { JobPreferencesForm, type JobPreferencesData } from '@/components/forms/JobPreferencesForm'
import type { User } from '@supabase/supabase-js'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'preferences' | 'profile' | 'answers' | 'account'>('preferences')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Form states
  const [initialPreferences, setInitialPreferences] = useState<Partial<JobPreferencesData>>({})

  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Load profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setInitialPreferences({
          job_titles: profile.job_titles || [],
          seniority_preferences: profile.seniority_preferences || [],
          experience_years: profile.experience_years || 0,
          no_new_grad: profile.no_new_grad ?? true,
          no_contract: profile.no_contract ?? true,
          work_authorization: profile.work_authorization || 'US Citizen',
          show_clearance_jobs: profile.show_clearance_jobs || false,
          only_show_sponsoring: profile.only_show_sponsoring || false,
          remote_preference: profile.remote_preference || 'any',
          preferred_states: profile.preferred_states || [],
          preferred_cities: profile.preferred_cities || [],
          min_salary: profile.min_salary,
          excluded_companies: profile.excluded_companies || [],
          company_size_preference: profile.company_size_preference || [],
          freshness_preference: profile.freshness_preference || '7days'
        })
      }

      setLoading(false)
    }

    loadUserData()
  }, [router])

  const handleSavePreferences = async (preferences: JobPreferencesData) => {
    setSaving(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update(preferences)
      .eq('id', user?.id)

    setSaving(false)

    if (error) {
      console.error('Error saving preferences:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to save preferences' })
    } else {
      setMessage({ type: 'success', text: 'Preferences saved! Your job feed will update.' })
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This will permanently delete all your data including resumes, applications, and preferences. This action cannot be undone.')) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user?.id)

    if (!error) {
      await supabase.auth.signOut()
      router.push('/login')
    } else {
      setMessage({ type: 'error', text: 'Failed to delete account' })
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="text-slate-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your preferences and account</p>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'preferences'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Job Preferences
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Auto-fill Profile
        </button>
        <button
          onClick={() => setActiveTab('answers')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'answers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Answer Bank
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'account'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Account
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        {activeTab === 'preferences' && (
          <JobPreferencesForm
            initialData={initialPreferences}
            onSave={handleSavePreferences}
            loading={saving}
            submitLabel="Save Preferences"
          />
        )}

        {activeTab === 'profile' && (
          <div className="text-center py-8">
            <p className="text-slate-500 mb-4">Auto-fill profile settings coming soon.</p>
            <button
              onClick={() => router.push('/onboarding?step=5')}
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              Complete Onboarding
            </button>
          </div>
        )}

        {activeTab === 'answers' && (
          <div className="text-center py-8">
            <p className="text-slate-500 mb-4">Answer bank settings coming soon.</p>
            <button
              onClick={() => router.push('/onboarding?step=6')}
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              Complete Onboarding
            </button>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
              <div className="text-slate-900">{user?.email}</div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                Change Password
              </button>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Delete Account
              </button>
              <p className="text-xs text-slate-500 mt-2">
                This will permanently delete all your data. This action cannot be undone.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <button
                onClick={handleSignOut}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
