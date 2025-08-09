'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { FieldWrapper, type FieldWrapperProps } from './field-wrapper'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { countries } from '@/lib/phone-countries'

export interface PhoneFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    Pick<FieldWrapperProps, 'label' | 'helperText' | 'error' | 'success' | 'className'> {
  name: string
  defaultCountry?: string
}

export const PhoneField = React.forwardRef<HTMLInputElement, PhoneFieldProps>(
  ({ name, label, helperText, error, success, className, defaultCountry = 'IN', required, ...props }, ref) => {
    const [country, setCountry] = React.useState(defaultCountry)
    const code = countries.find((c) => c.code === country)?.dial || '+91'
    return (
      <FieldWrapper name={name} label={label} helperText={helperText} error={error} success={success} required={required} className={className}>
        <div className="flex">
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-28 rounded-r-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.dial})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            id={name}
            name={name}
            ref={ref}
            className={cn(
              'block w-full rounded-r-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors',
              'border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-200',
              success && !error && 'border-emerald-500',
              'disabled:bg-gray-100 disabled:text-gray-500'
            )}
            placeholder={`${code} 98765 43210`}
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={!!error}
            aria-required={required}
            {...props}
          />
        </div>
      </FieldWrapper>
    )
  }
)
PhoneField.displayName = 'PhoneField'
