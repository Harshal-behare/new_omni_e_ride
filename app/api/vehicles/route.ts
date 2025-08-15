import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { VehicleFilters } from '@/lib/database.types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    
    // Build filters from query parameters
    const filters: VehicleFilters = {}
    
    const minPrice = searchParams.get('minPrice')
    if (minPrice) filters.minPrice = parseInt(minPrice)
    
    const maxPrice = searchParams.get('maxPrice')
    if (maxPrice) filters.maxPrice = parseInt(maxPrice)
    
    const minRange = searchParams.get('minRange')
    if (minRange) filters.minRange = parseInt(minRange)
    
    const maxRange = searchParams.get('maxRange')
    if (maxRange) filters.maxRange = parseInt(maxRange)
    
    const badges = searchParams.get('badges')
    if (badges) filters.badges = badges.split(',')
    
    const sortBy = searchParams.get('sortBy')
    if (sortBy) filters.sortBy = sortBy as VehicleFilters['sortBy']
    
    const sortOrder = searchParams.get('sortOrder')
    if (sortOrder) filters.sortOrder = sortOrder as VehicleFilters['sortOrder']
    
    const limit = searchParams.get('limit')
    if (limit) filters.limit = parseInt(limit)
    
    const offset = searchParams.get('offset')
    if (offset) filters.offset = parseInt(offset)
    
    // Build query
    let query = supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'active')

    // Apply filters
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
    const sortByField = filters.sortBy || 'created_at'
    const sortOrderDirection = filters.sortOrder || 'desc'
    
    switch (sortByField) {
      case 'price':
        query = query.order('price', { ascending: sortOrderDirection === 'asc' })
        break
      case 'range':
        query = query.order('range_km', { ascending: sortOrderDirection === 'asc' })
        break
      case 'rating':
        query = query.order('rating', { ascending: sortOrderDirection === 'asc' })
        break
      case 'name':
        query = query.order('name', { ascending: sortOrderDirection === 'asc' })
        break
      default:
        query = query.order('created_at', { ascending: sortOrderDirection === 'asc' })
    }
    
    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching vehicles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch vehicles' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/vehicles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.slug || !body.name || !body.price || !body.range_km || !body.top_speed || !body.charge_hours) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Insert vehicle
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        slug: body.slug,
        name: body.name,
        type: body.type || 'electric_scooter',
        brand: body.brand || '',
        model: body.model || '',
        description: body.description || null,
        price: body.price,
        discounted_price: body.discounted_price || null,
        images: body.images || [],
        colors: body.colors || [],
        features: body.features || {},
        specifications: body.specifications || {},
        range_km: body.range_km,
        top_speed_kmph: body.top_speed_kmph || body.top_speed,
        charging_time_hours: body.charging_time_hours || body.charge_hours,
        battery_capacity: body.battery_capacity || null,
        motor_power: body.motor_power || null,
        status: body.status || 'active',
        stock_quantity: body.stock_quantity || 0
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating vehicle:', error)
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Vehicle with this slug already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to create vehicle' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/vehicles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
