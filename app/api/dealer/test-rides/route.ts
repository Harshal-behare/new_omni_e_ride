import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/dealer/test-rides - Get all test rides for the dealer
export async function GET(request: NextRequest) {
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
    
    // Get user's dealer record
    const { data: dealer, error: dealerError } = await supabase
      .from('dealers')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (dealerError || !dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      )
    }
    
    // Get test rides for this dealer
    const { data: testRides, error: testRidesError } = await supabase
      .from('test_rides')
      .select(`
        *,
        user:profiles!test_rides_user_id_fkey(
          id,
          name,
          email,
          phone,
          address,
          city,
          state,
          pincode
        ),
        vehicle:vehicles(
          id,
          name,
          model,
          images,
          price
        )
      `)
      .eq('dealer_id', dealer.id)
      .order('created_at', { ascending: false })
    
    if (testRidesError) {
      throw testRidesError
    }
    
    return NextResponse.json({
      testRides: testRides || [],
      dealerId: dealer.id
    })
    
  } catch (error: any) {
    console.error('Error fetching dealer test rides:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch test rides' },
      { status: 500 }
    )
  }
}

// PUT /api/dealer/test-rides - Update test ride status (approve/reject)
export async function PUT(request: NextRequest) {
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
    
    // Get dealer record
    const { data: dealer } = await supabase
      .from('dealers')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { 
      testRideId, 
      status, 
      rejection_reason,
      confirmed_date,
      confirmed_time,
      dealer_notes
    } = body
    
    // Validate status
    const validStatuses = ['confirmed', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be confirmed or cancelled' },
        { status: 400 }
      )
    }
    
    // Check if test ride belongs to this dealer
    const { data: testRide } = await supabase
      .from('test_rides')
      .select('id, dealer_id, status')
      .eq('id', testRideId)
      .single()
    
    if (!testRide || testRide.dealer_id !== dealer.id) {
      return NextResponse.json(
        { error: 'Test ride not found or access denied' },
        { status: 404 }
      )
    }
    
    // Prepare update data
    const updateData: any = {
      status,
      dealer_notes,
      updated_at: new Date().toISOString()
    }
    
    if (status === 'confirmed') {
      updateData.confirmed_date = confirmed_date || null
      updateData.confirmed_time = confirmed_time || null
    } else if (status === 'cancelled') {
      updateData.cancellation_reason = rejection_reason || 'Rejected by dealer'
      updateData.cancelled_at = new Date().toISOString()
    }
    
    // Update test ride
    const { data: updatedTestRide, error: updateError } = await supabase
      .from('test_rides')
      .update(updateData)
      .eq('id', testRideId)
      .select()
      .single()
    
    if (updateError) {
      throw updateError
    }
    
    // Create notification for customer
    const { data: testRideDetails } = await supabase
      .from('test_rides')
      .select('user_id, vehicle_id')
      .eq('id', testRideId)
      .single()
    
    // Get vehicle details
    let vehicleName = 'vehicle'
    if (testRideDetails?.vehicle_id) {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('name')
        .eq('id', testRideDetails.vehicle_id)
        .single()
      
      if (vehicle) {
        vehicleName = vehicle.name
      }
    }
    
    if (testRideDetails?.user_id) {
      const notificationTitle = status === 'confirmed' 
        ? 'Test Ride Confirmed!' 
        : 'Test Ride Cancelled'
      
      const notificationMessage = status === 'confirmed'
        ? `Your test ride for ${vehicleName} has been confirmed. Date: ${confirmed_date}, Time: ${confirmed_time}`
        : `Your test ride for ${vehicleName} has been cancelled. Reason: ${rejection_reason || 'Not specified'}`
      
      await supabase
        .from('notifications')
        .insert({
          user_id: testRideDetails.user_id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'test_ride_update',
          priority: status === 'cancelled' ? 'high' : 'normal',
          data: {
            test_ride_id: testRideId,
            status,
            rejection_reason: status === 'cancelled' ? rejection_reason : null
          }
        })
    }
    
    return NextResponse.json(updatedTestRide)
    
  } catch (error: any) {
    console.error('Error updating test ride:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update test ride' },
      { status: 500 }
    )
  }
}
