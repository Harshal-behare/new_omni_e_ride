import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/inventory - Get inventory with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to inventory
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'dealer'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const dealerId = searchParams.get('dealerId')
    const vehicleId = searchParams.get('vehicleId')
    const status = searchParams.get('status') // available, reserved, sold, maintenance
    const lowStock = searchParams.get('lowStock') === 'true'
    const minQuantity = parseInt(searchParams.get('minQuantity') || '0')

    let query = supabase
      .from('inventory')
      .select(`
        id,
        vehicle_id,
        dealer_id,
        quantity,
        reserved_quantity,
        status,
        last_updated,
        created_at,
        vehicles(
          id,
          make,
          model,
          variant,
          year,
          price,
          specifications
        ),
        dealers(
          id,
          business_name,
          city,
          state
        )
      `)

    // Apply filters
    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    }
    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (lowStock) {
      query = query.lt('quantity', 10) // Define low stock threshold
    }
    if (minQuantity > 0) {
      query = query.gte('quantity', minQuantity)
    }

    // For dealers, only show their inventory
    if (profile?.role === 'dealer') {
      // Get dealer's profile to find their dealer_id
      const { data: dealerProfile } = await supabase
        .from('dealers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (dealerProfile) {
        query = query.eq('dealer_id', dealerProfile.id)
      }
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: inventory, error } = await query
      .range(from, to)
      .order('last_updated', { ascending: false })

    if (error) {
      console.error('Error fetching inventory:', error)
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
    }

    // Calculate summary statistics
    const totalItems = inventory?.length || 0
    const totalQuantity = inventory?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
    const totalReserved = inventory?.reduce((sum, item) => sum + (item.reserved_quantity || 0), 0) || 0
    const lowStockItems = inventory?.filter(item => (item.quantity || 0) < 10).length || 0

    return NextResponse.json({
      inventory,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      summary: {
        totalItems,
        totalQuantity,
        totalReserved,
        lowStockItems,
        availableQuantity: totalQuantity - totalReserved
      }
    })

  } catch (error) {
    console.error('Error in inventory API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/inventory - Create new inventory entry
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to create inventory
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'dealer'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { vehicle_id, dealer_id, quantity, status = 'available' } = body

    // Validate required fields
    if (!vehicle_id || !dealer_id || quantity === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: vehicle_id, dealer_id, quantity' 
      }, { status: 400 })
    }

    // For dealers, ensure they can only create inventory for themselves
    if (profile?.role === 'dealer') {
      const { data: dealerProfile } = await supabase
        .from('dealers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!dealerProfile || dealerProfile.id !== dealer_id) {
        return NextResponse.json({ error: 'Can only manage your own inventory' }, { status: 403 })
      }
    }

    // Check if inventory entry already exists
    const { data: existingInventory } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('vehicle_id', vehicle_id)
      .eq('dealer_id', dealer_id)
      .single()

    let result
    if (existingInventory) {
      // Update existing inventory
      result = await supabase
        .from('inventory')
        .update({
          quantity: existingInventory.quantity + quantity,
          status,
          last_updated: new Date().toISOString()
        })
        .eq('id', existingInventory.id)
        .select()
        .single()
    } else {
      // Create new inventory entry
      result = await supabase
        .from('inventory')
        .insert({
          vehicle_id,
          dealer_id,
          quantity,
          reserved_quantity: 0,
          status,
          last_updated: new Date().toISOString()
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error creating/updating inventory:', result.error)
      return NextResponse.json({ error: 'Failed to create inventory entry' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: existingInventory ? 'Inventory updated successfully' : 'Inventory created successfully',
      inventory: result.data 
    }, { status: existingInventory ? 200 : 201 })

  } catch (error) {
    console.error('Error in create inventory API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
