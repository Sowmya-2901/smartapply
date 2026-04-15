/**
 * RadioGroup Component
 *
 * Radio button group for selecting a single option from a list.
 */

'use client'

import React from 'react'

export interface RadioOption {
  value: string
  label: string
  description?: string
}

interface RadioGroupProps {
  name: string
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  label?: string
  disabled?: boolean
  className?: string
  layout?: 'vertical' | 'horizontal'
}

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  label,
  disabled = false,
  className = '',
  layout = 'vertical'
}: RadioGroupProps) {
  const isHorizontal = layout === 'horizontal'

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-3">
          {label}
        </label>
      )}

      <div className={isHorizontal ? 'flex flex-wrap gap-4' : 'space-y-3'}>
        {options.map(option => (
          <label
            key={option.value}
            className={`
              flex items-start gap-3 cursor-pointer
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${isHorizontal ? 'flex-1 min-w-fit' : ''}
            `}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="mt-0.5 w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-900">
                {option.label}
              </span>
              {option.description && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {option.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
