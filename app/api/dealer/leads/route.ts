import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/dealer/leads - Get all leads assigned to the dealer
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
    
    // Get user's dealer record
    const { data: dealer, error: dealerError } = await supabase
      .from('dealers')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (dealerError || !dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      )
    }
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    
    // Build query
    let query = supabase
      .from('leads')
      .select(`
        *,
        vehicle:vehicles!leads_vehicle_interested_fkey(
          id,
          name,
          model,
          price,
          images
        )
      `)
      .eq('dealer_id', dealer.id)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority)
    }
    
    const { data: leads, error: leadsError } = await query
    
    if (leadsError) {
      throw leadsError
    }
    
    // Get lead statistics
    const { data: stats } = await supabase
      .from('leads')
      .select('status')
      .eq('dealer_id', dealer.id)
    
    const leadStats = {
      total: stats?.length || 0,
      new: stats?.filter(l => l.status === 'new').length || 0,
      contacted: stats?.filter(l => l.status === 'contacted').length || 0,
      qualified: stats?.filter(l => l.status === 'qualified').length || 0,
      converted: stats?.filter(l => l.status === 'converted').length || 0,
      closed: stats?.filter(l => l.status === 'closed').length || 0
    }
    
    return NextResponse.json({
      leads: leads || [],
      stats: leadStats,
      dealerId: dealer.id
    })
    
  } catch (error: any) {
    console.error('Error fetching dealer leads:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

// PUT /api/dealer/leads - Update lead status and notes
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
    
    // Get dealer record
    const { data: dealer } = await supabase
      .from('dealers')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { leadId, status, notes, priority, lost_reason } = body
    
    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }
    
    // Check if lead belongs to this dealer
    const { data: lead } = await supabase
      .from('leads')
      .select('id, dealer_id, status')
      .eq('id', leadId)
      .single()
    
    if (!lead || lead.dealer_id !== dealer.id) {
      return NextResponse.json(
        { error: 'Lead not found or access denied' },
        { status: 404 }
      )
    }
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (status) {
      updateData.status = status
      
      // Set timestamp for status changes
      if (status === 'contacted') {
        updateData.contacted_at = new Date().toISOString()
      } else if (status === 'qualified') {
        updateData.qualified_at = new Date().toISOString()
      } else if (status === 'converted') {
        updateData.converted_at = new Date().toISOString()
      } else if (status === 'closed' && lost_reason) {
        updateData.lost_reason = lost_reason
      }
    }
    
    if (notes !== undefined) updateData.notes = notes
    if (priority !== undefined) updateData.priority = priority
    
    // Update lead
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .select(`
        *,
        vehicle:vehicles!leads_vehicle_interested_fkey(
          id,
          name,
          model,
          price
        )
      `)
      .single()
    
    if (updateError) {
      throw updateError
    }
    
    // Create notification for admin about lead status change
    if (status && status !== lead.status) {
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id, // You might want to send this to admin users instead
          title: 'Lead Status Updated',
          message: `Lead ${updatedLead.name} status changed from ${lead.status} to ${status}`,
          type: 'lead_update',
          priority: 'normal',
          data: {
            lead_id: leadId,
            old_status: lead.status,
            new_status: status,
            dealer_id: dealer.id
          }
        })
    }
    
    return NextResponse.json(updatedLead)
    
  } catch (error: any) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update lead' },
      { status: 500 }
    )
  }
}
