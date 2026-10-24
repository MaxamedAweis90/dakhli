import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

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
          {leftIcon && (
            <span className="text-slate-400 mr-2 flex-shrink-0">{leftIcon}</span>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none',
              disabled && 'cursor-not-allowed',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <span className="text-slate-400 ml-2 flex-shrink-0">{rightIcon}</span>
          )}
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

Input.displayName = 'Input'

export default Input
