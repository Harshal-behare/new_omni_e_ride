'use client'

import * as React from 'react'
import { Mail } from 'lucide-react'
import { TextField, type TextFieldProps } from './text-field'

export interface EmailFieldProps extends Omit<TextFieldProps, 'type' | 'leadingIcon'> {}

export const EmailField = React.forwardRef<HTMLInputElement, EmailFieldProps>(
  ({ ...props }, ref) => {
    return (
      <TextField
        ref={ref}
        type="email"
        leadingIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
        autoComplete="email"
        inputMode="email"
        {...props}
      />
    )
  }
)
EmailField.displayName = 'EmailField'
