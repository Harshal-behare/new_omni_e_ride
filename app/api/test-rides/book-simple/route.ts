import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateIdempotencyKey, checkIdempotency, storeIdempotencyKey } from '@/lib/utils/idempotency'

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
      specialRequests
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
      .select('id, name, slug')
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
    
    // Check daily booking limit per user (prevent abuse)
    const today = new Date().toISOString().split('T')[0]
    const { count: dailyBookingCount } = await supabase
      .from('test_rides')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today)
    
    const DAILY_BOOKING_LIMIT = 3
    if (dailyBookingCount >= DAILY_BOOKING_LIMIT) {
      return NextResponse.json(
        { error: `Daily booking limit (${DAILY_BOOKING_LIMIT}) reached. Please try again tomorrow.` },
        { status: 429 }
      )
    }
    
    // Create test ride booking with all required fields from the schema
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
      notes: specialRequests || null,
      created_at: new Date().toISOString()
    }
    
    // Use database transaction for atomic operation
    const { data: booking, error: bookingError } = await supabase.rpc('create_test_ride_booking', {
      p_user_id: user.id,
      p_vehicle_id: vehicleId,
      p_dealer_id: dealershipId || null,
      p_name: bookingData.name,
      p_email: bookingData.email,
      p_phone: bookingData.phone,
      p_preferred_date: preferredDate,
      p_preferred_time: preferredTime,
      p_city: bookingData.city,
      p_address: bookingData.address,
      p_notes: specialRequests || null
    })
    
    if (bookingError) {
      console.error('Error creating test ride booking:', bookingError)
      
      // Check if it's a duplicate booking error
      if (bookingError.message?.includes('duplicate') || bookingError.code === '23505') {
        return NextResponse.json(
          { error: 'A booking with these details already exists' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create test ride booking. Please try again.' },
        { status: 500 }
      )
    }
    
    if (!booking || booking.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create booking. Please try again.' },
        { status: 500 }
      )
    }
    
    const successResponse = {
      success: true,
      message: 'Test ride booking created successfully',
      booking: {
        id: booking[0].id,
        confirmationCode: booking[0].confirmation_code,
        vehicleName: vehicle.name,
        preferredDate: preferredDate,
        preferredTime: preferredTime,
        dealerId: dealershipId,
        status: 'pending'
      }
    }
    
    // Store the successful response with idempotency key
    await storeIdempotencyKey(supabase, idempotencyKey, successResponse)
    
    // Send notification to user
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Test Ride Confirmed',
          message: `Your test ride for ${vehicle.name} on ${preferredDate} at ${preferredTime} has been booked. Confirmation code: ${booking[0].confirmation_code}`,
          type: 'booking',
          data: {
            booking_id: booking[0].id,
            confirmation_code: booking[0].confirmation_code
          }
        })
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
      // Don't fail the booking if notification fails
    }
    
    return NextResponse.json(successResponse, { status: 201 })
    
  } catch (error) {
    console.error('Error booking test ride:', error)
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
      .from('test_rides')
      .select(`
        *,
        vehicles:vehicle_id (
          id,
          name,
          slug,
          images,
          price
        ),
        dealers:dealer_id (
          id,
          business_name,
          business_address,
          city,
          state,
          business_phone
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
    console.error('Error in GET /api/test-rides/book-simple:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
