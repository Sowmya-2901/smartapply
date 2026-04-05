'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Logout Hook
 *
 * Custom hook for handling user logout.
 * Use this in Client Components.
 *
 * Usage:
 * ```tsx
 * 'use client'
 * import { useLogout } from '@/lib/auth/logout'
 *
 * export default function MyComponent() {
 *   const { logout, isLoggingOut } = useLogout()
 *   return <button onClick={logout} disabled={isLoggingOut}>Sign out</button>
 * }
 * ```
 */
export function useLogout() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const logout = useCallback(async () => {
    setIsLoggingOut(true)
    const supabase = createClient()

    try {
      // Sign out from Supabase
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if logout fails
    } finally {
      // Redirect to landing page
      router.push('/')
      router.refresh()
      setIsLoggingOut(false)
    }
  }, [router])

  return { logout, isLoggingOut }
}

/**
 * Logout Button Component
 *
 * A pre-styled logout button for easy use.
 */
export function LogoutButton({ className = '' }: { className?: string }) {
  const { logout, isLoggingOut } = useLogout()

  return (
    <button
      onClick={logout}
      disabled={isLoggingOut}
      className={`text-sm text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50 ${className}`}
    >
      {isLoggingOut ? 'Signing out...' : 'Sign out'}
    </button>
  )
}
