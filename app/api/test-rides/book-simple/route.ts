import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    
    const { data: booking, error: bookingError } = await supabase
      .from('test_rides')
      .insert(bookingData)
      .select()
      .single()
    
    if (bookingError) {
      console.error('Error creating test ride booking:', bookingError)
      return NextResponse.json(
        { error: 'Failed to create test ride booking: ' + bookingError.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test ride booking created successfully',
      booking: {
        id: booking.id,
        confirmationCode: booking.confirmation_code,
        vehicleName: vehicle.name,
        preferredDate: preferredDate,
        preferredTime: preferredTime,
        dealerId: dealershipId,
        status: 'pending'
      }
    }, { status: 201 })
    
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
