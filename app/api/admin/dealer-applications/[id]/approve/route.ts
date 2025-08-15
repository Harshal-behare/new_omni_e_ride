import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get the application
    const { data: application, error: fetchError } = await supabase
      .from('dealer_applications')
      .select('user_id, business_name, business_address, business_phone, business_email, gst_number, pan_number, city, state, pincode')
      .eq('id', id)
      .single()

    if (fetchError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Update application status to approved
    const { error: updateError } = await supabase
      .from('dealer_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq('id', id)

    if (updateError) {
      throw updateError
    }

    // Update user role to dealer
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'dealer' })
      .eq('id', application.user_id)

    if (roleError) {
      throw roleError
    }

    // Create dealer record
    const { error: dealerError } = await supabase
      .from('dealers')
      .insert({
        user_id: application.user_id,
        business_name: application.business_name,
        business_address: application.business_address,
        business_phone: application.business_phone,
        business_email: application.business_email,
        gst_number: application.gst_number,
        pan_number: application.pan_number,
        city: application.city,
        state: application.state,
        pincode: application.pincode,
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id
      })

    // Ignore error if dealer record already exists
    if (dealerError && dealerError.code !== '23505') {
      console.error('Error creating dealer record:', dealerError)
    }

    return NextResponse.json({ 
      message: 'Application approved successfully',
      dealer_id: application.user_id
    })

  } catch (error) {
    console.error('Error approving dealer application:', error)
    return NextResponse.json(
      { error: 'Failed to approve application' },
      { status: 500 }
    )
  }
}
