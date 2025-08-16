import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// POST /api/admin/leads/assign - Assign a lead to a dealer
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { leadId, dealerId } = body
    
    if (!leadId || !dealerId) {
      return NextResponse.json(
        { error: 'Lead ID and Dealer ID are required' },
        { status: 400 }
      )
    }
    
    // Check if dealer exists
    const { data: dealer } = await supabase
      .from('dealers')
      .select('id, business_name')
      .eq('id', dealerId)
      .single()
    
    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      )
    }
    
    // Create dealer_lead record
    const { data: dealerLead, error: insertError } = await supabase
      .from('dealer_leads')
      .insert({
        lead_id: leadId,
        dealer_id: dealerId,
        status: 'new',
        assigned_at: new Date().toISOString(),
        assigned_by: user.id
      })
      .select()
      .single()
    
    if (insertError) {
      // Check if already assigned
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Lead is already assigned to a dealer' },
          { status: 400 }
        )
      }
      throw insertError
    }
    
    // Update lead status to assigned
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
    
    if (updateError) {
      console.error('Error updating lead status:', updateError)
    }
    
    // Send notification to dealer (you can implement this later)
    // await sendDealerNotification(dealerId, leadId)
    
    return NextResponse.json({
      success: true,
      message: 'Lead assigned successfully',
      dealerLead
    })
    
  } catch (error: any) {
    console.error('Error assigning lead:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to assign lead' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/leads/assign - Unassign a lead from a dealer
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const leadId = searchParams.get('leadId')
    const dealerId = searchParams.get('dealerId')
    
    if (!leadId || !dealerId) {
      return NextResponse.json(
        { error: 'Lead ID and Dealer ID are required' },
        { status: 400 }
      )
    }
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
    
    // Delete dealer_lead record
    const { error: deleteError } = await supabase
      .from('dealer_leads')
      .delete()
      .eq('lead_id', leadId)
      .eq('dealer_id', dealerId)
    
    if (deleteError) throw deleteError
    
    // Update lead status back to new
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: 'new',
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
    
    if (updateError) {
      console.error('Error updating lead status:', updateError)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Lead unassigned successfully'
    })
    
  } catch (error: any) {
    console.error('Error unassigning lead:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to unassign lead' },
      { status: 500 }
    )
  }
}

// GET /api/admin/leads/assign - Get lead assignments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const leadId = searchParams.get('leadId')
    const dealerId = searchParams.get('dealerId')
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
    
    let query = supabase
      .from('dealer_leads')
      .select(`
        *,
        lead:leads(*),
        dealer:dealers(
          id,
          business_name,
          business_email,
          business_phone,
          city,
          state
        ),
        assigned_by_user:profiles!dealer_leads_assigned_by_fkey(
          id,
          name,
          email
        )
      `)
    
    if (leadId) {
      query = query.eq('lead_id', leadId)
    }
    
    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    }
    
    const { data, error } = await query.order('assigned_at', { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json(data || [])
    
  } catch (error: any) {
    console.error('Error fetching lead assignments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lead assignments' },
      { status: 500 }
    )
  }
}
