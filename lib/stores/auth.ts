'use client'

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/lib/database.types'
import { toast } from 'sonner'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  error: string | null
  
  // Actions
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>
  refreshSession: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null })
      const supabase = createClient()
      
      // Get initial session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      
      if (session) {
        // Fetch profile if user is logged in
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError)
        }
        
        set({ 
          user: session.user, 
          session, 
          profile: profile || null,
          isLoading: false 
        })
      } else {
        set({ 
          user: null, 
          session: null, 
          profile: null,
          isLoading: false 
        })
      }
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Fetch profile on sign in
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          set({ 
            user: session.user, 
            session,
            profile: profile || null 
          })
        } else if (event === 'SIGNED_OUT') {
          set({ 
            user: null, 
            session: null, 
            profile: null 
          })
        } else if (event === 'TOKEN_REFRESHED' && session) {
          set({ session })
        } else if (event === 'USER_UPDATED' && session) {
          set({ user: session.user, session })
        }
      })
      
      // Cleanup function would be called in a useEffect cleanup
      // For now, store the subscription for potential cleanup
      ;(window as any).__authSubscription = subscription
      
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to initialize auth',
        isLoading: false 
      })
    }
  },

  signIn: async (email, password) => {
    try {
      set({ isLoading: true, error: null })
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      // Fetch profile
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        set({ 
          user: data.user, 
          session: data.session,
          profile: profile || null,
          isLoading: false 
        })
      }
      
      toast.success('Successfully signed in!')
      return { success: true }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in'
      set({ error: message, isLoading: false })
      toast.error(message)
      return { success: false, error: message }
    }
  },

  signUp: async (email, password, name) => {
    try {
      set({ isLoading: true, error: null })
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      })
      
      if (error) throw error
      
      // Create profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            name,
            role: 'customer'
          })
        
        if (profileError && profileError.code !== '23505') { // Ignore duplicate key error
          console.error('Profile creation error:', profileError)
        }
        
        // Fetch the created profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        set({ 
          user: data.user, 
          session: data.session,
          profile: profile || null,
          isLoading: false 
        })
      }
      
      toast.success('Account created successfully! Please check your email to verify.')
      return { success: true }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign up'
      set({ error: message, isLoading: false })
      toast.error(message)
      return { success: false, error: message }
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null })
      const supabase = createClient()
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      set({ 
        user: null, 
        session: null, 
        profile: null,
        isLoading: false 
      })
      
      toast.success('Successfully signed out')
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign out'
      set({ error: message, isLoading: false })
      toast.error(message)
    }
  },

  updateProfile: async (updates) => {
    try {
      const { user, profile } = get()
      if (!user || !profile) {
        throw new Error('No user logged in')
      }
      
      // Optimistic update
      set({ 
        profile: { ...profile, ...updates },
        error: null 
      })
      
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
      
      if (error) throw error
      
      toast.success('Profile updated successfully')
      return { success: true }
      
    } catch (error) {
      // Revert optimistic update
      const { user } = get()
      if (user) {
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        set({ profile: profile || null })
      }
      
      const message = error instanceof Error ? error.message : 'Failed to update profile'
      set({ error: message })
      toast.error(message)
      return { success: false, error: message }
    }
  },

  refreshSession: async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) throw error
      
      if (data.session) {
        set({ 
          session: data.session,
          user: data.user 
        })
      }
      
    } catch (error) {
      console.error('Session refresh error:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to refresh session' })
    }
  },

  resetPassword: async (email) => {
    try {
      set({ isLoading: true, error: null })
      const supabase = createClient()
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      if (error) throw error
      
      set({ isLoading: false })
      toast.success('Password reset email sent!')
      return { success: true }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email'
      set({ error: message, isLoading: false })
      toast.error(message)
      return { success: false, error: message }
    }
  },

  updatePassword: async (newPassword) => {
    try {
      set({ isLoading: true, error: null })
      const supabase = createClient()
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      set({ isLoading: false })
      toast.success('Password updated successfully!')
      return { success: true }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update password'
      set({ error: message, isLoading: false })
      toast.error(message)
      return { success: false, error: message }
    }
  }
}))
