'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

export type UserRole = 'customer' | 'dealer' | 'admin'

export type DemoUser = {
  id?: string
  name: string
  email: string
  role: UserRole
}

type AuthCtx = {
  user: DemoUser | null
  session: Session | null
  loading: boolean
  login: (opts: { email: string; password: string; remember?: boolean }) => Promise<{ ok: boolean; error?: string }>
  loginAs: (role: UserRole) => void
  logout: () => Promise<void>
  signup: (opts: { email: string; password: string; name: string; role?: UserRole }) => Promise<{ ok: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>
  updatePassword: (password: string) => Promise<{ ok: boolean; error?: string }>
  refreshSession: () => Promise<void>
}

const AuthContext = React.createContext<AuthCtx | undefined>(undefined)

const DEMO_CREDS: Record<UserRole, { email: string; password: string; name: string }> = {
  customer: { email: 'customer@demo.com', password: 'demo123', name: 'Demo Customer' },
  dealer: { email: 'dealer@demo.com', password: 'demo123', name: 'Demo Dealer' },
  admin: { email: 'admin@demo.com', password: 'demo123', name: 'Demo Admin' },
}

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = React.useState<DemoUser | null>(null)
  const [session, setSession] = React.useState<Session | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isDemoMode, setIsDemoMode] = React.useState(false)
  
  const supabase = React.useMemo(() => createClient(), [])

  // Fetch and set the current session
  const refreshSession = React.useCallback(async () => {
    // Check if in demo mode first
    try {
      const demoUser = localStorage.getItem('omni_demo_user')
      if (demoUser) {
        setUser(JSON.parse(demoUser))
        setIsDemoMode(true)
        setLoading(false)
        return
      }
    } catch {}

    // If not in demo mode, check Supabase session
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)
      
      if (currentSession?.user) {
        // Try to get profile data from the database
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, name')
          .eq('id', currentSession.user.id)
          .single()
        
        const authUser: DemoUser = {
          id: currentSession.user.id,
          email: currentSession.user.email || '',
          name: profile?.name || currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0] || 'User',
          role: profile?.role || currentSession.user.user_metadata?.role || 'customer',
        }
        
        setUser(authUser)
        setIsDemoMode(false)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      setUser(null)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Initialize auth state
  React.useEffect(() => {
    refreshSession()

    // Listen for auth state changes (only for Supabase)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isDemoMode) return // Skip if in demo mode
      
      setSession(session)
      
      if (session?.user) {
        // Try to get profile data from the database
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, name')
          .eq('id', session.user.id)
          .single()
        
        const authUser: DemoUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: profile?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          role: profile?.role || session.user.user_metadata?.role || 'customer',
        }
        
        setUser(authUser)
        setIsDemoMode(false)
      } else {
        setUser(null)
      }
      
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, refreshSession, isDemoMode])

  const login = async ({ email, password, remember }: { email: string; password: string; remember?: boolean }) => {
    // Check if it's a demo login
    const matched = (Object.keys(DEMO_CREDS) as UserRole[]).find(
      (r) => DEMO_CREDS[r].email === email && DEMO_CREDS[r].password === password
    )
    
    if (matched) {
      // Demo login
      const u: DemoUser = { name: DEMO_CREDS[matched].name, email, role: matched }
      setUser(u)
      setIsDemoMode(true)
      try {
        if (remember) localStorage.setItem('omni_demo_user', JSON.stringify(u))
        else localStorage.removeItem('omni_demo_user')
      } catch {}
      router.push(matched === 'admin' ? '/admin' : matched === 'dealer' ? '/dealer' : '/dashboard')
      return { ok: true }
    }

    // Real Supabase login
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        return { ok: false, error: data.error || 'Login failed' }
      }
      
      // Clear demo mode
      setIsDemoMode(false)
      localStorage.removeItem('omni_demo_user')
      
      // Refresh the session to get the latest user data
      await refreshSession()
      
      // Redirect based on role
      if (data.redirectTo) {
        router.push(data.redirectTo)
      }
      
      return { ok: true }
    } catch (error) {
      console.error('Login error:', error)
      return { ok: false, error: 'An unexpected error occurred' }
    }
  }

  const loginAs = (role: UserRole) => {
    const { email, password, name } = DEMO_CREDS[role]
    const u: DemoUser = { name, email, role }
    setUser(u)
    setIsDemoMode(true)
    try {
      localStorage.setItem('omni_demo_user', JSON.stringify(u))
    } catch {}
    router.push(role === 'admin' ? '/admin' : role === 'dealer' ? '/dealer' : '/dashboard')
  }

  const logout = async () => {
    try {
      // Clear demo mode
      localStorage.removeItem('omni_demo_user')
      
      if (!isDemoMode) {
        // Logout from Supabase
        await fetch('/api/auth/logout', {
          method: 'POST',
        })
      }
      
      setUser(null)
      setSession(null)
      setIsDemoMode(false)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const signup = async ({ email, password, name, role = 'customer' }: { 
    email: string; 
    password: string; 
    name: string;
    role?: UserRole;
  }) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        return { ok: false, error: data.error || 'Signup failed' }
      }
      
      return { ok: true }
    } catch (error) {
      console.error('Signup error:', error)
      return { ok: false, error: 'An unexpected error occurred' }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        return { ok: false, error: data.error || 'Failed to send reset email' }
      }
      
      return { ok: true }
    } catch (error) {
      console.error('Reset password error:', error)
      return { ok: false, error: 'An unexpected error occurred' }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        return { ok: false, error: data.error || 'Failed to update password' }
      }
      
      return { ok: true }
    } catch (error) {
      console.error('Update password error:', error)
      return { ok: false, error: 'An unexpected error occurred' }
    }
  }

  const value: AuthCtx = {
    user,
    session,
    loading,
    login,
    loginAs,
    logout,
    signup,
    resetPassword,
    updatePassword,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useDemoAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useDemoAuth must be used within DemoAuthProvider')
  return ctx
}
