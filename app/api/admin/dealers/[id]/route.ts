import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id: dealerId } = await params
    const body = await request.json()

    // Extract and validate the fields that can be updated
    const {
      business_name,
      business_address,
      business_phone,
      business_email,
      city,
      state,
      pincode,
      gst_number,
      pan_number,
      status,
      commission_rate,
      google_maps_link,
      user_id,
    } = body

    // Update dealer
    const { data: updatedDealer, error: updateError } = await supabase
      .from('dealers')
      .update({
        business_name,
        business_address,
        business_phone,
        business_email,
        city,
        state,
        pincode,
        gst_number,
        pan_number,
        status,
        commission_rate: parseFloat(commission_rate),
        google_maps_link,
        user_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealerId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(updatedDealer)

  } catch (error) {
    console.error('Error updating dealer:', error)
    return NextResponse.json(
      { error: 'Failed to update dealer' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id: dealerId } = await params

    // Fetch dealer with user info
    const { data: dealer, error } = await supabase
      .from('dealers')
      .select(`
        *,
        user:profiles!dealers_user_id_fkey(
          id,
          name,
          email,
          phone
        )
      `)
      .eq('id', dealerId)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(dealer)

  } catch (error) {
    console.error('Error fetching dealer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dealer' },
      { status: 500 }
    )
  }
}
