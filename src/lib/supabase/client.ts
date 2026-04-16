import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in browser components (Client Components).
 * This client uses localStorage for session persistence.
 *
 * Usage in Client Components:
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 *
 * export default function MyComponent() {
 *   const supabase = createClient()
 *   // Use supabase.auth, supabase.from(), etc.
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
