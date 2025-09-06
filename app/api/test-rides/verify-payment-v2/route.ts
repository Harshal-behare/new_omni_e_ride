import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPaymentSignature } from '@/lib/razorpay/client'

export async function POST(request: NextRequest) {
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
    
    // Parse request body
    const body = await request.json()
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      booking_id 
    } = body
    
    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
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
      console.error('Invalid payment signature for order:', razorpay_order_id)
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }
    
    // Get the test ride booking
    const { data: booking, error: bookingError } = await supabase
      .from('test_rides')
      .select('*')
      .eq('id', booking_id)
      .eq('user_id', user.id)
      .single()
    
    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Test ride booking not found' },
        { status: 404 }
      )
    }
    
    // Check if payment was already verified
    if (booking.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        booking: {
          id: booking.id,
          confirmationCode: booking.confirmation_code,
          status: booking.status
        }
      })
    }
    
    // Update test ride booking with payment details
    const { data: updatedBooking, error: updateError } = await supabase
      .from('test_rides')
      .update({
        payment_status: 'paid',
        payment_id: razorpay_payment_id,
        status: 'confirmed',
        confirmed_date: booking.preferred_date,
        confirmed_time: booking.preferred_time,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id)
      .eq('razorpay_order_id', razorpay_order_id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating test ride booking:', updateError)
      return NextResponse.json(
        { error: 'Failed to update booking status' },
        { status: 500 }
      )
    }
    
    // Update payment order status
    await supabase
      .from('payment_orders')
      .update({
        status: 'completed',
        razorpay_payment_id,
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', razorpay_order_id)
    
    // Get vehicle details for notification
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('name')
      .eq('id', booking.vehicle_id)
      .single()
    
    // Send notification
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Test Ride Confirmed!',
        message: `Your test ride for ${vehicle?.name || 'the vehicle'} on ${booking.preferred_date} at ${booking.preferred_time} has been confirmed. Confirmation code: ${updatedBooking.confirmation_code}`,
        type: 'payment',
        priority: 'high',
        data: {
          booking_id: booking_id,
          confirmation_code: updatedBooking.confirmation_code,
          payment_id: razorpay_payment_id
        }
      })
    
    // If a dealer is assigned, notify them too
    if (booking.dealer_id) {
      // Get dealer user_id
      const { data: dealer } = await supabase
        .from('dealers')
        .select('user_id')
        .eq('id', booking.dealer_id)
        .single()
      
      if (dealer?.user_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: dealer.user_id,
            title: 'New Test Ride Booking',
            message: `A new test ride has been booked for ${vehicle?.name || 'a vehicle'} on ${booking.preferred_date} at ${booking.preferred_time}.`,
            type: 'booking',
            priority: 'high',
            data: {
              booking_id: booking_id,
              customer_name: booking.name,
              customer_phone: booking.phone
            }
          })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully. Test ride confirmed!',
      booking: {
        id: updatedBooking.id,
        confirmationCode: updatedBooking.confirmation_code,
        vehicleName: vehicle?.name,
        preferredDate: updatedBooking.preferred_date,
        preferredTime: updatedBooking.preferred_time,
        status: updatedBooking.status,
        paymentStatus: updatedBooking.payment_status
      }
    })
    
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
