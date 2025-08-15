'use client'

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { toast } from 'sonner'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'test_ride' | 'system'
  read: boolean
  data?: Record<string, any>
  created_at: string
  updated_at: string
}

interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  channel: RealtimeChannel | null
  
  // Actions
  initialize: (userId: string) => Promise<void>
  fetchNotifications: (userId: string) => Promise<void>
  markAsRead: (id: string) => Promise<{ success: boolean; error?: string }>
  markAllAsRead: (userId: string) => Promise<{ success: boolean; error?: string }>
  deleteNotification: (id: string) => Promise<{ success: boolean; error?: string }>
  clearAll: (userId: string) => Promise<{ success: boolean; error?: string }>
  sendNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'updated_at' | 'read'>) => Promise<{ success: boolean; error?: string }>
  cleanup: () => void
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  channel: null,

  initialize: async (userId) => {
    try {
      set({ isLoading: true, error: null })
      const supabase = createClient()
      
      // Fetch initial notifications
      await get().fetchNotifications(userId)
      
      // Set up real-time subscription
      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification
            
            // Add to state
            set(state => ({
              notifications: [newNotification, ...state.notifications],
              unreadCount: state.unreadCount + (newNotification.read ? 0 : 1)
            }))
            
            // Show toast notification
            const toastType = newNotification.type === 'error' ? 'error' : 
                            newNotification.type === 'warning' ? 'error' :
                            newNotification.type === 'success' ? 'success' : 'message'
            
            toast[toastType](newNotification.title, {
              description: newNotification.message,
              duration: 5000,
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const updatedNotification = payload.new as Notification
            
            // Update in state
            set(state => {
              const wasUnread = state.notifications.find(n => n.id === updatedNotification.id)?.read === false
              const isNowRead = updatedNotification.read
              
              return {
                notifications: state.notifications.map(n => 
                  n.id === updatedNotification.id ? updatedNotification : n
                ),
                unreadCount: wasUnread && isNowRead 
                  ? Math.max(0, state.unreadCount - 1)
                  : state.unreadCount
              }
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const deletedId = payload.old.id
            
            // Remove from state
            set(state => {
              const notification = state.notifications.find(n => n.id === deletedId)
              const wasUnread = notification?.read === false
              
              return {
                notifications: state.notifications.filter(n => n.id !== deletedId),
                unreadCount: wasUnread 
                  ? Math.max(0, state.unreadCount - 1)
                  : state.unreadCount
              }
            })
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to notifications')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Failed to subscribe to notifications')
            set({ error: 'Failed to connect to real-time notifications' })
          }
        })
      
      set({ channel, isLoading: false })
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize notifications'
      set({ error: message, isLoading: false })
      console.error('Notifications initialization error:', error)
    }
  },

  fetchNotifications: async (userId) => {
    try {
      set({ isLoading: true, error: null })
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      
      const notifications = data || []
      const unreadCount = notifications.filter(n => !n.read).length
      
      set({ 
        notifications,
        unreadCount,
        isLoading: false 
      })
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch notifications'
      set({ error: message, isLoading: false })
      console.error('Notifications fetch error:', error)
    }
  },

  markAsRead: async (id) => {
    try {
      // Optimistic update
      set(state => {
        const notification = state.notifications.find(n => n.id === id)
        if (!notification || notification.read) return state
        
        return {
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
          error: null
        }
      })
      
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', id)
      
      if (error) throw error
      
      return { success: true }
      
    } catch (error) {
      // Revert optimistic update
      const supabase = createClient()
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single()
      
      if (data) {
        set(state => ({
          notifications: state.notifications.map(n => 
            n.id === id ? data : n
          ),
          unreadCount: data.read ? state.unreadCount : state.unreadCount + 1
        }))
      }
      
      const message = error instanceof Error ? error.message : 'Failed to mark as read'
      return { success: false, error: message }
    }
  },

  markAllAsRead: async (userId) => {
    try {
      const { notifications } = get()
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
      
      if (unreadIds.length === 0) {
        return { success: true }
      }
      
      // Optimistic update
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
        error: null
      }))
      
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .in('id', unreadIds)
      
      if (error) throw error
      
      toast.success('All notifications marked as read')
      return { success: true }
      
    } catch (error) {
      // Revert by refetching
      await get().fetchNotifications(userId)
      
      const message = error instanceof Error ? error.message : 'Failed to mark all as read'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  deleteNotification: async (id) => {
    try {
      // Optimistic removal
      set(state => {
        const notification = state.notifications.find(n => n.id === id)
        const wasUnread = notification?.read === false
        
        return {
          notifications: state.notifications.filter(n => n.id !== id),
          unreadCount: wasUnread 
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
          error: null
        }
      })
      
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      toast.success('Notification deleted')
      return { success: true }
      
    } catch (error) {
      // Revert by refetching
      const { notifications } = get()
      const userId = notifications[0]?.user_id
      if (userId) {
        await get().fetchNotifications(userId)
      }
      
      const message = error instanceof Error ? error.message : 'Failed to delete notification'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  clearAll: async (userId) => {
    try {
      // Optimistic clear
      set({
        notifications: [],
        unreadCount: 0,
        error: null
      })
      
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
      
      if (error) throw error
      
      toast.success('All notifications cleared')
      return { success: true }
      
    } catch (error) {
      // Revert by refetching
      await get().fetchNotifications(userId)
      
      const message = error instanceof Error ? error.message : 'Failed to clear notifications'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  sendNotification: async (notification) => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          read: false
        })
        .select()
        .single()
      
      if (error) throw error
      
      // The real-time subscription will handle adding it to state
      return { success: true }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send notification'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  cleanup: () => {
    const { channel } = get()
    if (channel) {
      const supabase = createClient()
      supabase.removeChannel(channel)
      set({ channel: null })
    }
  }
}))
