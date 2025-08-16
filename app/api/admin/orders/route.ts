import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Build query
    let query = supabase
      .from('orders')
      .select(`
        *,
        user:profiles!orders_user_id_fkey(
          id,
          name,
          email,
          phone,
          city,
          state
        ),
        vehicle:vehicles(
          id,
          name,
          model,
          price,
          images
        ),
        dealer:dealers(
          id,
          business_name,
          city,
          state
        ),
        payments(
          id,
          amount,
          status,
          method,
          created_at
        )
      `, { count: 'exact' })
    
    // Apply filters
    if (city) {
      query = query.eq('user.city', city)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    
    // Order by created_at descending
    query = query.order('created_at', { ascending: false })
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)
    
    const { data: orders, error, count } = await query
    
    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Get unique cities for filter dropdown
    const { data: cities } = await supabase
      .from('profiles')
      .select('city')
      .not('city', 'is', null)
      .order('city')
    
    const uniqueCities = [...new Set(cities?.map(c => c.city) || [])]
    
    return NextResponse.json({
      orders: orders || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      cities: uniqueCities
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const { orderId, status, notes } = body
    
    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      )
    }
    
    // Update order status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }
    
    if (notes) {
      updateData.notes = notes
    }
    
    // Add timestamp for specific status changes
    if (status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString()
    } else if (status === 'shipped') {
      updateData.shipped_at = new Date().toISOString()
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString()
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
      updateData.cancellation_reason = notes || 'Cancelled by admin'
    }
    
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating order:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ order: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
