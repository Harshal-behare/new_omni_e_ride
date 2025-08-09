'use client'

import { ShieldCheck, AlertTriangle, FileText, BadgeCheck, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type WarrantyInfoProps = {
  className?: string
  compact?: boolean
}

export default function WarrantyInfo({ className, compact }: WarrantyInfoProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-b from-emerald-50 to-white',
        compact ? 'p-4' : 'p-6 md:p-8',
        className
      )}
      aria-label="Warranty information"
    >
      <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-emerald-200/30 blur-2xl" />
      <header className={cn('flex items-start justify-between gap-4', compact ? 'mb-3' : 'mb-6')}>
        <div>
          <h2 className={cn('font-bold text-gray-900', compact ? 'text-lg' : 'text-2xl')}>Warranty & Coverage</h2>
          <p className={cn('text-gray-600', compact ? 'text-xs' : 'text-sm')}>
            Peace of mind with transparent coverage and easy claims.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-white text-xs">
          <ShieldCheck className="h-4 w-4" /> Official Warranty
        </div>
      </header>

      <div className={cn('grid gap-4', compact ? 'md:grid-cols-2' : 'md:grid-cols-3')}>
        <Card icon={<BadgeCheck className="h-5 w-5 text-emerald-600" />} title="Battery">
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            <li>• 2-year or 32,000 km (whichever comes first)</li>
            <li>• 1-time replacement if defective</li>
            <li>• 3rd year service only (parts chargeable)</li>
          </ul>
        </Card>
        <Card icon={<BadgeCheck className="h-5 w-5 text-emerald-600" />} title="Motor & Electronics">
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            <li>• Motor, Controller, Charger: 1-year warranty</li>
            <li>• Standard manufacturing defects covered</li>
          </ul>
        </Card>
        <Card icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} title="Important">
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            <li>• Warranty void if tampered or water damaged</li>
            <li>• Service must be at authorized centers</li>
            <li>• Keep card + invoice for claims</li>
          </ul>
        </Card>
      </div>

      {!compact && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <HowToClaim />
          <WhatNotCovered />
        </div>
      )}
    </section>
  )
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <div className="font-semibold text-gray-900">{title}</div>
      </div>
      {children}
    </div>
  )
}

function HowToClaim() {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-emerald-600" />
        <div className="font-semibold">How to Claim</div>
      </div>
      <ol className="mt-2 list-decimal pl-4 text-sm text-gray-700 space-y-1">
        <li>Visit showroom/service center within 72 hours of issue.</li>
        <li>Carry warranty card and original invoice.</li>
        <li>Inspection window: 7–15 days for replacement decisions.</li>
      </ol>
    </div>
  )
}

function WhatNotCovered() {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center gap-2">
        <XCircle className="h-5 w-5 text-rose-600" />
        <div className="font-semibold">Not Covered</div>
      </div>
      <ul className="mt-2 text-sm text-gray-700 space-y-1">
        <li>• Water ingress, physical damage, or tampering</li>
        <li>• Unauthorized repairs/service outside network</li>
        <li>• Normal wear and consumables</li>
      </ul>
    </div>
  )
}
