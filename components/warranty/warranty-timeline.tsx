'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { addYears } from '@/lib/warranty-utils'

export function WarrantyTimeline({
  purchaseDate,
  years,
  className,
}: {
  purchaseDate: string
  years: 1 | 2 | 3
  className?: string
}) {
  const start = new Date(purchaseDate)
  const end = addYears(start, years)
  const now = new Date()
  const total = Math.max(1, end.getTime() - start.getTime())
  const pos = Math.min(100, Math.max(0, Math.round(((now.getTime() - start.getTime()) / total) * 100)))

  return (
    <div className={cn('w-full', className)} aria-label="Warranty timeline">
      <div className="relative h-2 rounded-full bg-gray-200">
        <div className="absolute inset-y-0 left-0 rounded-full bg-blue-500" style={{ width: `${Math.max(0, Math.min(100, pos))}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-gray-600">
        <span>{start.toLocaleDateString()}</span>
        <span>Today</span>
        <span>{end.toLocaleDateString()}</span>
      </div>
    </div>
  )
}
