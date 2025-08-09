'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { FieldWrapper, type FieldWrapperProps } from './field-wrapper'

export interface TextAreaFieldProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    Pick<FieldWrapperProps, 'label' | 'helperText' | 'error' | 'success' | 'className'> {
  name: string
  autoResize?: boolean
}

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ name, label, helperText, error, success, className, required, autoResize = true, onChange, ...props }, ref) => {
    const localRef = React.useRef<HTMLTextAreaElement | null>(null)
    React.useEffect(() => {
      if (!autoResize || !localRef.current) return
      const el = localRef.current
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }, [autoResize])

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      if (autoResize) {
        e.currentTarget.style.height = 'auto'
        e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`
      }
      onChange?.(e)
    }

    return (
      <FieldWrapper name={name} label={label} helperText={helperText} error={error} success={success} required={required} className={className}>
        <div className="relative">
          <textarea
            id={name}
            name={name}
            ref={(node) => {
              localRef.current = node
              if (typeof ref === 'function') ref(node)
              else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node
            }}
            className={cn(
              'peer block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder-transparent outline-none transition-colors',
              'border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-200',
              success && !error && 'border-emerald-500',
              'disabled:bg-gray-100 disabled:text-gray-500'
            )}
            rows={props.rows ?? 3}
            placeholder={props.placeholder ?? ' '}
            aria-invalid={!!error}
            aria-required={required}
            onChange={handleChange}
            {...props}
          />
          {label ? (
            <label
              htmlFor={name}
              className={cn(
                'pointer-events-none absolute left-3 top-2 z-10 origin-[0] -translate-y-3 scale-90 bg-white px-1 text-xs text-gray-500 transition-all',
                'peer-placeholder-shown:top-2 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-gray-500',
                'peer-focus:-translate-y-3 peer-focus:scale-90 peer-focus:bg-white peer-focus:text-emerald-600'
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
TextAreaField.displayName = 'TextAreaField'
