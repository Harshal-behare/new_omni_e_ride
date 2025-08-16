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

    // TODO: Send email notification to customer about warranty status

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
