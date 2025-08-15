import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDealerApplication } from '@/lib/api/dealers'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if user already has a pending or approved application
    const { data: existingApplication } = await supabase
      .from('dealer_applications')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['pending', 'under_review', 'approved'])
      .single()
      
    if (existingApplication) {
      return NextResponse.json(
        { error: `You already have a ${existingApplication.status} application` },
        { status: 400 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = [
      'business_name',
      'business_type',
      'business_address',
      'city',
      'state',
      'pincode',
      'business_phone',
      'current_business',
      'experience_years',
      'investment_capacity',
      'why_partner'
    ]
    
    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }
    
    // Validate terms acceptance separately (required but not in schema yet)
    if (!body.terms_accepted) {
      return NextResponse.json(
        { error: 'You must accept the terms and conditions to proceed' },
        { status: 400 }
      )
    }
    
    // Create application with correct schema mapping
    const applicationData = {
      business_name: body.business_name,
      business_type: body.business_type,
      business_address: body.business_address,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      business_phone: body.business_phone,
      business_email: body.business_email || '',
      gst_number: body.gst_number || '',
      pan_number: body.pan_number || '',
      aadhar_number: body.aadhar_number || '',
      current_business: body.current_business,
      experience_years: body.experience_years,
      investment_capacity: body.investment_capacity,
      preferred_areas: body.preferred_areas || [],
      why_partner: body.why_partner,
      documents: body.documents || {}
    }
    
    // Insert directly into Supabase since createDealerApplication uses old schema
    const { data: application, error: insertError } = await supabase
      .from('dealer_applications')
      .insert([{
        ...applicationData,
        user_id: user.id
      }])
      .select()
      .single()
      
    if (insertError) {
      throw new Error(insertError.message)
    }
    
    return NextResponse.json(
      {
        message: 'Application submitted successfully',
        application
      },
      { status: 201 }
    )
    
  } catch (error: any) {
    console.error('Error submitting dealer application:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit application' },
      { status: 500 }
    )
  }
}
