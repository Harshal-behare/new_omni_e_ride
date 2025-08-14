'use client'

import * as React from 'react'
import Link from 'next/link'
import { useDemoAuth, type UserRole } from './demo-auth-provider'
import { OmniButton } from '@/components/ui/omni-button'

export function RoleGate({ 
  allow, 
  children,
  fallback = null 
}: { 
  allow: UserRole[]; 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user, loading, loginAs } = useDemoAuth()
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }
  
  // Check if user has required role
  if (!user || !allow.includes(user.role)) {
    // If custom fallback provided, use it
    if (fallback) {
      return <>{fallback}</>
    }
    
    // Default unauthorized view
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <h1 className="text-2xl font-bold">You need to be signed in</h1>
        <p className="mt-2 text-gray-600">
          {user 
            ? `You need to be a ${allow.join(' or ')} to access this section.`
            : 'This section is restricted. Use a demo login or sign in.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {!user && (
            <>
              <OmniButton onClick={() => loginAs('customer')}>Login as Customer (demo)</OmniButton>
              <OmniButton variant="secondary" onClick={() => loginAs('dealer')}>Login as Dealer (demo)</OmniButton>
              <OmniButton variant="outline" onClick={() => loginAs('admin')}>Login as Admin (demo)</OmniButton>
            </>
          )}
          <Link href="/login"><OmniButton variant="ghost">Go to Login</OmniButton></Link>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}
