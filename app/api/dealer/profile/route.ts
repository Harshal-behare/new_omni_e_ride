import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/dealer/profile - Get dealer profile with business details
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
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }
    
    // Check if user is a dealer
    if (profile.role !== 'dealer' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Dealer role required.' },
        { status: 403 }
      )
    }
    
    // Get dealer business details
    const { data: dealer, error: dealerError } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (dealerError || !dealer) {
      return NextResponse.json({
        profile,
        dealer: null,
        message: 'Dealer registration pending'
      })
    }
    
    // Combine profile and dealer data
    const dealerProfile = {
      ...profile,
      business_name: dealer.business_name,
      business_address: dealer.business_address,
      business_phone: dealer.business_phone,
      business_email: dealer.business_email,
      gst_number: dealer.gst_number,
      pan_number: dealer.pan_number,
      commission_rate: dealer.commission_rate,
      dealer_status: dealer.status,
      dealer_id: dealer.id,
      approved_at: dealer.approved_at,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    }
    
    return NextResponse.json(dealerProfile)
    
  } catch (error: any) {
    console.error('Error fetching dealer profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dealer profile' },
      { status: 500 }
    )
  }
}

// PUT /api/dealer/profile - Update dealer profile
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
    
    // Parse request body
    const body = await request.json()
    const {
      // Profile fields
      name,
      phone,
      address,
      city,
      state,
      pincode,
      // Dealer fields
      business_name,
      business_address,
      business_phone,
      business_email,
      google_maps_link,
      gst_number,
      pan_number
    } = body
    
    // Check user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'dealer' && profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Dealer role required.' },
        { status: 403 }
      )
    }
    
    // Update profile fields
    const profileUpdateData: any = {}
    if (name !== undefined) profileUpdateData.name = name
    if (phone !== undefined) profileUpdateData.phone = phone
    if (address !== undefined) profileUpdateData.address = address
    if (city !== undefined) profileUpdateData.city = city
    if (state !== undefined) profileUpdateData.state = state
    if (pincode !== undefined) profileUpdateData.pincode = pincode
    profileUpdateData.updated_at = new Date().toISOString()
    
    const { data: updatedProfile, error: profileUpdateError } = await supabase
      .from('profiles')
      .update(profileUpdateData)
      .eq('id', user.id)
      .select()
      .single()
    
    if (profileUpdateError) {
      throw profileUpdateError
    }
    
    // Update dealer fields if they exist
    const dealerUpdateData: any = {}
    if (business_name !== undefined) dealerUpdateData.business_name = business_name
    if (business_address !== undefined) dealerUpdateData.business_address = business_address
    if (business_phone !== undefined) dealerUpdateData.business_phone = business_phone
    if (business_email !== undefined) dealerUpdateData.business_email = business_email
    if (google_maps_link !== undefined) dealerUpdateData.google_maps_link = google_maps_link
    if (gst_number !== undefined) dealerUpdateData.gst_number = gst_number
    if (pan_number !== undefined) dealerUpdateData.pan_number = pan_number
    
    // Also update city, state, pincode in dealer table
    if (city !== undefined) dealerUpdateData.city = city
    if (state !== undefined) dealerUpdateData.state = state
    if (pincode !== undefined) dealerUpdateData.pincode = pincode
    dealerUpdateData.updated_at = new Date().toISOString()
    
    let updatedDealer = null
    if (Object.keys(dealerUpdateData).length > 0) {
      const { data, error: dealerUpdateError } = await supabase
        .from('dealers')
        .update(dealerUpdateData)
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (dealerUpdateError && dealerUpdateError.code !== 'PGRST116') {
        console.error('Dealer update error:', dealerUpdateError)
      } else {
        updatedDealer = data
      }
    }
    
    // Fetch the complete updated profile
    const { data: completeProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    const { data: dealerData } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    const result = {
      profile: completeProfile,
      dealer: dealerData
    }
    
    return NextResponse.json(result)
    
  } catch (error: any) {
    console.error('Error updating dealer profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update dealer profile' },
      { status: 500 }
    )
  }
}
