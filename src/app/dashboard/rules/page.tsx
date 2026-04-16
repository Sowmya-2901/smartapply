import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resume Rules - SmartApply',
  description: 'Configure your resume optimization rules',
}

export default async function ResumeRulesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch user profile with resume rules
  const { data: profile } = await supabase
    .from('profiles')
    .select('formatting_rules, content_rules, banned_words, custom_rules')
    .eq('id', user.id)
    .single()

  const formattingRules = profile?.formatting_rules ?
    JSON.parse(profile.formatting_rules as string) :
    {
      useChronologicalFormat: true,
      includeLinkedIn: false,
      includeGitHub: true,
      includePortfolio: true,
    }

  const contentRules = profile?.content_rules ?
    JSON.parse(profile.content_rules as string) :
    {
      removeOldExperience: false,
      removeExperienceOlderThan: 5,
      removeIrrelevantExperience: true,
      quantifyAchievements: true,
      removeReferences: true,
    }

  const bannedWords = profile?.banned_words || []
  const customRules = profile?.custom_rules || ''

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Resume Rules</h1>
        <p className="text-slate-500">Configure how your resume should be optimized</p>
      </div>

      <form action="/api/resume/rules" method="POST" className="space-y-6">
        {/* Section 1: Formatting Rules */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Formatting Rules</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="useChronologicalFormat"
                defaultChecked={formattingRules.useChronologicalFormat}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-slate-700">Use chronological format (most recent first)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="includeLinkedIn"
                defaultChecked={formattingRules.includeLinkedIn}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-slate-700">Include LinkedIn profile</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="includeGitHub"
                defaultChecked={formattingRules.includeGitHub}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-slate-700">Include GitHub profile</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="includePortfolio"
                defaultChecked={formattingRules.includePortfolio}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-slate-700">Include portfolio link</span>
            </label>
          </div>
        </div>

        {/* Section 2: Content Rules */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Content Rules</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="removeOldExperience"
                defaultChecked={contentRules.removeOldExperience}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-slate-700">Remove experience older than</span>
              <input
                type="number"
                name="removeExperienceOlderThan"
                defaultValue={contentRules.removeExperienceOlderThan}
                min="1"
                max="20"
                className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-center"
              />
              <span className="text-slate-700">years</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="removeIrrelevantExperience"
                defaultChecked={contentRules.removeIrrelevantExperience}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-slate-700">Remove experience not relevant to target role</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="quantifyAchievements"
                defaultChecked={contentRules.quantifyAchievements}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-slate-700">Quantify achievements (add numbers/metrics where possible)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="removeReferences"
                defaultChecked={contentRules.removeReferences}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-slate-700">Remove "References available upon request"</span>
            </label>
          </div>
        </div>

        {/* Section 3: Banned Words */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Banned Words</h2>
          <p className="text-sm text-slate-500 mb-3">Words or phrases to remove from your resume (one per line)</p>
          <textarea
            name="bannedWords"
            defaultValue={bannedWords.join('\n')}
            rows={5}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., &#34;Responsible for&#34;, &#34;Assisted with&#34;, &#34;Worked on&#34;"
          />
        </div>

        {/* Section 4: Custom Rules */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Custom Rules</h2>
          <p className="text-sm text-slate-500 mb-3">Any additional instructions for resume optimization</p>
          <textarea
            name="customRules"
            defaultValue={customRules}
            rows={5}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Emphasize leadership experience, highlight cloud projects, etc."
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save Rules
          </button>
        </div>
      </form>
    </div>
  )
}
