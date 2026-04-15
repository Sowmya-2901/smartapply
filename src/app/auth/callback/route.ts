import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Auth Callback Route
 *
 * This handles the OAuth redirect from Google/GitHub.
 * After successful OAuth, Supabase redirects here with the session.
 *
 * Flow:
 * 1. User clicks "Continue with Google/GitHub"
 * 2. Supabase opens OAuth popup
 * 3. User approves app
 * 4. Supabase redirects to /auth/callback with code
 * 5. This route exchanges code for session
 * 6. Redirect to /dashboard (or /onboarding for new users)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  if (code) {
    const supabase = await createClient()

    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Auth error:', error)
        return NextResponse.redirect(
          new URL('/login?error=auth_failed', request.url)
        )
      }

      // Check if user has completed onboarding
      // (We'll check this by seeing if they have a profile with preferences set)
      const { data: profile } = await supabase
        .from('profiles')
        .select('experience_years')
        .eq('id', data.user.id)
        .single()

      // If no profile exists, create one from OAuth metadata
      if (!profile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
            email: data.user.email || '',
          })

        if (insertError) {
          console.error('Profile creation error:', insertError)
        }
      }

      // If profile exists but hasn't completed onboarding, redirect there
      const finalRedirect = profile?.experience_years
        ? redirectTo
        : '/onboarding'

      return NextResponse.redirect(
        new URL(finalRedirect, request.url)
      )
    } catch (err) {
      console.error('Auth callback error:', err)
      return NextResponse.redirect(
        new URL('/login?error=callback_failed', request.url)
      )
    }
  }

  // No code, redirect to login
  return NextResponse.redirect(new URL('/login', request.url))
}
