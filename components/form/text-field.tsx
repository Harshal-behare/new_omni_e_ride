'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { FieldWrapper, type FieldWrapperProps } from './field-wrapper'

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    Pick<FieldWrapperProps, 'label' | 'helperText' | 'error' | 'success' | 'className'> {
  name: string
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ name, label, helperText, error, success, className, leadingIcon, trailingIcon, required, ...props }, ref) => {
    return (
      <FieldWrapper name={name} label={label} helperText={helperText} error={error} success={success} required={required} className={className}>
        <div className="relative">
          {leadingIcon ? (
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">{leadingIcon}</span>
          ) : null}
          <input
            id={name}
            name={name}
            ref={ref}
            className={cn(
              'peer block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder-transparent outline-none transition-colors',
              'border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-200',
              success && !error && 'border-emerald-500',
              leadingIcon && 'pl-10',
              trailingIcon && 'pr-10',
              'disabled:bg-gray-100 disabled:text-gray-500'
            )}
            placeholder={props.placeholder ?? ' '}
            aria-invalid={!!error}
            aria-required={required}
            {...props}
          />
          {trailingIcon ? (
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">{trailingIcon}</span>
          ) : null}
          {label ? (
            <label
              htmlFor={name}
              className={cn(
                'pointer-events-none absolute left-3 top-2 z-10 origin-[0] -translate-y-3 scale-90 bg-white px-1 text-xs text-gray-500 transition-all',
                'peer-placeholder-shown:top-2 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-gray-500',
                'peer-focus:-translate-y-3 peer-focus:scale-90 peer-focus:bg-white peer-focus:text-emerald-600',
                leadingIcon && 'left-10'
              )}
            >
              {label}
            </label>
          ) : null}
        </div>
      </FieldWrapper>
    )
  }
)
TextField.displayName = 'TextField'
