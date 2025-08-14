import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRazorpayInstance, formatAmountForRazorpay, CURRENCY, TEST_RIDE_DEPOSIT } from '@/lib/razorpay/client'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to book a test ride' },
        { status: 401 }
      )
    }
    
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
      specialRequests
    } = body
    
    // Validate required fields
    if (!vehicleId || !preferredDate || !preferredTime || !contactNumber || !address || !city || !state || !pincode) {
      return NextResponse.json(
        { error: 'Missing required booking information' },
        { status: 400 }
      )
    }
    
    // Validate phone number format
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(contactNumber)) {
      return NextResponse.json(
        { error: 'Invalid contact number format' },
        { status: 400 }
      )
    }
    
    // Validate pincode
    const pincodeRegex = /^\d{6}$/
    if (!pincodeRegex.test(pincode)) {
      return NextResponse.json(
        { error: 'Invalid pincode format' },
        { status: 400 }
      )
    }
    
    // Check if vehicle exists and is active
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, name, slug, price')
      .eq('id', vehicleId)
      .eq('is_active', true)
      .single()
    
    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or unavailable' },
        { status: 404 }
      )
    }
    
    // Check for existing pending bookings for the same user and vehicle
    const { data: existingBooking } = await supabase
      .from('test_ride_bookings')
      .select('id')
      .eq('user_id', user.id)
      .eq('vehicle_id', vehicleId)
      .in('status', ['pending', 'confirmed'])
      .single()
    
    if (existingBooking) {
      return NextResponse.json(
        { error: 'You already have a pending or confirmed test ride for this vehicle' },
        { status: 409 }
      )
    }
    
    // Create test ride booking with pending status
    const bookingData = {
      user_id: user.id,
      vehicle_id: vehicleId,
      vehicle_name: vehicle.name,
      preferred_date: preferredDate,
      preferred_time: preferredTime,
      dealership_id: dealershipId || null,
      contact_number: contactNumber,
      alternate_contact_number: alternateContactNumber || null,
      address: address,
      city: city,
      state: state,
      pincode: pincode,
      special_requests: specialRequests || null,
      status: 'pending',
      payment_status: 'pending',
      deposit_amount: TEST_RIDE_DEPOSIT,
      created_at: new Date().toISOString()
    }
    
    const { data: booking, error: bookingError } = await supabase
      .from('test_ride_bookings')
      .insert(bookingData)
      .select()
      .single()
    
    if (bookingError) {
      console.error('Error creating test ride booking:', bookingError)
      return NextResponse.json(
        { error: 'Failed to create test ride booking' },
        { status: 500 }
      )
    }
    
    // Initialize Razorpay and create payment order
    const razorpay = getRazorpayInstance()
    
    const orderOptions = {
      amount: formatAmountForRazorpay(TEST_RIDE_DEPOSIT),
      currency: CURRENCY,
      receipt: `test_ride_${booking.id}`,
      notes: {
        type: 'test_ride',
        testRideId: booking.id,
        userId: user.id,
        userEmail: user.email || '',
        vehicleId: vehicleId,
        vehicleName: vehicle.name,
        bookingDate: preferredDate,
        bookingTime: preferredTime,
        contactNumber: contactNumber
      }
    }
    
    const order = await razorpay.orders.create(orderOptions)
    
    // Update booking with Razorpay order ID
    const { error: updateError } = await supabase
      .from('test_ride_bookings')
      .update({
        razorpay_order_id: order.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id)
    
    if (updateError) {
      console.error('Error updating booking with order ID:', updateError)
      // Continue - booking is created, payment can proceed
    }
    
    // Store payment order
    await supabase
      .from('payment_orders')
      .insert({
        id: order.id,
        user_id: user.id,
        amount: TEST_RIDE_DEPOSIT,
        currency: CURRENCY,
        status: 'created',
        razorpay_order_id: order.id,
        description: `Test ride deposit for ${vehicle.name}`,
        notes: orderOptions.notes,
        created_at: new Date().toISOString()
      })
    
    // Send booking confirmation email (async - don't wait)
    if (user.email) {
      sendBookingConfirmationEmail(user.email, booking, vehicle).catch(console.error)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test ride booking initiated',
      booking: {
        id: booking.id,
        vehicleName: vehicle.name,
        preferredDate: preferredDate,
        preferredTime: preferredTime,
        depositAmount: TEST_RIDE_DEPOSIT,
        status: 'pending'
      },
      payment: {
        orderId: order.id,
        amount: TEST_RIDE_DEPOSIT,
        currency: CURRENCY,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        description: `Test ride deposit for ${vehicle.name}`,
        prefill: {
          email: user.email,
          contact: contactNumber
        }
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error booking test ride:', error)
    
    // Check if it's a Razorpay configuration error
    if (error instanceof Error && error.message.includes('Razorpay credentials')) {
      return NextResponse.json(
        { error: 'Payment service is not configured. Please contact support.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to book test ride' },
      { status: 500 }
    )
  }
}

// Get test ride bookings for a user
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
    const vehicleId = searchParams.get('vehicleId')
    
    // Build query
    let query = supabase
      .from('test_ride_bookings')
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
      query = query.eq('status', status)
    }
    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching test ride bookings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch test ride bookings' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error in GET /api/test-rides/book:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to send booking confirmation email
async function sendBookingConfirmationEmail(
  email: string,
  booking: any,
  vehicle: any
) {
  // This would integrate with your email service
  // For now, just log
  console.log('Sending booking confirmation email to:', email, {
    bookingId: booking.id,
    vehicleName: vehicle.name,
    date: booking.preferred_date,
    time: booking.preferred_time
  })
}
