'use client'

import * as React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { FieldWrapper, type FieldWrapperProps } from './field-wrapper'

export interface CheckboxFieldProps
  extends Pick<FieldWrapperProps, 'helperText' | 'error' | 'success' | 'className'> {
  name: string
  label: string
  required?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export function CheckboxField({
  name,
  label,
  helperText,
  error,
  success,
  className,
  required,
  defaultChecked,
  onCheckedChange,
}: CheckboxFieldProps) {
  const [checked, setChecked] = React.useState<boolean>(!!defaultChecked)
  return (
    <FieldWrapper name={name} helperText={helperText} error={error} success={success} required={required} className={className}>
      <div className="flex items-start gap-2">
        <input type="hidden" name={name} value={checked ? 'on' : ''} />
        <Checkbox
          checked={checked}
          onCheckedChange={(val) => {
            const v = Boolean(val)
            setChecked(v)
            onCheckedChange?.(v)
          }}
          className={cn('data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600')}
          aria-required={required}
        />
        <label
          onClick={() => setChecked((v) => !v)}
          className="text-sm text-gray-800 select-none cursor-pointer"
        >
          {label}
          {required && <span className="text-red-600">{' *'}</span>}
        </label>
      </div>
    </FieldWrapper>
  )
}
