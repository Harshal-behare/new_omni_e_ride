'use client'

import Breadcrumbs from '@/components/breadcrumbs'
import DealerLocations from '@/components/sections/dealer-locations'
import { useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function DealersPage() {
  const [fullMap, setFullMap] = useState(false)
  return (
    <div className={cn('bg-white', fullMap && 'h-[calc(100dvh-64px)]')}>
      <div className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/dealers', label: 'Find Our Dealers' }]} />
          <button
            onClick={() => setFullMap((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            {fullMap ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {fullMap ? 'Exit Fullscreen' : 'Fullscreen Map'}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-4">
        <div className="rounded-xl border bg-emerald-50 p-4 text-sm text-emerald-900">
          <div className="font-semibold">Become an OMNI E-RIDE Dealer</div>
          <p className="mt-1">
            New to our network? Create an account and submit your application. Admin will review and get back to you over email.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/signup" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700">Create Account</Link>
            <Link href="/dashboard/dealer-application" className="rounded-lg border px-3 py-1.5 hover:bg-emerald-50">Dealer Application Form</Link>
            <Link href="/contact" className="rounded-lg border px-3 py-1.5 hover:bg-emerald-50">Contact Us</Link>
          </div>
          <div className="mt-2 text-xs">Dealer Program Reference: DEMO-REF-2001</div>
        </div>
      </div>

      <div className={cn(fullMap && 'h-full overflow-hidden')}>
        <DealerLocations />
      </div>
    </div>
  )
}
