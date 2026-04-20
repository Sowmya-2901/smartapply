'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { manualJobPoll } from '@/app/dashboard/actions'

interface PollStatus {
  type: 'success' | 'error' | null
  message: string
}

export function JobFetchButton() {
  const router = useRouter()
  const [polling, setPolling] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [pollStatus, setPollStatus] = useState<PollStatus>({ type: null, message: '' })

  const handleManualPoll = async () => {
    setPolling(true)
    setPollStatus({ type: null, message: '' })

    try {
      const result = await manualJobPoll()

      if (result.success) {
        setPollStatus({
          type: 'success',
          message: result.message || `Successfully fetched jobs! ${result.newJobs} new, ${result.updatedJobs} updated.`
        })

        // Refresh the dashboard to show new jobs
        startTransition(() => {
          router.refresh()
        })
      } else {
        setPollStatus({
          type: 'error',
          message: result.error || 'Failed to fetch jobs. Please try again.'
        })
      }
    } catch (error) {
      setPollStatus({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
      })
    } finally {
      setPolling(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔄</span>
          <div>
            <p className="font-medium text-slate-900">Need more jobs?</p>
            <p className="text-sm text-slate-500">Manually fetch the latest jobs from 104 companies</p>
          </div>
        </div>
        <button
          onClick={handleManualPoll}
          disabled={polling || isPending}
          className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
            polling || isPending
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {polling || isPending ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Fetching jobs from 104 companies...
            </span>
          ) : (
            'Fetch Jobs Now'
          )}
        </button>
      </div>
      {pollStatus.type && (
        <div className={`mt-4 px-4 py-3 rounded-lg text-sm ${
          pollStatus.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {pollStatus.message}
        </div>
      )}
    </div>
  )
}
