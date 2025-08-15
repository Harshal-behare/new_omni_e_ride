'use client'

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { Vehicle, VehicleFilters } from '@/lib/database.types'
import { toast } from 'sonner'

interface VehiclesState {
  vehicles: Vehicle[]
  featuredVehicles: Vehicle[]
  totalCount: number
  isLoading: boolean
  error: string | null
  filters: VehicleFilters
  
  // Actions
  fetchVehicles: (filters?: VehicleFilters) => Promise<void>
  fetchFeaturedVehicles: () => Promise<void>
  fetchVehicleById: (id: string) => Promise<Vehicle | null>
  fetchVehicleBySlug: (slug: string) => Promise<Vehicle | null>
  setFilters: (filters: VehicleFilters) => void
  clearFilters: () => void
  updateVehicleStock: (vehicleId: string, quantity: number) => Promise<{ success: boolean; error?: string }>
  searchVehicles: (query: string) => Promise<Vehicle[]>
}

export const useVehiclesStore = create<VehiclesState>((set, get) => ({
  vehicles: [],
  featuredVehicles: [],
  totalCount: 0,
  isLoading: false,
  error: null,
  filters: {},

  fetchVehicles: async (filters) => {
    try {
      set({ isLoading: true, error: null })
      const supabase = createClient()
      
      // Build query
      let query = supabase
        .from('vehicles')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
      
      const appliedFilters = filters || get().filters
      
      // Apply filters
      if (appliedFilters.minPrice !== undefined) {
        query = query.gte('price', appliedFilters.minPrice)
      }
      if (appliedFilters.maxPrice !== undefined) {
        query = query.lte('price', appliedFilters.maxPrice)
      }
      if (appliedFilters.minRange !== undefined) {
        query = query.gte('range_km', appliedFilters.minRange)
      }
      if (appliedFilters.maxRange !== undefined) {
        query = query.lte('range_km', appliedFilters.maxRange)
      }
      if (appliedFilters.badges && appliedFilters.badges.length > 0) {
        query = query.contains('badges', appliedFilters.badges)
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
        vehicles: data || [], 
        totalCount: count || 0,
        isLoading: false,
        filters: appliedFilters
      })
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch vehicles'
      set({ error: message, isLoading: false })
      toast.error(message)
    }
  },

  fetchFeaturedVehicles: async () => {
    try {
      set({ isLoading: true, error: null })
      const supabase = createClient()
      
      // Fetch vehicles with best ratings or specific badges
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .contains('badges', ['Featured', 'Best Seller', 'New'])
        .order('rating', { ascending: false })
        .limit(6)
      
      if (error) throw error
      
      set({ 
        featuredVehicles: data || [],
        isLoading: false 
      })
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch featured vehicles'
      set({ error: message, isLoading: false })
      console.error('Featured vehicles fetch error:', error)
    }
  },

  fetchVehicleById: async (id) => {
    try {
      set({ isLoading: true, error: null })
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      
      set({ isLoading: false })
      return data
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch vehicle'
      set({ error: message, isLoading: false })
      toast.error(message)
      return null
    }
  },

  fetchVehicleBySlug: async (slug) => {
    try {
      set({ isLoading: true, error: null })
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('slug', slug)
        .single()
      
      if (error) throw error
      
      set({ isLoading: false })
      return data
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch vehicle'
      set({ error: message, isLoading: false })
      toast.error(message)
      return null
    }
  },

  setFilters: (filters) => {
    set({ filters })
    get().fetchVehicles(filters)
  },

  clearFilters: () => {
    set({ filters: {} })
    get().fetchVehicles({})
  },

  updateVehicleStock: async (vehicleId, quantity) => {
    try {
      const supabase = createClient()
      
      // Get current stock
      const { data: vehicle, error: fetchError } = await supabase
        .from('vehicles')
        .select('stock_quantity')
        .eq('id', vehicleId)
        .single()
      
      if (fetchError) throw fetchError
      if (!vehicle) throw new Error('Vehicle not found')
      
      const newStock = vehicle.stock_quantity - quantity
      if (newStock < 0) {
        throw new Error('Insufficient stock')
      }
      
      // Optimistic update
      set(state => ({
        vehicles: state.vehicles.map(v => 
          v.id === vehicleId 
            ? { ...v, stock_quantity: newStock }
            : v
        ),
        featuredVehicles: state.featuredVehicles.map(v => 
          v.id === vehicleId 
            ? { ...v, stock_quantity: newStock }
            : v
        )
      }))
      
      // Update in database
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ stock_quantity: newStock })
        .eq('id', vehicleId)
      
      if (updateError) throw updateError
      
      return { success: true }
      
    } catch (error) {
      // Revert optimistic update
      await get().fetchVehicles()
      
      const message = error instanceof Error ? error.message : 'Failed to update stock'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  searchVehicles: async (query) => {
    try {
      if (!query.trim()) {
        return []
      }
      
      set({ isLoading: true, error: null })
      const supabase = createClient()
      
      // Search in name, tagline, and badges
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,tagline.ilike.%${query}%`)
        .limit(10)
      
      if (error) throw error
      
      set({ isLoading: false })
      return data || []
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed'
      set({ error: message, isLoading: false })
      console.error('Vehicle search error:', error)
      return []
    }
  }
}))
