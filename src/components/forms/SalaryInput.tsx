/**
 * SalaryInput Component
 *
 * Number input for salary with formatting ($ sign and thousands separators).
 */

'use client'

import React, { useState } from 'react'

interface SalaryInputProps {
  value: number | null
  onChange: (salary: number | null) => void
  label?: string
  placeholder?: string
  min?: number
  max?: number
  disabled?: boolean
  className?: string
  showRange?: boolean
}

export function SalaryInput({
  value,
  onChange,
  label,
  placeholder = 'Enter minimum salary',
  min = 0,
  max = 500000,
  disabled = false,
  className = '',
  showRange = false
}: SalaryInputProps) {
  const [inputValue, setInputValue] = useState('')

  // Format salary for display
  const formatSalary = (salary: number | null): string => {
    if (salary === null || salary === 0) return ''
    return salary.toLocaleString('en-US')
  }

  // Parse salary from input
  const parseSalary = (input: string): number | null => {
    if (!input.trim()) return null
    const parsed = parseInt(input.replace(/[^0-9]/g, ''), 10)
    return isNaN(parsed) ? null : parsed
  }

  // Update input when value prop changes
  React.useEffect(() => {
    setInputValue(formatSalary(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setInputValue(raw)

    const parsed = parseSalary(raw)
    if (parsed !== null) {
      // Clamp to min/max
      const clamped = Math.max(min, Math.min(max, parsed))
      onChange(clamped)
    } else {
      onChange(null)
    }
  }

  const handleBlur = () => {
    // Reformat on blur
    setInputValue(formatSalary(value))
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
          $
        </span>
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-8 pr-12 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
          USD
        </span>
      </div>

      {/* Range indicator */}
      {showRange && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="range"
            min={min}
            max={max}
            step={5000}
            value={value || min}
            onChange={(e) => onChange(parseInt(e.target.value))}
            disabled={disabled}
            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
          />
          <span className="text-sm text-slate-600 w-24 text-right">
            {value ? `$${value.toLocaleString()}+` : 'Any'}
          </span>
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-slate-500 mt-1">
        Annual salary in USD
      </p>
    </div>
  )
}
