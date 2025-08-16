import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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
      
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const dealerId = searchParams.get('dealerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    
    // Build query
    let query = supabase
      .from('leads')
      .select(`
        *,
        vehicle:vehicles(
          id,
          name,
          model,
          price
        ),
        dealer:dealers(
          id,
          business_name,
          city
        ),
        assigned_to:profiles!leads_assigned_to_fkey(
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    
    if (source) {
      query = query.eq('source', source)
    }
    
    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    
    const { data: leads, error } = await query
    
    if (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Get dealers for assignment
    const { data: dealers } = await supabase
      .from('dealers')
      .select('id, business_name, city, state')
      .eq('status', 'approved')
      .order('business_name')
    
    // Get staff members for assignment
    const { data: staff } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('role', ['admin', 'staff'])
      .order('name')
    
    return NextResponse.json({ 
      leads: leads || [],
      dealers: dealers || [],
      staff: staff || []
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
      
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const { leadId, updates } = body
    
    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }
    
    // Update lead
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    // Set timestamps for status changes
    if (updates.status === 'contacted' && !updates.contacted_at) {
      updateData.contacted_at = new Date().toISOString()
    } else if (updates.status === 'qualified' && !updates.qualified_at) {
      updateData.qualified_at = new Date().toISOString()
    } else if (updates.status === 'converted' && !updates.converted_at) {
      updateData.converted_at = new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating lead:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ lead: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
      
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const { leadIds, dealerId, assignedTo } = body
    
    if (!leadIds || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'Lead IDs are required' },
        { status: 400 }
      )
    }
    
    // Bulk assign leads
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (dealerId) {
      updateData.dealer_id = dealerId
    }
    
    if (assignedTo) {
      updateData.assigned_to = assignedTo
    }
    
    const { error } = await supabase
      .from('leads')
      .update(updateData)
      .in('id', leadIds)
    
    if (error) {
      console.error('Error assigning leads:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
