import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET all customer feedback (admin only)
export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: authError.message,
        hint: 'Please log in to access this resource'
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('No user found in session')
      return NextResponse.json({ 
        error: 'Not authenticated', 
        hint: 'Please log in to access this resource'
      }, { status: 401 })
    }

    // Check admin role using regular client first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ 
        error: 'Failed to fetch user profile', 
        details: profileError.message 
      }, { status: 500 })
    }

    if (!profile || profile.role !== 'admin') {
      console.error('Access denied - user role:', profile?.role)
      return NextResponse.json({ 
        error: 'Access denied', 
        hint: 'Admin access required'
      }, { status: 403 })
    }

    // Fetch all feedback using admin client to bypass RLS
    const adminClient = createAdminClient()
    const { data: feedbacks, error } = await adminClient
      .from('customer_feedback')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching feedbacks:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch feedbacks', 
        details: error.message 
      }, { status: 500 })
    }

    console.log('Successfully fetched feedbacks:', feedbacks?.length || 0)
    return NextResponse.json(feedbacks || [])
  } catch (error: any) {
    console.error('Error in GET /api/admin/customer-feedback:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

// POST new customer feedback (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role using regular client first
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Use admin client for database operations
    const adminClient = createAdminClient()

    const body = await request.json()
    const {
      name,
      email,
      location,
      rating,
      feedback_text,
      vehicle_purchased,
      photo_url,
      verified,
      status,
      display_on_homepage,
    } = body

    // Validate required fields
    if (!name || !location || !rating || !feedback_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Insert new feedback using admin client
    const { data: newFeedback, error } = await adminClient
      .from('customer_feedback')
      .insert({
        name,
        email: email || null,
        location,
        rating,
        feedback_text,
        vehicle_purchased: vehicle_purchased || null,
        photo_url: photo_url || null,
        verified: verified || false,
        status: status || 'pending',
        display_on_homepage: display_on_homepage || false,
        approved_by: status === 'approved' ? user.id : null,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating feedback:', error)
      return NextResponse.json({ error: 'Failed to create feedback', details: error.message }, { status: 500 })
    }

    return NextResponse.json(newFeedback, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/admin/customer-feedback:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
