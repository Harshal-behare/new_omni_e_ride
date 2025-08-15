'use client'

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { Order, OrderInsert, OrderUpdate, OrderFilters, Address } from '@/lib/database.types'
import { toast } from 'sonner'

interface OrdersState {
  orders: Order[]
  userOrders: Order[]
  totalCount: number
  isLoading: boolean
  error: string | null
  filters: OrderFilters
  
  // Actions
  fetchOrders: (filters?: OrderFilters) => Promise<void>
  fetchUserOrders: (userId: string) => Promise<void>
  fetchOrderById: (id: string) => Promise<Order | null>
  createOrder: (order: Omit<OrderInsert, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; order?: Order; error?: string }>
  addOrder: (order: Omit<OrderInsert, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; order?: Order; error?: string }>
  updateOrder: (id: string, updates: OrderUpdate) => Promise<{ success: boolean; error?: string }>
  cancelOrder: (id: string, reason?: string) => Promise<{ success: boolean; error?: string }>
  updatePaymentStatus: (id: string, status: Order['payment_status'], paymentDetails?: { razorpay_payment_id?: string; razorpay_signature?: string }) => Promise<{ success: boolean; error?: string }>
  updateShippingStatus: (id: string, status: Order['status'], trackingNumber?: string) => Promise<{ success: boolean; error?: string }>
  setFilters: (filters: OrderFilters) => void
  clearFilters: () => void
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  userOrders: [],
  totalCount: 0,
  isLoading: false,
  error: null,
  filters: {},

  fetchOrders: async (filters) => {
    try {
      set({ isLoading: true, error: null })
      const supabase = createClient()
      
      // Build query
      let query = supabase
        .from('orders')
        .select('*, profiles!orders_user_id_fkey(email, name), vehicles(name, slug, images)', { count: 'exact' })
      
      const appliedFilters = filters || get().filters
      
      // Apply filters
      if (appliedFilters.user_id) {
        query = query.eq('user_id', appliedFilters.user_id)
      }
      if (appliedFilters.dealer_id) {
        query = query.eq('dealer_id', appliedFilters.dealer_id)
      }
      if (appliedFilters.status && appliedFilters.status.length > 0) {
        query = query.in('status', appliedFilters.status)
      }
      if (appliedFilters.payment_status && appliedFilters.payment_status.length > 0) {
        query = query.in('payment_status', appliedFilters.payment_status)
      }
      if (appliedFilters.from_date) {
        query = query.gte('created_at', appliedFilters.from_date)
      }
      if (appliedFilters.to_date) {
        query = query.lte('created_at', appliedFilters.to_date)
      }
      
      // Apply sorting
      const sortBy = appliedFilters.sortBy || 'created_at'
      const sortOrder = appliedFilters.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
      
      // Apply pagination
      if (appliedFilters.limit) {
        query = query.limit(appliedFilters.limit)
      }
      if (appliedFilters.offset) {
        query = query.range(
          appliedFilters.offset,
          appliedFilters.offset + (appliedFilters.limit || 10) - 1
        )
      }
      
      const { data, error, count } = await query
      
      if (error) throw error
      
      set({ 
        orders: data || [],
        totalCount: count || 0,
        isLoading: false,
        filters: appliedFilters
      })
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch orders'
      set({ error: message, isLoading: false })
      toast.error(message)
    }
  },

