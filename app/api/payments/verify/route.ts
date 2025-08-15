import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPaymentSignature, getRazorpayInstance } from '@/lib/razorpay/client'

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
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      metadata = {}
    } = body
    
    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields' },
        { status: 400 }
      )
    }
    
    // Verify payment signature
    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )
    
    if (!isValidSignature) {
      // Log suspicious activity
      console.error('Invalid payment signature attempted', {
        userId: user.id,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      })
      
      // Update payment status as failed
      await supabase
        .from('payment_orders')
        .update({
          status: 'failed',
          failure_reason: 'Invalid signature',
          updated_at: new Date().toISOString()
        })
        .eq('razorpay_order_id', razorpay_order_id)
      
      return NextResponse.json(
        { error: 'Payment verification failed - Invalid signature' },
        { status: 400 }
      )
    }
    
    // Get payment details from Razorpay
    const razorpay = getRazorpayInstance()
    const payment = await razorpay.payments.fetch(razorpay_payment_id)
    
    // Update payment order in database
    const { data: orderData, error: updateError } = await supabase
      .from('payment_orders')
      .update({
        status: 'completed',
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        payment_method: payment.method,
        payment_details: {
          bank: payment.bank,
          wallet: payment.wallet,
          vpa: payment.vpa,
          card_id: payment.card_id,
          email: payment.email,
          contact: payment.contact
        },
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating payment order:', updateError)
      // Payment is verified but database update failed
      // Still return success but log the error
    }
    
    // Store payment transaction record
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        amount: Number(payment.amount) / 100, // Convert from paise to rupees
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        captured: payment.captured,
        metadata: metadata,
        created_at: new Date().toISOString()
      })
    
    if (transactionError) {
      console.error('Error storing transaction:', transactionError)
      // Continue - payment is still successful
    }
    
    // Process based on payment type (from metadata)
    if (metadata.type === 'test_ride') {
      // Handle test ride booking
      await processTestRidePayment(supabase, user.id, metadata, payment)
    } else if (metadata.type === 'vehicle_order') {
      // Handle vehicle order
      await processVehicleOrderPayment(supabase, user.id, metadata, payment)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: Number(payment.amount) / 100,
      status: payment.status
    })
    
  } catch (error) {
    console.error('Error verifying payment:', error)
    
    // Check if it's a configuration error
    if (error instanceof Error && error.message.includes('RAZORPAY_KEY_SECRET')) {
      return NextResponse.json(
        { error: 'Payment verification service is not configured properly' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}

// Helper function to process test ride payment
async function processTestRidePayment(
  supabase: any,
  userId: string,
  metadata: any,
  payment: any
) {
  try {
    // Update test ride booking status
    if (metadata.testRideId) {
      await supabase
        .from('test_ride_bookings')
        .update({
          payment_status: 'paid',
          payment_id: payment.id,
          deposit_amount: Number(payment.amount) / 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', metadata.testRideId)
        .eq('user_id', userId)
    }
  } catch (error) {
    console.error('Error processing test ride payment:', error)
  }
}

// Helper function to process vehicle order payment
async function processVehicleOrderPayment(
  supabase: any,
  userId: string,
  metadata: any,
  payment: any
) {
  try {
    // Update vehicle order status
    if (metadata.orderId) {
      await supabase
        .from('vehicle_orders')
        .update({
          payment_status: 'paid',
          payment_id: payment.id,
          paid_amount: Number(payment.amount) / 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', metadata.orderId)
        .eq('user_id', userId)
    }
  } catch (error) {
    console.error('Error processing vehicle order payment:', error)
  }
}
