import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
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
    
    // Fetch order details (public endpoint, no auth required)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        payment_status,
        tracking_number,
        quantity,
        total_amount,
        created_at,
        updated_at,
        delivered_at,
        vehicles (
          id,
          name,
          slug,
          images
        )
      `)
      .eq('id', orderId)
      .single()
    
    if (error || !data) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // Create tracking timeline
    const timeline = [
      {
        status: 'pending',
        label: 'Order Placed',
        completed: true,
        date: data.created_at
      },
      {
        status: 'confirmed',
        label: 'Payment Confirmed',
        completed: ['confirmed', 'processing', 'shipped', 'delivered'].includes(data.status),
        date: data.payment_status === 'paid' ? data.updated_at : null
      },
      {
        status: 'processing',
        label: 'Processing',
        completed: ['processing', 'shipped', 'delivered'].includes(data.status),
        date: null
      },
      {
        status: 'shipped',
        label: 'Shipped',
        completed: ['shipped', 'delivered'].includes(data.status),
        date: null
      },
      {
        status: 'delivered',
        label: 'Delivered',
        completed: data.status === 'delivered',
        date: data.delivered_at
      }
    ]
    
    // Handle cancelled orders
    if (data.status === 'cancelled') {
      timeline.push({
        status: 'cancelled',
        label: 'Cancelled',
        completed: true,
        date: data.updated_at
      })
    }
    
    return NextResponse.json({
      order: {
        id: data.id,
        status: data.status,
        payment_status: data.payment_status,
        tracking_number: data.tracking_number,
        quantity: data.quantity,
        total_amount: data.total_amount,
        created_at: data.created_at,
        updated_at: data.updated_at,
        delivered_at: data.delivered_at,
        vehicle: data.vehicles
      },
      timeline,
      estimated_delivery: calculateEstimatedDelivery(data.created_at, data.status)
    })
  } catch (error) {
    console.error('Error in GET /api/orders/track/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateEstimatedDelivery(orderDate: string, status: string): string | null {
  if (status === 'delivered' || status === 'cancelled') {
    return null
  }
  
  // Estimate 5-7 business days from order confirmation
  const orderDateTime = new Date(orderDate)
  const estimatedDays = 7 // Business days
  
  let deliveryDate = new Date(orderDateTime)
  let daysAdded = 0
  
  while (daysAdded < estimatedDays) {
    deliveryDate.setDate(deliveryDate.getDate() + 1)
    
    // Skip weekends
    if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
      daysAdded++
    }
  }
  
  return deliveryDate.toISOString()
}
