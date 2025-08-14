'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

export type UserRole = 'customer' | 'dealer' | 'admin'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: UserRole
}

type AuthCtx = {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  login: (opts: { email: string; password: string; remember?: boolean }) => Promise<{ ok: boolean; error?: string }>
  signup: (opts: { email: string; password: string; name: string; role?: UserRole }) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>
  updatePassword: (password: string) => Promise<{ ok: boolean; error?: string }>
  refreshSession: () => Promise<void>
}

const AuthContext = React.createContext<AuthCtx | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [session, setSession] = React.useState<Session | null>(null)
  const [loading, setLoading] = React.useState(true)
  
  const supabase = React.useMemo(() => createClient(), [])

  // Helper function to transform Supabase user to AuthUser
  const transformUser = (supabaseUser: User | null): AuthUser | null => {
    if (!supabaseUser) return null
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      role: (supabaseUser.user_metadata?.role as UserRole) || 'customer',
    }
  }

  // Fetch and set the current session
  const refreshSession = React.useCallback(async () => {
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
        
        const authUser: AuthUser = {
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

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      
      if (session?.user) {
        // Try to get profile data from the database
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, name')
          .eq('id', session.user.id)
          .single()
        
        const authUser: AuthUser = {
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
  }, [supabase, refreshSession])

  const login = async ({ email, password }: { email: string; password: string }) => {
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

  const logout = async () => {
    try {
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
    signup,
    logout,
    resetPassword,
    updatePassword,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within SupabaseAuthProvider')
  return ctx
}