  fetchUserOrders: async (userId) => {
    try {
      set({ isLoading: true, error: null })
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('orders')
        .select('*, vehicles(name, slug, images)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      set({ 
        userOrders: data || [],
        isLoading: false 
      })
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch user orders'
      set({ error: message, isLoading: false })
      toast.error(message)
    }
  },

  fetchOrderById: async (id) => {
    try {
      set({ isLoading: true, error: null })
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles!orders_user_id_fkey(email, name), vehicles(*), dealers(*)')
        .eq('id', id)
        .single()
      
      if (error) throw error
      
      set({ isLoading: false })
      return data
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch order'
      set({ error: message, isLoading: false })
      toast.error(message)
      return null
    }
  },

  createOrder: async (orderData) => {
    try {
      set({ isLoading: true, error: null })
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select('*, vehicles(name, slug, images)')
        .single()
      
      if (error) throw error
      
      // Optimistically add to state
      set(state => ({
        orders: [data, ...state.orders],
        userOrders: [data, ...state.userOrders],
        isLoading: false
      }))
      
      toast.success('Order created successfully!')
      return { success: true, order: data }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create order'
      set({ error: message, isLoading: false })
      toast.error(message)
      return { success: false, error: message }
    }
  },

  // Alias for createOrder to maintain backward compatibility
  addOrder: async (orderData) => {
    return get().createOrder(orderData)
  },

  updateOrder: async (id, updates) => {
    try {
      const currentOrder = get().orders.find(o => o.id === id)
      
      // Optimistic update
      set(state => ({
        orders: state.orders.map(order => 
          order.id === id ? { ...order, ...updates, updated_at: new Date().toISOString() } : order
        ),
        userOrders: state.userOrders.map(order => 
          order.id === id ? { ...order, ...updates, updated_at: new Date().toISOString() } : order
        ),
        error: null
      }))
      
      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
      
      if (error) throw error
      
      toast.success('Order updated successfully')
      return { success: true }
      
    } catch (error) {
      // Revert optimistic update
      await get().fetchOrders()
      
      const message = error instanceof Error ? error.message : 'Failed to update order'
      set({ error: message })
      toast.error(message)
      return { success: false, error: message }
    }
  },

  cancelOrder: async (id, reason) => {
    try {
      // Optimistic update
      set(state => ({
        orders: state.orders.map(order => 
          order.id === id ? { ...order, status: 'cancelled', notes: reason || order.notes } : order
        ),
        userOrders: state.userOrders.map(order => 
          order.id === id ? { ...order, status: 'cancelled', notes: reason || order.notes } : order
        )
      }))
      
      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled', 
          notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
      
      if (error) throw error
      
      toast.success('Order cancelled successfully')
      return { success: true }
      
    } catch (error) {
      // Revert optimistic update
      await get().fetchOrders()
      
      const message = error instanceof Error ? error.message : 'Failed to cancel order'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  updatePaymentStatus: async (id, status, paymentDetails) => {
    try {
      const supabase = createClient()
      
      const updateData: any = {
        payment_status: status,
        updated_at: new Date().toISOString()
      }
      
      if (paymentDetails?.razorpay_payment_id) {
        updateData.razorpay_payment_id = paymentDetails.razorpay_payment_id
      }
      if (paymentDetails?.razorpay_signature) {
        updateData.razorpay_signature = paymentDetails.razorpay_signature
      }
      
      // If payment is successful, update order status to confirmed
      if (status === 'paid') {
        updateData.status = 'confirmed'
      }
      
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
      
      if (error) throw error
      
      // Update local state
      set(state => ({
        orders: state.orders.map(order => 
          order.id === id ? { ...order, ...updateData } : order
        ),
        userOrders: state.userOrders.map(order => 
          order.id === id ? { ...order, ...updateData } : order
        )
      }))
      
      toast.success('Payment status updated')
      return { success: true }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update payment status'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  updateShippingStatus: async (id, status, trackingNumber) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }
      
      if (trackingNumber) {
        updateData.tracking_number = trackingNumber
      }
      
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      }
      
      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
      
      if (error) throw error
      
      // Update local state
      set(state => ({
        orders: state.orders.map(order => 
          order.id === id ? { ...order, ...updateData } : order
        ),
        userOrders: state.userOrders.map(order => 
          order.id === id ? { ...order, ...updateData } : order
        )
      }))
      
      toast.success('Shipping status updated')
      return { success: true }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update shipping status'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  setFilters: (filters) => {
    set({ filters })
    get().fetchOrders(filters)
  },

  clearFilters: () => {
    set({ filters: {} })
    get().fetchOrders({})
  }
}))
