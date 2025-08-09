'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FieldWrapper, type FieldWrapperProps } from './field-wrapper'

export interface RadioOption {
  label: string
  value: string
  description?: string
}

export interface RadioGroupFieldProps
  extends Pick<FieldWrapperProps, 'label' | 'helperText' | 'error' | 'success' | 'className'> {
  name: string
  options: RadioOption[]
  defaultValue?: string
  onValueChange?: (value: string) => void
  required?: boolean
}

export function RadioGroupField({
  name,
  label,
  helperText,
  error,
  success,
  className,
  options,
  defaultValue,
  onValueChange,
  required,
}: RadioGroupFieldProps) {
  const [value, setValue] = React.useState(defaultValue ?? '')
  return (
    <FieldWrapper name={name} label={label} helperText={helperText} error={error} success={success} required={required} className={className}>
      <input type="hidden" name={name} value={value} />
      <RadioGroup
        value={value}
        onValueChange={(v) => {
          setValue(v)
          onValueChange?.(v)
        }}
      >
        <div className="grid gap-2">
          {options.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <RadioGroupItem
                id={`${name}-${opt.value}`}
                value={opt.value}
                className="text-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <div className="grid">
                <Label htmlFor={`${name}-${opt.value}`} className="cursor-pointer">
                  {opt.label}
                </Label>
                {opt.description && (
                  <span className="text-xs text-gray-500">{opt.description}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </RadioGroup>
    </FieldWrapper>
  )
}
