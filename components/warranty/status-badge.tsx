'use client'

import { cn } from '@/lib/utils'

export function WarrantyPeriodBadge({ years }: { years: 1 | 2 | 3 }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1',
      'bg-blue-50 text-blue-700 ring-blue-200'
    )}>
      {years} yr warranty
    </span>
  )
}

export function WarrantyStateBadge({ state }: { state: 'Active' | 'ExpiringSoon' | 'Expired' | 'PendingReview' | 'Approved' | 'Declined' }) {
  const styles: Record<typeof state, string> = {
    Active: 'bg-green-50 text-green-700 ring-green-200',
    ExpiringSoon: 'bg-orange-50 text-orange-700 ring-orange-200 animate-pulse',
    Expired: 'bg-red-50 text-red-700 ring-red-200',
    PendingReview: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
    Approved: 'bg-green-50 text-green-700 ring-green-200',
    Declined: 'bg-red-50 text-red-700 ring-red-200',
  }
  return <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1', styles[state])}>{state}</span>
}
