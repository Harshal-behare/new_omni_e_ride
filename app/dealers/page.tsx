'use client'

import DealerLocations from '@/components/sections/dealer-locations'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function DealersPage() {
  const [fullMap, setFullMap] = useState(false)
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className={cn('bg-white flex-1', fullMap && 'h-[calc(100dvh-64px)]')}>

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
      <SiteFooter />
    </div>
  )
}
