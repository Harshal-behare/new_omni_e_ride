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
      'company_name',
      'business_registration_number',
      'contact_name',
      'contact_email',
      'contact_phone',
      'address_line1',
      'city',
      'state_province',
      'postal_code',
      'terms_accepted'
    ]
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }
    
    if (!body.terms_accepted) {
      return NextResponse.json(
        { error: 'You must accept the terms and conditions' },
        { status: 400 }
      )
    }
    
    // Create application
    const application = await createDealerApplication({
      company_name: body.company_name,
      business_registration_number: body.business_registration_number,
      tax_id: body.tax_id,
      
      contact_name: body.contact_name,
      contact_email: body.contact_email,
      contact_phone: body.contact_phone,
      
      address_line1: body.address_line1,
      address_line2: body.address_line2,
      city: body.city,
      state_province: body.state_province,
      postal_code: body.postal_code,
      country: body.country || 'USA',
      
      years_in_business: body.years_in_business,
      annual_revenue: body.annual_revenue,
      existing_brands: body.existing_brands,
      showroom_size_sqft: body.showroom_size_sqft,
      number_of_employees: body.number_of_employees,
      website_url: body.website_url,
      
      business_license_url: body.business_license_url,
      tax_certificate_url: body.tax_certificate_url,
      bank_statement_url: body.bank_statement_url,
      additional_documents: body.additional_documents,
      
      terms_accepted: body.terms_accepted,
      notes: body.notes
    })
    
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
