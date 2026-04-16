/**
 * MultiSelectCheckbox Component
 *
 * Multi-select with checkboxes for selecting multiple options from a list.
 */

'use client'

import React from 'react'

export interface MultiSelectOption {
  value: string
  label: string
  description?: string
}

interface MultiSelectCheckboxProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (values: string[]) => void
  label?: string
  disabled?: boolean
  className?: string
  columns?: 1 | 2 | 3
}

export function MultiSelectCheckbox({
  options,
  value,
  onChange,
  label,
  disabled = false,
  className = '',
  columns = 2
}: MultiSelectCheckboxProps) {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue])
    } else {
      onChange(value.filter(v => v !== optionValue))
    }
  }

  const gridCols = columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-3">
          {label}
        </label>
      )}

      <div className={`grid ${gridCols} gap-3`}>
        {options.map(option => (
          <label
            key={option.value}
            className={`
              flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors
              ${value.includes(option.value)
                ? 'bg-blue-50 border-blue-300'
                : 'bg-white border-slate-200 hover:bg-slate-50'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              disabled={disabled}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <div className="flex-1">
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
