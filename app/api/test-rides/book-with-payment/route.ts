import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRazorpayInstance, formatAmountForRazorpay } from '@/lib/razorpay/client'
import { generateIdempotencyKey, checkIdempotency, storeIdempotencyKey } from '@/lib/utils/idempotency'

const TEST_RIDE_DEPOSIT = 2000 // INR
const CURRENCY = 'INR'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Please login to book a test ride' },
        { status: 401 }
      )
    }
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    // Parse request body
    const body = await request.json()
    const {
      vehicleId,
      preferredDate,
      preferredTime,
      dealershipId,
      contactNumber,
      alternateContactNumber,
      address,
      city,
      state,
      pincode,
      specialRequests,
      skipPayment = false // For testing or special cases
    } = body
    
    // Generate idempotency key to prevent duplicate bookings
    const idempotencyKey = generateIdempotencyKey(user.id, {
      vehicleId,
      preferredDate,
      preferredTime,
      dealershipId
    })
    
    // Check for duplicate request
    const { isDuplicate, existingResponse } = await checkIdempotency(supabase, idempotencyKey)
    
    if (isDuplicate && existingResponse) {
      console.log('Duplicate test ride booking prevented for user:', user.id)
      return NextResponse.json(existingResponse, { status: 200 })
    }
    
    // Validate required fields
    if (!vehicleId || !preferredDate || !preferredTime) {
      return NextResponse.json(
        { error: 'Missing required fields: vehicleId, preferredDate, preferredTime' },
        { status: 400 }
      )
    }
    
    // Check if vehicle exists
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, name, slug, price')
      .eq('id', vehicleId)
      .single()
    
    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }
    
    // Check for existing booking on same date/time
    const { data: existingBooking } = await supabase
      .from('test_rides')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('vehicle_id', vehicleId)
      .eq('preferred_date', preferredDate)
      .eq('preferred_time', preferredTime)
      .in('status', ['pending', 'confirmed'])
      .single()
    
    if (existingBooking) {
      return NextResponse.json(
        { error: 'You already have a booking for this vehicle at the selected date and time' },
        { status: 409 }
      )
    }
    
    // Validate booking is not in the past
    const bookingDateTime = new Date(`${preferredDate}T${preferredTime}`)
    if (bookingDateTime < new Date()) {
      return NextResponse.json(
        { error: 'Cannot book test rides for past dates' },
        { status: 400 }
      )
    }
    
    // Check daily booking limit per user
    const today = new Date().toISOString().split('T')[0]
    const { count: dailyBookingCount } = await supabase
      .from('test_rides')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today)
    
    const DAILY_BOOKING_LIMIT = 3
    if (dailyBookingCount !== null && dailyBookingCount >= DAILY_BOOKING_LIMIT) {
      return NextResponse.json(
        { error: `Daily booking limit (${DAILY_BOOKING_LIMIT}) reached. Please try again tomorrow.` },
        { status: 429 }
      )
    }
    
    let razorpayOrderId = null
    let paymentStatus = skipPayment ? 'paid' : 'pending'
    
    // Create Razorpay order if payment is required
    if (!skipPayment) {
      try {
        const razorpay = getRazorpayInstance()
        
        const orderOptions = {
          amount: formatAmountForRazorpay(TEST_RIDE_DEPOSIT),
          currency: CURRENCY,
          receipt: `tr_${Date.now()}`,
          notes: {
            type: 'test_ride',
            userId: user.id,
            userEmail: user.email || '',
            vehicleId: vehicleId,
            vehicleName: vehicle.name,
            bookingDate: preferredDate,
            bookingTime: preferredTime,
            contactNumber: contactNumber || profile?.phone || ''
          }
        }
        
        const order = await razorpay.orders.create(orderOptions)
        razorpayOrderId = order.id
        
        // Store payment order in payment_orders table
        await supabase
          .from('payment_orders')
          .insert({
            razorpay_order_id: order.id,
            user_id: user.id,
            amount: TEST_RIDE_DEPOSIT,
            currency: CURRENCY,
            status: 'created',
            entity_type: 'test_ride',
            entity_id: null, // Will be updated after booking is created
            metadata: {
              vehicleId,
              vehicleName: vehicle.name,
              preferredDate,
              preferredTime,
              dealershipId
            }
          })
      } catch (paymentError) {
        console.error('Error creating Razorpay order:', paymentError)
        return NextResponse.json(
          { error: 'Failed to initialize payment. Please try again.' },
          { status: 500 }
        )
      }
    }
    
    // Create test ride booking
    const bookingData = {
      user_id: user.id,
      vehicle_id: vehicleId,
      dealer_id: dealershipId || null,
      name: profile?.name || user.email?.split('@')[0] || 'Customer',
      email: user.email || '',
      phone: contactNumber || profile?.phone || '9999999999',
      preferred_date: preferredDate,
      preferred_time: preferredTime,
      city: city || profile?.city || 'New Delhi',
      address: address || profile?.address || 'Address not provided',
      status: 'pending',
      payment_status: paymentStatus,
      deposit_amount: TEST_RIDE_DEPOSIT,
      razorpay_order_id: razorpayOrderId,
      notes: specialRequests || null,
      created_at: new Date().toISOString()
    }
    
    const { data: booking, error: bookingError } = await supabase
      .from('test_rides')
      .insert(bookingData)
      .select()
      .single()
    
    if (bookingError) {
      console.error('Error creating test ride booking:', bookingError)
      return NextResponse.json(
        { error: 'Failed to create test ride booking. Please try again.' },
        { status: 500 }
      )
    }
    
    // Update payment order with booking ID
    if (razorpayOrderId) {
      await supabase
        .from('payment_orders')
        .update({
          entity_id: booking.id,
          updated_at: new Date().toISOString()
        })
        .eq('razorpay_order_id', razorpayOrderId)
    }
    
    // Send notification to user
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: skipPayment ? 'Test Ride Confirmed' : 'Complete Your Test Ride Booking',
          message: skipPayment 
            ? `Your test ride for ${vehicle.name} on ${preferredDate} at ${preferredTime} has been booked. Confirmation code: ${booking.confirmation_code}`
            : `Please complete the payment to confirm your test ride for ${vehicle.name} on ${preferredDate} at ${preferredTime}.`,
          type: 'booking',
          data: {
            booking_id: booking.id,
            confirmation_code: booking.confirmation_code,
            payment_required: !skipPayment
          }
        })
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
      // Don't fail the booking if notification fails
    }
    
    const successResponse = {
      success: true,
      message: skipPayment ? 'Test ride booked successfully' : 'Test ride booking initiated. Please complete payment.',
      booking: {
        id: booking.id,
        confirmationCode: booking.confirmation_code,
        vehicleName: vehicle.name,
        preferredDate: preferredDate,
        preferredTime: preferredTime,
        dealerId: dealershipId,
        status: booking.status,
        paymentStatus: booking.payment_status,
        depositAmount: TEST_RIDE_DEPOSIT
      },
      payment: skipPayment ? null : {
        orderId: razorpayOrderId,
        amount: TEST_RIDE_DEPOSIT,
        currency: CURRENCY,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        description: `Test ride deposit for ${vehicle.name}`,
        prefill: {
          name: profile?.name || '',
          email: user.email || '',
          contact: contactNumber || profile?.phone || ''
        },
        notes: {
          bookingId: booking.id,
          vehicleId: vehicleId,
          userId: user.id
        }
      }
    }
    
    // Store the successful response with idempotency key
    await storeIdempotencyKey(supabase, idempotencyKey, successResponse)
    
    return NextResponse.json(successResponse, { status: 201 })
    
  } catch (error) {
    console.error('Error booking test ride:', error)
    return NextResponse.json(
      { error: 'Failed to book test ride' },
      { status: 500 }
    )
  }
}
