'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Logout Utility
 *
 * Signs the user out and redirects to the landing page.
 *
 * Usage in Client Components:
 * ```tsx
 * 'use client'
 * import { logout } from '@/lib/auth/logout'
 *
 * export default function LogoutButton() {
 *   return (
 *     <button onClick={logout}>Sign out</button>
 *   )
 * }
 * ```
 */
export async function logout() {
  const supabase = createClient()
  const router = useRouter()

  try {
    // Sign out from Supabase
    await supabase.auth.signOut()

    // Redirect to landing page
    router.push('/')
    router.refresh()
  } catch (error) {
    console.error('Logout error:', error)
    // Still redirect even if logout fails
    router.push('/')
    router.refresh()
  }
}

/**
 * Logout Button Component
 *
 * A pre-styled logout button for easy use.
 */
export function LogoutButton({ className = '' }: { className?: string }) {
  return (
    <button
      onClick={logout}
      className={`text-sm text-slate-600 hover:text-slate-900 transition-colors ${className}`}
    >
      Sign out
    </button>
  )
}
