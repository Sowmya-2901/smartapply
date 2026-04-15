/**
 * StateSelector Component
 *
 * Multi-select dropdown for US states (all 50 states + DC).
 * States are stored as 2-letter abbreviations.
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'

interface StateSelectorProps {
  value: string[]
  onChange: (states: string[]) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

// All 50 US states + DC with abbreviations and full names
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' }
]

export function StateSelector({
  value,
  onChange,
  label,
  placeholder = 'Select states',
  disabled = false,
  className = ''
}: StateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggleState = (stateValue: string) => {
    if (value.includes(stateValue)) {
      onChange(value.filter(s => s !== stateValue))
    } else {
      onChange([...value, stateValue])
    }
  }

  const selectedStates = US_STATES.filter(s => value.includes(s.value))

  return (
    <div className={className} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed flex items-center justify-between"
      >
        <span className={selectedStates.length === 0 ? 'text-slate-400' : 'text-slate-900'}>
          {selectedStates.length === 0
            ? placeholder
            : selectedStates.length === 1
            ? selectedStates[0].label
            : `${selectedStates.length} states selected`}
        </span>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Selected states display */}
      {selectedStates.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedStates.map(state => (
            <span
              key={state.value}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
            >
              {state.value}
              <button
                type="button"
                onClick={() => handleToggleState(state.value)}
                disabled={disabled}
                className="hover:text-blue-900 disabled:opacity-50"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown options */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {/* Select All / Clear All */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-3 py-2 flex gap-2">
            <button
              type="button"
              onClick={() => onChange(US_STATES.map(s => s.value))}
              disabled={disabled}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={disabled}
              className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              Clear All
            </button>
          </div>

          {/* State options */}
          <div className="max-h-48 overflow-y-auto">
            {US_STATES.map(state => (
              <label
                key={state.value}
                className={`
                  flex items-center gap-3 px-3 py-2 cursor-pointer
                  ${value.includes(state.value) ? 'bg-blue-50' : 'hover:bg-slate-50'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <input
                  type="checkbox"
                  checked={value.includes(state.value)}
                  onChange={() => handleToggleState(state.value)}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-900">
                  {state.label}
                </span>
                <span className="text-xs text-slate-400 ml-auto">
                  {state.value}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
