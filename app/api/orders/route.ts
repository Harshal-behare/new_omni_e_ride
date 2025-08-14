import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRazorpayInstance, formatAmountForRazorpay, verifyPaymentSignature, CURRENCY } from '@/lib/razorpay/client'
import type { Address } from '@/lib/database.types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check user role for access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    // Build query based on user role
    let query = supabase
      .from('orders')
      .select(`
        *,
        vehicles (
          id,
          name,
          slug,
          images,
          price
        ),
        dealers (
          id,
          name,
          city
        ),
        profiles (
          id,
          name,
          email
        )
      `)
    
    // Filter based on user role
    if (profile?.role === 'customer') {
      query = query.eq('user_id', user.id)
    } else if (profile?.role === 'dealer') {
      // Get dealer ID
      const { data: dealer } = await supabase
        .from('dealers')
        .select('id')
        .eq('email', user.email!)
        .single()
      
      if (dealer) {
        query = query.eq('dealer_id', dealer.id)
      } else {
        return NextResponse.json([])
      }
    }
    // Admin can see all orders (no additional filter)
    
    // Apply filters from query params
    const status = searchParams.get('status')
    if (status) {
      query = query.eq('status', status)
    }
    
    const paymentStatus = searchParams.get('payment_status')
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus)
    }
    
    const fromDate = searchParams.get('from_date')
    if (fromDate) {
      query = query.gte('created_at', fromDate)
    }
    
    const toDate = searchParams.get('to_date')
    if (toDate) {
      query = query.lte('created_at', toDate)
    }
    
    // Apply sorting
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Apply pagination
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    query = query.range(offset, offset + limit - 1)
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.vehicle_id || !body.shipping_address || !body.billing_address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate addresses
    const shippingAddress = body.shipping_address as Address
    const billingAddress = body.billing_address as Address
    
    if (!shippingAddress.full_name || !shippingAddress.phone || !shippingAddress.email ||
        !shippingAddress.address_line1 || !shippingAddress.city || !shippingAddress.state ||
        !shippingAddress.pincode || !shippingAddress.country) {
      return NextResponse.json(
        { error: 'Invalid shipping address' },
        { status: 400 }
      )
    }
    
    // Get vehicle details
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', body.vehicle_id)
      .single()
    
    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }
    
    // Check stock availability
    const quantity = body.quantity || 1
    if (vehicle.stock_quantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock available' },
        { status: 400 }
      )
    }
    
    // Calculate total amount
    const totalAmount = vehicle.price * quantity
    
    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        vehicle_id: body.vehicle_id,
        dealer_id: body.dealer_id || null,
        quantity: quantity,
        unit_price: vehicle.price,
        total_amount: totalAmount,
        status: 'pending',
        payment_status: 'pending',
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        notes: body.notes || null
      })
      .select()
      .single()
    
    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }
    
    // Create Razorpay order
    try {
      const razorpay = getRazorpayInstance()
      const razorpayOrder = await razorpay.orders.create({
        amount: formatAmountForRazorpay(totalAmount),
        currency: CURRENCY,
        receipt: order.id,
        notes: {
          order_id: order.id,
          vehicle_name: vehicle.name,
          user_id: user.id
        },
        payment_capture: true
      })
      
      // Update order with Razorpay order ID
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          razorpay_order_id: razorpayOrder.id
        })
        .eq('id', order.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('Error updating order with Razorpay ID:', updateError)
      }
      
      return NextResponse.json({
        order: updatedOrder || order,
        razorpay_order: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key_id: process.env.RAZORPAY_KEY_ID
        }
      }, { status: 201 })
    } catch (razorpayError) {
      console.error('Error creating Razorpay order:', razorpayError)
      
      // Still return the order even if Razorpay fails
      return NextResponse.json({
        order,
        error: 'Payment initialization failed',
        razorpay_order: null
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Error in POST /api/orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Confirm payment endpoint
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Validate required fields
    if (!body.order_id || !body.razorpay_payment_id || !body.razorpay_order_id || !body.razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification data' },
        { status: 400 }
      )
    }
    
    // Verify payment signature
    const isValid = verifyPaymentSignature(
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature
    )
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }
    
    // Update order with payment details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        payment_method: body.payment_method || 'card',
        razorpay_payment_id: body.razorpay_payment_id,
        razorpay_signature: body.razorpay_signature,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.order_id)
      .eq('razorpay_order_id', body.razorpay_order_id)
      .select()
      .single()
    
    if (orderError) {
      console.error('Error updating order:', orderError)
      return NextResponse.json(
        { error: 'Failed to confirm payment' },
        { status: 500 }
      )
    }
    
    // Update vehicle stock
    // First get current stock
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('stock_quantity')
      .eq('id', order.vehicle_id)
      .single()
    
    if (vehicle) {
      const { error: stockError } = await supabase
        .from('vehicles')
        .update({
          stock_quantity: Math.max(0, vehicle.stock_quantity - order.quantity)
        })
        .eq('id', order.vehicle_id)
      
      if (stockError) {
        console.error('Failed to update stock:', stockError)
      }
    }
    
    return NextResponse.json({
      message: 'Payment confirmed successfully',
      order
    })
  } catch (error) {
    console.error('Error in PUT /api/orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
