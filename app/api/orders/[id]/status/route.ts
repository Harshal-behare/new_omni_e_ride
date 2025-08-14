import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Order } from '@/lib/database.types'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
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
    
    // Parse request body
    const body = await request.json()
    
    if (!body.status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }
    
    // Validate status
    const validStatuses: Order['status'][] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }
    
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, dealers(email)')
      .eq('id', orderId)
      .single()
    
    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // Check permissions
    if (profile?.role === 'dealer') {
      // Dealer can only update their own orders
      if (!order.dealer_id || order.dealers?.email !== user.email) {
        return NextResponse.json(
          { error: 'Forbidden: You can only update your own orders' },
          { status: 403 }
        )
      }
      
      // Dealers can only update to certain statuses
      const dealerAllowedStatuses = ['processing', 'shipped', 'delivered']
      if (!dealerAllowedStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Forbidden: Dealers can only update order to processing, shipped, or delivered' },
          { status: 403 }
        )
      }
    } else if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only dealers and admins can update order status' },
        { status: 403 }
      )
    }
    
    // Validate status transition
    if (!isValidStatusTransition(order.status, body.status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${order.status} to ${body.status}` },
        { status: 400 }
      )
    }
    
    // Prepare update data
    const updateData: any = {
      status: body.status,
      updated_at: new Date().toISOString()
    }
    
    // Add tracking number if provided
    if (body.tracking_number && body.status === 'shipped') {
      updateData.tracking_number = body.tracking_number
    }
    
    // Set delivered_at if status is delivered
    if (body.status === 'delivered') {
      updateData.delivered_at = new Date().toISOString()
    }
    
    // Add notes if provided
    if (body.notes) {
      updateData.notes = order.notes 
        ? `${order.notes}\n[${new Date().toISOString()}] ${body.notes}`
        : `[${new Date().toISOString()}] ${body.notes}`
    }
    
    // Update order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select(`
        *,
        vehicles (
          id,
          name,
          slug
        ),
        profiles (
          id,
          name,
          email
        )
      `)
      .single()
    
    if (updateError) {
      console.error('Error updating order status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      )
    }
    
    // If order is cancelled and payment was made, update stock
    if (body.status === 'cancelled' && order.payment_status === 'paid') {
      const { error: stockError } = await supabase
        .from('vehicles')
        .update({
          stock_quantity: supabase.raw('stock_quantity + ?', [order.quantity])
        })
        .eq('id', order.vehicle_id)
      
      if (stockError) {
        console.error('Failed to restore stock:', stockError)
      }
      
      // TODO: Initiate refund process through Razorpay
    }
    
    return NextResponse.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    })
  } catch (error) {
    console.error('Error in PUT /api/orders/[id]/status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function isValidStatusTransition(currentStatus: Order['status'], newStatus: Order['status']): boolean {
  const transitions: Record<Order['status'], Order['status'][]> = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['processing', 'cancelled'],
    'processing': ['shipped', 'cancelled'],
    'shipped': ['delivered', 'cancelled'],
    'delivered': [], // Cannot transition from delivered
    'cancelled': [] // Cannot transition from cancelled
  }
  
  return transitions[currentStatus]?.includes(newStatus) || false
}
