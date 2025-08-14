import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRazorpayInstance, formatAmountForRazorpay, CURRENCY, ORDER_PAYMENT_CONFIG } from '@/lib/razorpay/client'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to place an order' },
        { status: 401 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const {
      vehicleId,
      quantity = 1,
      color,
      dealershipId,
      paymentType, // 'full' or 'partial'
      partialAmount, // For partial payment
      deliveryAddress,
      billingAddress,
      contactNumber,
      alternateContactNumber,
      specialInstructions,
      promoCode
    } = body
    
    // Validate required fields
    if (!vehicleId || !color || !deliveryAddress || !billingAddress || !contactNumber) {
      return NextResponse.json(
        { error: 'Missing required order information' },
        { status: 400 }
      )
    }
    
    // Validate quantity
    if (quantity < 1 || quantity > 10) {
      return NextResponse.json(
        { error: 'Invalid quantity. Must be between 1 and 10' },
        { status: 400 }
      )
    }
    
    // Validate phone number
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(contactNumber)) {
      return NextResponse.json(
        { error: 'Invalid contact number format' },
        { status: 400 }
      )
    }
    
    // Get vehicle details
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .eq('is_active', true)
      .single()
    
    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or unavailable' },
        { status: 404 }
      )
    }
    
    // Check if color is available
    if (!vehicle.colors.includes(color)) {
      return NextResponse.json(
        { error: 'Selected color is not available for this vehicle' },
        { status: 400 }
      )
    }
    
    // Check stock availability
    if (vehicle.stock_quantity < quantity) {
      return NextResponse.json(
        { error: `Only ${vehicle.stock_quantity} units available in stock` },
        { status: 400 }
      )
    }
    
    // Calculate pricing
    const basePrice = vehicle.price * quantity
    let discount = 0
    let promoCodeData = null
    
    // Apply promo code if provided
    if (promoCode) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single()
      
      if (promo) {
        const now = new Date()
        const validFrom = new Date(promo.valid_from)
        const validUntil = new Date(promo.valid_until)
        
        if (now >= validFrom && now <= validUntil) {
          if (promo.discount_type === 'percentage') {
            discount = (basePrice * promo.discount_value) / 100
            if (promo.max_discount && discount > promo.max_discount) {
              discount = promo.max_discount
            }
          } else {
            discount = promo.discount_value
          }
          promoCodeData = promo
        }
      }
    }
    
    const subtotal = basePrice
    const taxRate = 0.18 // 18% GST
    const taxes = (subtotal - discount) * taxRate
    const totalAmount = subtotal - discount + taxes
    
    // Determine payment amount based on payment type
    let paymentAmount = totalAmount
    if (paymentType === 'partial') {
      if (!partialAmount || partialAmount < ORDER_PAYMENT_CONFIG.minPartialAmount) {
        return NextResponse.json(
          { error: `Minimum partial payment amount is ₹${ORDER_PAYMENT_CONFIG.minPartialAmount}` },
          { status: 400 }
        )
      }
      if (partialAmount > totalAmount) {
        return NextResponse.json(
          { error: 'Partial payment amount cannot exceed total amount' },
          { status: 400 }
        )
      }
      paymentAmount = partialAmount
    }
    
    // Create order in database
    const orderData = {
      user_id: user.id,
      vehicle_id: vehicleId,
      vehicle_name: vehicle.name,
      vehicle_slug: vehicle.slug,
      quantity: quantity,
      color: color,
      dealership_id: dealershipId || null,
      base_price: basePrice,
      discount: discount,
      promo_code: promoCode || null,
      promo_code_data: promoCodeData,
      subtotal: subtotal,
      taxes: taxes,
      total_amount: totalAmount,
      payment_type: paymentType || 'full',
      payment_status: 'pending',
      order_status: 'pending',
      delivery_address: deliveryAddress,
      billing_address: billingAddress,
      contact_number: contactNumber,
      alternate_contact_number: alternateContactNumber || null,
      special_instructions: specialInstructions || null,
      created_at: new Date().toISOString()
    }
    
    const { data: order, error: orderError } = await supabase
      .from('vehicle_orders')
      .insert(orderData)
      .select()
      .single()
    
    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }
    
    // Initialize Razorpay and create payment order
    const razorpay = getRazorpayInstance()
    
    const razorpayOrderOptions = {
      amount: formatAmountForRazorpay(paymentAmount),
      currency: CURRENCY,
      receipt: `vehicle_order_${order.id}`,
      notes: {
        type: 'vehicle_order',
        orderId: order.id,
        userId: user.id,
        userEmail: user.email || '',
        vehicleId: vehicleId,
        vehicleName: vehicle.name,
        quantity: quantity.toString(),
        color: color,
        paymentType: paymentType || 'full',
        contactNumber: contactNumber
      },
      partial_payment: paymentType === 'partial'
    }
    
    const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions)
    
    // Update order with Razorpay order ID
    const { error: updateError } = await supabase
      .from('vehicle_orders')
      .update({
        razorpay_order_id: razorpayOrder.id,
        payment_amount: paymentAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)
    
    if (updateError) {
      console.error('Error updating order with Razorpay order ID:', updateError)
      // Continue - order is created, payment can proceed
    }
    
    // Store payment order
    await supabase
      .from('payment_orders')
      .insert({
        id: razorpayOrder.id,
        user_id: user.id,
        amount: paymentAmount,
        currency: CURRENCY,
        status: 'created',
        razorpay_order_id: razorpayOrder.id,
        description: `Payment for ${vehicle.name} (${quantity} unit${quantity > 1 ? 's' : ''})`,
        notes: razorpayOrderOptions.notes,
        created_at: new Date().toISOString()
      })
    
    // Reserve stock (soft reservation - will be confirmed after payment)
    const { error: stockError } = await supabase
      .from('stock_reservations')
      .insert({
        order_id: order.id,
        vehicle_id: vehicleId,
        quantity: quantity,
        reserved_until: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes reservation
        created_at: new Date().toISOString()
      })
    
    if (stockError) {
      console.error('Error reserving stock:', stockError)
      // Continue - payment is more important
    }
    
    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        vehicleName: vehicle.name,
        quantity: quantity,
        color: color,
        basePrice: basePrice,
        discount: discount,
        taxes: taxes,
        totalAmount: totalAmount,
        paymentAmount: paymentAmount,
        paymentType: paymentType || 'full',
        status: 'pending'
      },
      payment: {
        orderId: razorpayOrder.id,
        amount: paymentAmount,
        currency: CURRENCY,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        description: `Payment for ${vehicle.name}`,
        prefill: {
          email: user.email,
          contact: contactNumber
        }
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error processing checkout:', error)
    
    // Check if it's a Razorpay configuration error
    if (error instanceof Error && error.message.includes('Razorpay credentials')) {
      return NextResponse.json(
        { error: 'Payment service is not configured. Please contact support.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to process checkout' },
      { status: 500 }
    )
  }
}

// Get orders for a user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    
    // Build query
    let query = supabase
      .from('vehicle_orders')
      .select(`
        *,
        vehicles:vehicle_id (
          id,
          name,
          slug,
          images,
          price
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (status) {
      query = query.eq('order_status', status)
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus)
    }
    
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
    console.error('Error in GET /api/orders/checkout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
