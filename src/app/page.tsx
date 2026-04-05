import Link from 'next/link'

/**
 * SmartApply Landing Page
 *
 * Public-facing landing page with:
 * - Hero section with value prop
 * - 3-column feature section
 * - Company logos section (placeholders)
 * - CTA button to /signup
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="text-2xl font-bold text-white">SmartApply</div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-slate-300 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-white text-slate-900 px-5 py-2 rounded-lg font-medium hover:bg-slate-100 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 lg:px-12 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Stop spraying resumes.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Start landing interviews.
            </span>
          </h1>
          <p className="text-xl lg:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            SmartApply finds real tech jobs, AI-tailors your resume for each one,
            and helps you apply in minutes — not hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold text-lg hover:bg-slate-100 transition-colors shadow-lg shadow-white/10"
            >
              Get Started Free
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-4 border border-slate-600 text-white rounded-xl font-semibold text-lg hover:bg-slate-800 transition-colors"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 lg:px-12 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Smart Job Matching
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Jobs from 500+ real tech companies. No staffing agencies.
                No ghost jobs. Only verified positions at companies you want to work for.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                AI Resume Tailoring
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Your resume rewritten for each job description. ATS-optimized.
                Human-quality writing. Add missing skills, rephrase bullets, match keywords.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Track Everything
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Every application tracked with the exact resume version you sent.
                Follow-up reminders, status updates, and full JD snapshots.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Companies Section */}
      <section className="px-6 py-16 lg:px-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-400 mb-10 text-lg">
            Jobs from companies like
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16 opacity-60">
            {/* Company logo placeholders - using text for now */}
            <span className="text-2xl font-bold text-slate-300">Stripe</span>
            <span className="text-2xl font-bold text-slate-300">Spotify</span>
            <span className="text-2xl font-bold text-slate-300">Airbnb</span>
            <span className="text-2xl font-bold text-slate-300">Discord</span>
            <span className="text-2xl font-bold text-slate-300">Reddit</span>
            <span className="text-2xl font-bold text-slate-300">Figma</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 lg:px-12 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to land your next tech job?
          </h2>
          <p className="text-xl text-slate-300 mb-10">
            Join thousands of engineers applying smarter, not harder.
          </p>
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-white text-slate-900 rounded-xl font-semibold text-lg hover:bg-slate-100 transition-colors shadow-lg"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 lg:px-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-slate-400">
            © 2026 SmartApply. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
