import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for use in Server Components and API Routes.
 * This client uses cookies for session persistence.
 *
 * Usage in Server Components:
 * ```tsx
 * import { createClient } from '@/lib/supabase/server'
 *
 * export default async function MyServerComponent() {
 *   const supabase = createClient()
 *   const { data } = await supabase.from('table').select()
 *   return <div>{JSON.stringify(data)}</div>
 * }
 * ```
 *
 * Usage in API Routes:
 * ```ts
 * import { createClient } from '@/lib/supabase/server'
 * import { NextResponse } from 'next/server'
 *
 * export async function GET() {
 *   const supabase = createClient()
 *   const { data } = await supabase.from('table').select()
 *   return NextResponse.json(data)
 * }
 * ```
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // In Server Components, cookies() is read-only
            // This is expected and safe to ignore
          }
        },
      },
    }
  )
}
