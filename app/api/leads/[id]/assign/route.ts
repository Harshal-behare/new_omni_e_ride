import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Email notification function for lead assignment
async function sendAssignmentNotification(lead: any, dealer: any) {
  // This is a placeholder for email notification
  console.log('Assignment notification would be sent to dealer:', dealer.email, 'for lead:', lead.id)
  
  // Example structure for email service integration:
  /*
  try {
    await emailService.send({
      to: dealer.email,
      subject: `New Lead Assigned: ${lead.name}`,
      html: `
        <h2>New Lead Assigned to You</h2>
        <p>A new lead has been assigned to you. Please follow up promptly.</p>
        <h3>Lead Details:</h3>
        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Phone:</strong> ${lead.phone}</p>
        <p><strong>Subject:</strong> ${lead.subject}</p>
        <p><strong>Message:</strong> ${lead.message}</p>
        <p><strong>Priority:</strong> ${lead.priority}</p>
        <p><strong>Source:</strong> ${lead.source}</p>
        <p>Please log in to your dealer dashboard to manage this lead.</p>
      `
    })
  } catch (error) {
    console.error('Failed to send assignment notification:', error)
  }
  */
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get user profile to check role (only admins can assign leads)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only admins can assign leads' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { dealer_id, notes } = body

    if (!dealer_id) {
      return NextResponse.json(
        { error: 'dealer_id is required' },
        { status: 400 }
      )
    }

    // Check if dealer exists and is active
    const { data: dealer, error: dealerError } = await supabase
      .from('dealers')
      .select('id, name, email')
      .eq('id', dealer_id)
      .eq('is_active', true)
      .single()

    if (dealerError || !dealer) {
      return NextResponse.json(
        { error: 'Invalid or inactive dealer' },
        { status: 400 }
      )
    }

    // Get the current lead
    const { data: currentLead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!currentLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Update the lead
    const updateData: any = {
      dealer_id,
      assigned_to: dealer_id,
      status: currentLead.status === 'new' ? 'assigned' : currentLead.status,
      updated_at: new Date().toISOString()
    }

    // Append notes if provided
    if (notes) {
      const existingNotes = currentLead.notes || ''
      const timestamp = new Date().toLocaleString()
      updateData.notes = existingNotes 
        ? `${existingNotes}\n\n[${timestamp}] Assignment Note: ${notes}`
        : `[${timestamp}] Assignment Note: ${notes}`
    }

    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', params.id)
      .select('*, dealers(name, email)')
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to assign lead' },
        { status: 500 }
      )
    }

    // Send notification to dealer
    sendAssignmentNotification(updatedLead, dealer).catch(console.error)

    // Log the assignment activity
    const activityLog = {
      lead_id: params.id,
      action: 'assigned',
      performed_by: user.id,
      details: {
        assigned_to: dealer_id,
        dealer_name: dealer.name,
        notes
      },
      created_at: new Date().toISOString()
    }

    // You might want to store this in an activity log table
    console.log('Activity logged:', activityLog)

    return NextResponse.json(updatedLead)
  } catch (error) {
    console.error('Lead assignment error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
