import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/dealer/orders - Get all orders for the dealer
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get user's dealer record
    const { data: dealer, error: dealerError } = await supabase
      .from('dealers')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (dealerError || !dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      )
    }
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
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
          address,
          city,
          state,
          pincode
        ),
        vehicle:vehicles(
          id,
          name,
          model,
          price,
          images
        ),
        payments(
          id,
          amount,
          status,
          method,
          created_at
        )
      `)
      .eq('dealer_id', dealer.id)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    
    const { data: orders, error: ordersError } = await query
    
    if (ordersError) {
      throw ordersError
    }
    
    // Calculate statistics
    const stats = {
      total: orders?.length || 0,
      pending: orders?.filter(o => o.status === 'pending').length || 0,
      processing: orders?.filter(o => o.status === 'processing').length || 0,
      shipped: orders?.filter(o => o.status === 'shipped').length || 0,
      delivered: orders?.filter(o => o.status === 'delivered').length || 0,
      cancelled: orders?.filter(o => o.status === 'cancelled').length || 0,
      totalRevenue: orders?.reduce((sum, order) => {
        if (order.status !== 'cancelled') {
          return sum + (order.final_amount || 0)
        }
        return sum
      }, 0) || 0,
      commission: orders?.reduce((sum, order) => {
        if (order.status === 'delivered') {
          // Assuming 10% commission rate
          return sum + ((order.final_amount || 0) * 0.1)
        }
        return sum
      }, 0) || 0
    }
    
    return NextResponse.json({
      orders: orders || [],
      stats,
      dealerId: dealer.id
    })
    
  } catch (error: any) {
    console.error('Error fetching dealer orders:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// PUT /api/dealer/orders - Update order status
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get dealer record
    const { data: dealer } = await supabase
      .from('dealers')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { orderId, status, trackingNumber, notes } = body
    
    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      )
    }
    
    // Check if order belongs to this dealer
    const { data: order } = await supabase
      .from('orders')
      .select('id, dealer_id, status, user_id, metadata')
      .eq('id', orderId)
      .single()
    
    if (!order || order.dealer_id !== dealer.id) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      )
    }
    
    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }
    
    // Add timestamp for status changes
    if (status === 'processing') {
      updateData.confirmed_at = new Date().toISOString()
    } else if (status === 'shipped') {
      updateData.shipped_at = new Date().toISOString()
      if (trackingNumber) {
        updateData.metadata = {
          ...(order.metadata || {}),
          tracking_number: trackingNumber
        }
      }
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString()
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
      if (notes) {
        updateData.cancellation_reason = notes
      }
    }
    
    if (notes && status !== 'cancelled') {
      updateData.notes = notes
    }
    
    // Update order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()
    
    if (updateError) {
      throw updateError
    }
    
    // Create notification for customer
    if (order.user_id) {
      const statusMessages = {
        processing: 'Your order is being processed',
        shipped: `Your order has been shipped${trackingNumber ? `. Tracking: ${trackingNumber}` : ''}`,
        delivered: 'Your order has been delivered',
        cancelled: `Your order has been cancelled${notes ? `. Reason: ${notes}` : ''}`
      }
      
      await supabase
        .from('notifications')
        .insert({
          user_id: order.user_id,
          title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: statusMessages[status as keyof typeof statusMessages] || `Order status updated to ${status}`,
          type: 'order_update',
          priority: status === 'cancelled' ? 'high' : 'normal',
          data: {
            order_id: orderId,
            status,
            tracking_number: trackingNumber
          }
        })
    }
    
    return NextResponse.json(updatedOrder)
    
  } catch (error: any) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    )
  }
}
