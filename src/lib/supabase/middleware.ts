import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Creates a Supabase client for use in Next.js middleware.
 * This handles session refresh on every request.
 *
 * This is used by the root middleware.ts file for auth redirects.
 *
 * @param request - The NextRequest object
 * @returns A tuple of [supabase client, response] for further modification
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.fromEntries(
            request.cookies.getAll().map((c) => [c.name, c.value])
          )
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh auth session if expired
  await supabase.auth.getSession()

  return supabaseResponse
}
