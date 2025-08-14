import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRazorpayInstance, formatAmountForRazorpay, CURRENCY } from '@/lib/razorpay/client'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to continue' },
        { status: 401 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { 
      amount, 
      description, 
      notes = {},
      receipt,
      partialPayment = false
    } = body
    
    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount provided' },
        { status: 400 }
      )
    }
    
    // Initialize Razorpay
    const razorpay = getRazorpayInstance()
    
    // Create order options
    const orderOptions = {
      amount: formatAmountForRazorpay(amount), // Convert to paise
      currency: CURRENCY,
      receipt: receipt || `order_${Date.now()}`,
      notes: {
        ...notes,
        userId: user.id,
        userEmail: user.email,
        description: description || 'Payment',
        createdAt: new Date().toISOString()
      },
      partial_payment: partialPayment
    }
    
    // Create Razorpay order
    const order = await razorpay.orders.create(orderOptions)
    
    // Store order details in database for tracking
    const { error: dbError } = await supabase
      .from('payment_orders')
      .insert({
        id: order.id,
        user_id: user.id,
        amount: amount,
        currency: CURRENCY,
        status: 'created',
        razorpay_order_id: order.id,
        description: description,
        notes: notes,
        created_at: new Date().toISOString()
      })
    
    if (dbError) {
      console.error('Error storing order in database:', dbError)
      // Continue even if database insert fails - payment can still proceed
    }
    
    // Return order details for frontend
    return NextResponse.json({
      orderId: order.id,
      amount: amount,
      currency: CURRENCY,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      description: description,
      prefill: {
        email: user.email,
        contact: notes.contact || ''
      }
    })
    
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    
    // Check if it's a Razorpay configuration error
    if (error instanceof Error && error.message.includes('Razorpay credentials')) {
      return NextResponse.json(
        { error: 'Payment service is not configured. Please contact support.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    )
  }
}
