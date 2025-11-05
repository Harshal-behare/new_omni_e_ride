'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useDemoAuth, type UserRole } from './demo-auth-provider'

export function RoleGate({ 
  allow, 
  children,
  fallback = null 
}: { 
  allow: UserRole[]; 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user, loading } = useDemoAuth()
  const router = useRouter()
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }
  
  // Check if user has required role
  React.useEffect(() => {
    if (!loading && (!user || !allow.includes(user.role))) {
      // Redirect unauthenticated users to home page
      router.push('/')
    }
  }, [user, loading, allow, router])
  
  // If no user or wrong role, show nothing (will redirect)
  if (!user || !allow.includes(user.role)) {
    // If custom fallback provided, use it
    if (fallback) {
      return <>{fallback}</>
    }
    
    // Show loading while redirecting
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }
  
  return <>{children}</>
}
