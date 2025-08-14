import { createClient } from '@/lib/supabase/client'
import type { Vehicle, VehicleInsert, VehicleUpdate, VehicleFilters } from '@/lib/database.types'

/**
 * Get all vehicles with optional filters
 */
export async function getVehicles(filters?: VehicleFilters) {
  const supabase = createClient()
  
  let query = supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)

  // Apply filters
  if (filters) {
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice)
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice)
    }
    if (filters.minRange !== undefined) {
      query = query.gte('range_km', filters.minRange)
    }
    if (filters.maxRange !== undefined) {
      query = query.lte('range_km', filters.maxRange)
    }
    if (filters.badges && filters.badges.length > 0) {
      query = query.contains('badges', filters.badges)
    }
    
    // Apply sorting
    const sortBy = filters.sortBy || 'created_at'
    const sortOrder = filters.sortOrder || 'desc'
    
    switch (sortBy) {
      case 'price':
        query = query.order('price', { ascending: sortOrder === 'asc' })
        break
      case 'range':
        query = query.order('range_km', { ascending: sortOrder === 'asc' })
        break
      case 'rating':
        query = query.order('rating', { ascending: sortOrder === 'asc' })
        break
      case 'name':
        query = query.order('name', { ascending: sortOrder === 'asc' })
        break
      default:
        query = query.order('created_at', { ascending: sortOrder === 'asc' })
    }
    
    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching vehicles:', error)
    throw error
  }

  return data
}

/**
 * Get a single vehicle by slug
 */
export async function getVehicleBySlug(slug: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching vehicle:', error)
    throw error
  }

  return data
}

/**
 * Get a single vehicle by ID
 */
export async function getVehicleById(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching vehicle:', error)
    throw error
  }

  return data
}

/**
 * Create a new vehicle (admin only)
 */
export async function createVehicle(vehicle: VehicleInsert) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicle)
    .select()
    .single()

  if (error) {
    console.error('Error creating vehicle:', error)
    throw error
  }

  return data
}

/**
 * Update a vehicle (admin only)
 */
export async function updateVehicle(id: string, updates: VehicleUpdate) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating vehicle:', error)
    throw error
  }

  return data
}

/**
 * Delete a vehicle (soft delete by setting is_active to false)
 */
export async function deleteVehicle(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error deleting vehicle:', error)
    throw error
  }

  return data
}

/**
 * Get vehicle statistics for admin dashboard
 */
export async function getVehicleStats() {
  const supabase = createClient()
  
  const { data, error, count } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: false })
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching vehicle stats:', error)
    throw error
  }

  const stats = {
    totalVehicles: count || 0,
    averagePrice: 0,
    averageRating: 0,
    totalReviews: 0,
    outOfStock: 0
  }

  if (data && data.length > 0) {
    stats.averagePrice = data.reduce((sum, v) => sum + v.price, 0) / data.length
    stats.averageRating = data.reduce((sum, v) => sum + v.rating, 0) / data.length
    stats.totalReviews = data.reduce((sum, v) => sum + v.reviews_count, 0)
    stats.outOfStock = data.filter(v => v.stock_quantity === 0).length
  }

  return stats
}

/**
 * Search vehicles by name or tagline
 */
export async function searchVehicles(searchTerm: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .or(`name.ilike.%${searchTerm}%,tagline.ilike.%${searchTerm}%`)
    .order('rating', { ascending: false })

  if (error) {
    console.error('Error searching vehicles:', error)
    throw error
  }

  return data
}
