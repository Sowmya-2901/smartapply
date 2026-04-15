'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface OAuthButtonProps {
  provider: 'google' | 'github'
  children: React.ReactNode
}

export function OAuthButton({ provider, children }: OAuthButtonProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleOAuthLogin = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      console.error('OAuth error:', err)
      // Could show error toast here
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleOAuthLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="text-slate-600">Connecting...</span>
      ) : (
        children
      )}
    </button>
  )
}
