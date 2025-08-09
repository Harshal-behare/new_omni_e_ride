'use client'

import * as React from 'react'
import Link from 'next/link'
import { useDemoAuth, type UserRole } from './demo-auth-provider'
import { OmniButton } from '@/components/ui/omni-button'

export function RoleGate({ allow, children }: { allow: UserRole[]; children: React.ReactNode }) {
  const { user, loginAs } = useDemoAuth()
  if (!user || !allow.includes(user.role)) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <h1 className="text-2xl font-bold">You need to be signed in</h1>
        <p className="mt-2 text-gray-600">This section is restricted. Use a demo login or sign in.</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <OmniButton onClick={() => loginAs('customer')}>Login as Customer (demo)</OmniButton>
          <OmniButton variant="secondary" onClick={() => loginAs('dealer')}>Login as Dealer (demo)</OmniButton>
          <OmniButton variant="outline" onClick={() => loginAs('admin')}>Login as Admin (demo)</OmniButton>
          <Link href="/login"><OmniButton variant="ghost">Go to Login</OmniButton></Link>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
