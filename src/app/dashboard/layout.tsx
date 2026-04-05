'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from '@/lib/auth/logout'

/**
 * Dashboard Layout Component
 *
 * Provides the common layout for all dashboard pages:
 * - Top navigation bar with logo, search, notifications, profile
 * - Left sidebar with navigation links
 * - Main content area
 */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email)
      }
    }
    loadUser()
  }, [])

  const navItems = [
    { href: '/dashboard', icon: '📋', label: 'Jobs' },
    { href: '/dashboard/resumes', icon: '📄', label: 'My Resumes' },
    { href: '/dashboard/tracker', icon: '📊', label: 'Tracker' },
    { href: '/dashboard/rules', icon: '📝', label: 'Rules' },
    { href: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64
        bg-slate-900 text-white
        transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        transition-transform duration-300 ease-in-out
        flex flex-col
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold">SmartApply</h1>
          <p className="text-slate-400 text-sm">Your job search co-pilot</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-colors duration-200
                      ${isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1 h-4 bg-white/50 rounded-full" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              {userEmail?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userEmail}</p>
            </div>
          </div>
          <LogoutButton className="w-full px-4 py-2 text-left text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-6 py-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  placeholder="Search jobs..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-lg text-slate-900 placeholder-slate-500 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Right side icons */}
            <div className="flex items-center gap-4">
              {/* Notifications (placeholder) */}
              <button className="relative p-2 text-slate-600 hover:text-slate-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Profile dropdown (placeholder) */}
              <div className="hidden sm:block w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {userEmail?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
