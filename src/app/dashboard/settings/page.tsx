'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'preferences' | 'profile' | 'answers' | 'account'>('preferences')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Form states
  const [jobTitles, setJobTitles] = useState('')
  const [locations, setLocations] = useState('')
  const [remotePreference, setRemotePreference] = useState<string>('any')
  const [minSalary, setMinSalary] = useState('')

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
        setJobTitles((profile.job_titles || []).join(', '))
        setLocations((profile.locations || []).join(', '))
        setRemotePreference(profile.remote_preference || 'any')
        setMinSalary(profile.min_salary?.toString() || '')
      }

      setLoading(false)
    }

    loadUserData()
  }, [router])

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        job_titles: jobTitles.split(',').map(t => t.trim()).filter(Boolean),
        locations: locations.split(',').map(l => l.trim()).filter(Boolean),
        remote_preference: remotePreference,
        min_salary: minSalary ? parseInt(minSalary) : null,
      })
      .eq('id', user?.id)

    setSaving(false)

    if (error) {
      console.error('Error saving preferences:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to save preferences' })
    } else {
      setMessage({ type: 'success', text: 'Preferences saved successfully' })
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
          <form onSubmit={handleSavePreferences} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Titles</label>
              <input
                type="text"
                value={jobTitles}
                onChange={(e) => setJobTitles(e.target.value)}
                placeholder="Software Engineer, Frontend Developer, Full Stack Developer"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Comma-separated list of target job titles</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Locations</label>
              <input
                type="text"
                value={locations}
                onChange={(e) => setLocations(e.target.value)}
                placeholder="San Francisco, New York, Remote"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Comma-separated list of preferred locations</p>
            </div>

            <div>
              <label htmlFor="remotePreference" className="block text-sm font-medium text-slate-700 mb-1">Remote Preference</label>
              <select
                id="remotePreference"
                value={remotePreference}
                onChange={(e) => setRemotePreference(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="any">Any (remote, hybrid, or onsite)</option>
                <option value="remote">Remote only</option>
                <option value="hybrid">Hybrid (remote + onsite)</option>
                <option value="onsite">Onsite only</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Filter jobs by work arrangement</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Salary</label>
              <input
                type="number"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                placeholder="100000"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Annual salary in USD (optional)</p>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
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
