import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateTestRidePayment } from '@/lib/api/test-rides'
import { verifyPaymentSignature } from '@/lib/razorpay/client'

// POST /api/test-rides/verify-payment - Verify payment after Razorpay checkout
export async function POST(request: NextRequest) {
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
    
    // Parse request body
    const body = await request.json()
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      test_ride_id 
    } = body
    
    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !test_ride_id) {
      return NextResponse.json(
        { error: 'Missing required payment verification data' },
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
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }
    
    // Update test ride payment status
    const updatedTestRide = await updateTestRidePayment(
      test_ride_id,
      razorpay_payment_id,
      razorpay_payment_id
    )
    
    // Send confirmation email (in production, you would integrate with an email service)
    console.log('Send confirmation email to user:', user.email)
    
    return NextResponse.json({
      success: true,
      testRide: updatedTestRide,
      message: 'Payment verified successfully. Test ride confirmed!'
    })
    
  } catch (error: any) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
