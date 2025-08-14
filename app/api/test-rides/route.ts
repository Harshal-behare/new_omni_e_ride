import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTestRide, getUserTestRides } from '@/lib/api/test-rides'
import { getRazorpayInstance, formatAmountForRazorpay, CURRENCY, TEST_RIDE_DEPOSIT } from '@/lib/razorpay/client'

// POST /api/test-rides - Create a new test ride booking
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
    const { vehicle_id, dealer_id, scheduled_date, scheduled_time, notes } = body
    
    // Validate required fields
    if (!vehicle_id || !scheduled_date || !scheduled_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Create test ride and Razorpay order
    const testRide = await createTestRide(user.id, {
      vehicle_id,
      dealer_id,
      scheduled_date,
      scheduled_time,
      notes
    })
    
    // Get vehicle details for response
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('name, price, images')
      .eq('id', vehicle_id)
      .single()
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single()
    
    // Prepare payment configuration for frontend
    const paymentConfig = {
      orderId: testRide.razorpay_order_id,
      amount: TEST_RIDE_DEPOSIT,
      currency: CURRENCY,
      description: `Test ride booking for ${vehicle?.name || 'Vehicle'}`,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      prefill: {
        email: profile?.email || user.email,
        name: profile?.name || '',
        contact: ''
      }
    }
    
    return NextResponse.json({
      booking: testRide,
      vehicle,
      payment: paymentConfig
    })
    
  } catch (error: any) {
    console.error('Error creating test ride:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create test ride booking' },
      { status: 500 }
    )
  }
}

// GET /api/test-rides - Get user's test rides
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
    
    // Get user's test rides
    const testRides = await getUserTestRides(user.id)
    
    return NextResponse.json(testRides)
    
  } catch (error: any) {
    console.error('Error fetching test rides:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch test rides' },
      { status: 500 }
    )
  }
}
