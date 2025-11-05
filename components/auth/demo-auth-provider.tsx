'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'

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
  logout: () => Promise<void>
  signup: (opts: { email: string; password: string; name: string; role?: UserRole; phone?: string; city?: string; pincode?: string }) => Promise<{ ok: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>
  updatePassword: (password: string) => Promise<{ ok: boolean; error?: string }>
  refreshSession: () => Promise<void>
}

const AuthContext = React.createContext<AuthCtx | undefined>(undefined)

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = React.useState<DemoUser | null>(null)
  const [session, setSession] = React.useState<Session | null>(null)
  const [loading, setLoading] = React.useState(true)
  
  const supabase = React.useMemo(() => createClient(), [])

  // Fetch and set the current session
  const refreshSession = React.useCallback(async () => {
    try {
      setLoading(true)
      
      // Check Supabase session
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
  }, [])

  // Listen for auth state changes
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
      } else {
        setUser(null)
      }
      
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const login = async ({ email, password, remember }: { email: string; password: string; remember?: boolean }) => {
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

  const logout = async () => {
    try {
      // Logout from Supabase
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      
      setUser(null)
      setSession(null)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const signup = async ({ email, password, name, role = 'customer', phone, city, pincode }: { 
    email: string; 
    password: string; 
    name: string;
    role?: UserRole;
    phone?: string;
    city?: string;
    pincode?: string;
  }) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role, phone, city, pincode }),
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
