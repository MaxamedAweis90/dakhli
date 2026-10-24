import React from 'react'
import { cn } from '@/lib/utils'

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  error?: string
  helperText?: string
  currencySymbol?: string
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onValueChange?: (numericValue: number) => void
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      label,
      error,
      helperText,
      currencySymbol = '$',
      value,
      onChange,
      onValueChange,
      className,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      // Allow only numbers and a single decimal dot
      const sanitized = raw.replace(/[^0-9.]/g, '')

      // Prevent multiple dots
      const parts = sanitized.split('.')
      const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized

      e.target.value = formatted

      if (onChange) {
        onChange(e)
      }

      if (onValueChange) {
        const num = parseFloat(formatted)
        onValueChange(isNaN(num) ? 0 : num)
      }
    }

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-slate-300"
          >
            {label}
          </label>
        )}

        <div
          className={cn(
            'flex items-center bg-surface-card border rounded-xl px-3 py-2 transition-colors duration-150',
            error
              ? 'border-status-danger focus-within:border-status-danger focus-within:ring-1 focus-within:ring-status-danger/30'
              : 'border-surface-subtle focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30',
            disabled && 'opacity-50 cursor-not-allowed bg-surface-elevated/30'
          )}
        >
          <span className="text-slate-400 font-mono font-medium mr-1.5 select-none text-sm">
            {currencySymbol}
          </span>

          <input
            id={inputId}
            ref={ref}
            type="text"
            inputMode="decimal"
            disabled={disabled}
            value={value}
            onChange={handleChange}
            className={cn(
              'w-full bg-transparent text-slate-100 placeholder:text-slate-500 font-mono text-sm tabular-nums focus:outline-none',
              disabled && 'cursor-not-allowed',
              className
            )}
            {...props}
          />
        </div>

        {error ? (
          <p className="text-[11px] text-status-danger font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'

export default CurrencyInput
