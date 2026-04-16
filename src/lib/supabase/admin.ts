import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with SERVICE ROLE for admin operations
 * Use this in API routes that need elevated permissions (like job polling)
 *
 * WARNING: This client bypasses RLS! Only use for trusted server-side operations.
 * API routes don't have cookies, so we don't provide cookie configuration.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key for admin ops
  )
}
