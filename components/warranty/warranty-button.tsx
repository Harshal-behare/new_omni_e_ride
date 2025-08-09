'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Shield, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Timer } from 'lucide-react'
import { ProgressRing } from './progress-ring'
import { getWarrantyCoreStatus, getWarrantyDaysRemaining, getWarrantyPercentRemaining, type WarrantyCoreStatus } from '@/lib/warranty-utils'

const btn = cva(
  'inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500',
        warranty: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
        approve: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500',
        pending: 'bg-yellow-600 text-white hover:bg-yellow-700 focus-visible:ring-yellow-500',
        expired: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
        renew: 'bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-500',
        outline: 'bg-transparent border border-gray-300 text-gray-800 hover:bg-gray-50 focus-visible:ring-gray-400',
      },
      size: { sm: 'h-9 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-11 px-5 text-base' },
      glow: { true: 'shadow-[0_0_0_3px_rgba(16,185,129,0.25)]', false: '' },
    },
    defaultVariants: { variant: 'warranty', size: 'md', glow: false },
  }
)

export type WarrantyButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof btn> & {
  tooltip?: string
  showProgress?: boolean
  purchaseDate?: string
  periodYears?: 1 | 2 | 3
  confirm?: { title: string; message: string; confirmText?: string; cancelText?: string }
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export const WarrantyButton = React.forwardRef<HTMLButtonElement, WarrantyButtonProps>(function WarrantyButton(
  {
    className,
    variant,
    size,
    glow,
    tooltip,
    showProgress = false,
    purchaseDate,
    periodYears = 1,
    confirm,
    loading,
    error,
    onClick,
    onRetry,
    children,
    ...props
  },
  ref
) {
  const [open, setOpen] = React.useState(false)
  const disabled = loading || props.disabled

  const hasWarranty = Boolean(purchaseDate)
  const core: WarrantyCoreStatus | null = hasWarranty ? getWarrantyCoreStatus(purchaseDate!, periodYears) : null
  const daysLeft = hasWarranty ? getWarrantyDaysRemaining(purchaseDate!, periodYears) : 0
  const percent = hasWarranty ? getWarrantyPercentRemaining(purchaseDate!, periodYears) : 0

  // Autoset variant by core status if not explicitly provided for clarity.
  const autoVariant: VariantProps<typeof btn>['variant'] =
    variant ||
    (core === 'Active' ? 'approve' : core === 'ExpiringSoon' ? 'pending' : core === 'Expired' ? 'expired' : 'warranty')

  const content = (
    <button
      ref={ref}
      className={cn(btn({ variant: autoVariant, size, glow }), className)}
      aria-busy={!!loading}
      aria-live="polite"
      onClick={(e) => {
        if (confirm) {
          e.preventDefault()
          setOpen(true)
        } else {
          onClick?.(e)
        }
      }}
      {...props}
      disabled={disabled}
    >
      <span className="inline-flex items-center gap-2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : autoVariant === 'approve' ? (
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        ) : autoVariant === 'pending' ? (
          <Timer className="h-4 w-4" aria-hidden="true" />
        ) : autoVariant === 'expired' ? (
          <XCircle className="h-4 w-4" aria-hidden="true" />
        ) : autoVariant === 'renew' ? (
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        ) : autoVariant === 'warranty' ? (
          <Shield className="h-4 w-4" aria-hidden="true" />
        ) : (
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        )}

        <span className="truncate">{children}</span>

        {showProgress && hasWarranty && (
          <span className="ml-1">
            <ProgressRing
              size={18}
              stroke={3}
              value={percent}
              indicatorClassName={cn(
                core === 'Active' && 'stroke-green-500',
                core === 'ExpiringSoon' && 'stroke-orange-500',
                core === 'Expired' && 'stroke-red-500'
              )}
              trackClassName="stroke-white/40"
            />
          </span>
        )}
      </span>
    </button>
  )

  const wrapped = tooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" align="center">
        <div className="text-xs">
          {tooltip}
          {hasWarranty && (
            <div className="mt-1 text-[11px] text-gray-500">Days remaining: {daysLeft}</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  ) : (
    content
  )

  return (
    <>
      {wrapped}
      {confirm && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirm.title}</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-gray-700">{confirm.message}</div>
            {error && (
              <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}{' '}
                {onRetry && (
                  <button className="underline ml-1" onClick={onRetry}>
                    Retry
                  </button>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {confirm.cancelText || 'Cancel'}
              </Button>
              <Button
                onClick={(e) => {
                  setOpen(false)
                  // re-trigger original click
                  onClick?.(e as any)
                }}
              >
                {confirm.confirmText || 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
