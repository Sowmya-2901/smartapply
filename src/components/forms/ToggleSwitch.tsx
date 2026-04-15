/**
 * ToggleSwitch Component
 *
 * On/off toggle switch for boolean preferences.
 */

'use client'

import React from 'react'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  className?: string
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = ''
}: ToggleSwitchProps) {
  return (
    <label className={`flex items-center justify-between gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <div className="flex-1">
        <span className="text-sm font-medium text-slate-900">
          {label}
        </span>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">
            {description}
          </p>
        )}
      </div>

      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="
          w-11 h-6
          bg-slate-200
          peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:outline-none
          rounded-full
          peer peer-checked:after:translate-x-full
          after:content-[''] after:absolute
          after:top-[2px] after:left-[2px]
          after:bg-white
          after:rounded-full
          after:h-5 after:w-5
          after:transition-all
          peer-checked:bg-blue-600
          peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
        " />
      </div>
    </label>
  )
}
