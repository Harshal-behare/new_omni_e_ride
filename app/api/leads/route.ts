import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LeadInsert } from '@/lib/database.types'

// POST /api/leads - Submit inquiry/lead
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Parse request body
    const body = await request.json()
    const { 
      name, 
      email, 
      phone, 
      subject, 
      message, 
      priority = 'normal',
      source = 'inquiry',
      vehicle_id,
      dealer_id
    } = body

    // Validate required fields
    if (!name || !email || !phone || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create lead entry in database
    const leadData: LeadInsert = {
      name,
      email,
      phone,
      subject,
      message,
      priority,
      source,
      status: 'new',
      vehicle_id,
      dealer_id,
      metadata: {
        user_agent: request.headers.get('user-agent') || '',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
        submitted_at: new Date().toISOString(),
      }
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to submit inquiry' },
        { status: 500 }
      )
    }

    // If dealer_id is provided, auto-assign to that dealer
    if (dealer_id && lead) {
      await supabase
        .from('leads')
        .update({ 
          assigned_to: dealer_id,
          status: 'assigned'
        })
        .eq('id', lead.id)
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Lead submission error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// GET /api/leads - Get leads (for dealers/admins)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'dealer' && profile.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden - Only dealers and admins can access leads' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')?.split(',')
    const priority = searchParams.get('priority')?.split(',')
    const source = searchParams.get('source')?.split(',')
    const assigned_to = searchParams.get('assigned_to')
    const dealer_id = searchParams.get('dealer_id')
    const from_date = searchParams.get('from_date')
    const to_date = searchParams.get('to_date')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('leads')
      .select('*, vehicles(name, slug), dealers(name, email)', { count: 'exact' })

    // Apply filters
    if (status && status.length > 0) {
      query = query.in('status', status)
    }
    if (priority && priority.length > 0) {
      query = query.in('priority', priority)
    }
    if (source && source.length > 0) {
      query = query.in('source', source)
    }
    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to)
    }
    if (dealer_id) {
      query = query.eq('dealer_id', dealer_id)
    }
    if (from_date) {
      query = query.gte('created_at', from_date)
    }
    if (to_date) {
      query = query.lte('created_at', to_date)
    }

    // If user is a dealer, only show leads assigned to them
    if (profile.role === 'dealer') {
      query = query.eq('assigned_to', user.id)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: leads, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      leads: leads || [],
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    })
  } catch (error) {
    console.error('Get leads error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
