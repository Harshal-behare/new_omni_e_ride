'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export function ProgressRing({
  size = 36,
  stroke = 4,
  value = 0,
  className,
  trackClassName,
  indicatorClassName,
}: {
  size?: number
  stroke?: number
  value?: number // 0-100
  className?: string
  trackClassName?: string
  indicatorClassName?: string
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dash = Math.max(0, Math.min(100, value)) / 100 * circumference

  return (
    <svg width={size} height={size} className={cn('block', className)} role="img" aria-label={`Progress: ${Math.round(value)}%`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        className={cn('stroke-gray-200 fill-none', trackClassName)}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        className={cn('fill-none stroke-emerald-600 transition-[stroke-dasharray] duration-500', indicatorClassName)}
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}
