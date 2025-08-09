'use client'

import * as React from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TextField, type TextFieldProps } from './text-field'

export interface PasswordFieldProps extends Omit<TextFieldProps, 'type'> {}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)
    return (
      <div className={cn(className)}>
        <TextField
          ref={ref}
          type={visible ? 'text' : 'password'}
          leadingIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
          trailingIcon={
            <button
              type="button"
              aria-label={visible ? 'Hide password' : 'Show password'}
              onClick={() => setVisible((v) => !v)}
              className="text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
              tabIndex={0}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          autoComplete="new-password"
          {...props}
        />
      </div>
    )
  }
)
PasswordField.displayName = 'PasswordField'
