import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js Middleware
 *
 * This runs on every request before it reaches the page.
 * It:
 * 1. Refreshes the Supabase auth session
 * 2. Redirects unauthenticated users to /login
 * 3. Redirects authenticated users from /login to /dashboard
 *
 * Public routes (no auth required):
 * - / (landing page)
 * - /login
 * - /signup
 * - /auth/callback (OAuth redirect)
 *
 * Protected routes (auth required):
 * - /dashboard
 * - /onboarding
 */

export async function middleware(request: NextRequest) {
  // Update session (refreshes auth if needed)
  const response = await updateSession(request)

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/auth/callback']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Check auth status from cookies (Supabase SSR stores session in cookies)
  const hasSession = request.cookies.get('sb-aocbhskbeymvfniiirut-auth-token')?.value

  // Redirect unauthenticated users from protected routes to /login
  if (!hasSession && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return Response.redirect(url)
  }

  // Redirect authenticated users from /login or /signup to /dashboard
  if (hasSession && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return Response.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
