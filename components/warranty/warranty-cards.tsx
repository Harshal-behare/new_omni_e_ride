'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressRing } from './progress-ring'
import { WarrantyPeriodBadge, WarrantyStateBadge } from './status-badge'
import { computeDisplayStatus } from '@/lib/stores/warranties'

export function WarrantyOverviewCard({
  record,
}: {
  record: {
    id: string
    modelName: string
    purchaseDate: string
    periodYears: 1 | 2 | 3
    reviewStatus: 'PendingReview' | 'Approved' | 'Declined'
  }
}) {
  const status = computeDisplayStatus(record as any)
  return (
    <Card className="hover:shadow-sm transition">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="truncate">{record.modelName}</span>
          <WarrantyPeriodBadge years={record.periodYears} />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <div className="relative">
          <ProgressRing
            size={56}
            stroke={6}
            value={status.percent}
            indicatorClassName={status.core === 'Active' ? 'stroke-green-600' : status.core === 'ExpiringSoon' ? 'stroke-orange-500' : 'stroke-red-600'}
            trackClassName="stroke-gray-200"
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{status.percent}%</span>
        </div>
        <div className="min-w-0">
          <div className="text-sm text-gray-600">Days remaining</div>
          <div className="text-xl font-bold">{status.daysRemaining}</div>
          <div className="mt-1">
            <WarrantyStateBadge state={status.label} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
