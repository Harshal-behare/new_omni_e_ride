import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/warranties - Get all warranty registrations for admin
export async function GET() {
  try {
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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all warranty registrations
    const { data: warranties, error: warrantiesError } = await supabase
      .from('warranty_registrations')
      .select('*')
      .order('created_at', { ascending: false })

    if (warrantiesError) {
      console.error('Error fetching warranties:', warrantiesError)
      return NextResponse.json({ error: 'Failed to fetch warranties' }, { status: 500 })
    }

    return NextResponse.json({ warranties: warranties || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/warranties:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/warranties/[id]/review - Review warranty registration
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, review_status, notes } = body
    
    if (!id || !review_status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['Approved', 'Declined'].includes(review_status)) {
      return NextResponse.json({ error: 'Invalid review status' }, { status: 400 })
    }

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update warranty review status
    const { data: warranty, error: updateError } = await supabase
      .from('warranty_registrations')
      .update({
        review_status,
        reviewed_at: new Date().toISOString(),
        reviewer_id: user.id,
        reviewer_name: profile.name || user.email,
        notes: notes || null
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating warranty:', updateError)
      return NextResponse.json({ error: 'Failed to update warranty' }, { status: 500 })
    }

    if (!warranty) {
      return NextResponse.json({ error: 'Warranty not found' }, { status: 404 })
    }

    // Create notifications for both dealer and customer
    try {
      // Get dealer user_id
      const { data: dealer } = await supabase
        .from('dealers')
        .select('user_id')
        .eq('id', warranty.dealer_id)
        .single()

      if (dealer?.user_id) {
        // Notify dealer
        await supabase.from('notifications').insert({
          user_id: dealer.user_id,
          title: `Warranty ${review_status}`,
          message: `Warranty registration for ${warranty.customer_name} (${warranty.vehicle_model}) has been ${review_status.toLowerCase()}.${notes ? ` Reason: ${notes}` : ''}`,
          type: 'warranty',
          priority: review_status === 'Declined' ? 'high' : 'normal',
          data: { warranty_id: warranty.id, status: review_status }
        })
      }

      // Check if customer has an account by email
      const { data: customerProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', warranty.customer_email)
        .single()

      if (customerProfile?.id) {
        // Notify customer
        await supabase.from('notifications').insert({
          user_id: customerProfile.id,
          title: `Warranty ${review_status}`,
          message: review_status === 'Approved' 
            ? `Your warranty for ${warranty.vehicle_model} has been approved! Valid for ${warranty.period_years} year(s) from ${new Date(warranty.purchase_date).toLocaleDateString()}.`
            : `Your warranty for ${warranty.vehicle_model} has been declined.${notes ? ` Reason: ${notes}` : ''} Please contact your dealer for assistance.`,
          type: 'warranty',
          priority: 'high',
          data: { warranty_id: warranty.id, status: review_status }
        })
      }
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError)
      // Don't fail the whole operation if notifications fail
    }

    return NextResponse.json({ 
      success: true,
      warranty,
      message: `Warranty ${review_status.toLowerCase()} successfully`
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/warranties:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
