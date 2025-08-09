'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface FieldWrapperProps {
  label?: string
  name: string
  required?: boolean
  helperText?: string
  error?: string
  success?: string
  className?: string
  children: React.ReactNode
}

export function FieldWrapper({
  label,
  name,
  required,
  helperText,
  error,
  success,
  className,
  children,
}: FieldWrapperProps) {
  const describedBy = [
    error ? `${name}-error` : null,
    helperText ? `${name}-help` : null,
    success ? `${name}-success` : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className={cn('grid gap-1.5', className)}>
      {label ? (
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}{' '}
          {required && <span className="text-red-600" aria-hidden="true">{'*'}</span>}
        </label>
      ) : null}
      <div aria-describedby={describedBy}>{children}</div>
      {helperText && !error && (
        <p id={`${name}-help`} className="text-xs text-gray-500">
          {helperText}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
      {success && !error && (
        <p id={`${name}-success`} className="text-xs text-emerald-600">
          {success}
        </p>
      )}
    </div>
  )
}
