'use client'

import { useDemoAuth } from '@/components/auth/demo-auth-provider'

// Re-export the auth hook with a more generic name
export const useAuth = useDemoAuth

// Re-export types
export type { UserRole, DemoUser as AuthUser } from '@/components/auth/demo-auth-provider'
