'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:
          'bg-emerald-600 text-white hover:bg-emerald-700 shadow hover:shadow-md',
        secondary:
          'bg-white text-emerald-700 border border-emerald-600 hover:bg-emerald-50',
        outline:
          'bg-transparent text-emerald-700 border border-emerald-600 hover:bg-emerald-50/60',
        ghost:
          'bg-transparent text-emerald-700 hover:bg-emerald-100',
        destructive:
          'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-5 text-base',
        xl: 'h-12 px-6 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
)

export interface OmniButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  loading?: boolean
}

export const OmniButton = React.forwardRef<HTMLButtonElement, OmniButtonProps>(
  ({ className, variant, size, fullWidth, startIcon, endIcon, loading = false, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || loading
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        <span className="inline-flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            startIcon
          )}
          <span>{children}</span>
          {!loading && endIcon}
        </span>
      </button>
    )
  }
)
OmniButton.displayName = 'OmniButton'
