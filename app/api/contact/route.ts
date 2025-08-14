import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LeadInsert } from '@/lib/database.types'

// Email notification function (to be implemented with your email service)
async function sendEmailNotification(lead: LeadInsert) {
  // This is a placeholder for email notification
  // You would integrate with services like SendGrid, Resend, or AWS SES
  console.log('Email notification would be sent for lead:', lead)
  
  // Example structure for email service integration:
  /*
  try {
    await emailService.send({
      to: 'sales@omnideride.com',
      subject: `New ${lead.priority === 'urgent' ? 'URGENT ' : ''}Contact Form Submission`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Phone:</strong> ${lead.phone}</p>
        <p><strong>Subject:</strong> ${lead.subject}</p>
        <p><strong>Message:</strong> ${lead.message}</p>
        <p><strong>Priority:</strong> ${lead.priority}</p>
        <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
      `
    })
  } catch (error) {
    console.error('Failed to send email notification:', error)
  }
  */
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Parse request body
    const body = await request.json()
    const { name, email, phone, subject, message, priority = 'normal' } = body

    // Validate required fields
    if (!name || !email || !phone || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
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
      source: 'contact',
      status: 'new',
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
        { error: 'Failed to submit contact form' },
        { status: 500 }
      )
    }

    // Send email notification asynchronously
    sendEmailNotification(leadData).catch(console.error)

    // If priority is urgent, try to auto-assign to available dealer
    if (priority === 'urgent') {
      // Get an active dealer to assign the lead to
      const { data: dealers } = await supabase
        .from('dealers')
        .select('id')
        .eq('is_active', true)
        .limit(1)

      if (dealers && dealers.length > 0) {
        await supabase
          .from('leads')
          .update({ 
            assigned_to: dealers[0].id,
            status: 'assigned',
            notes: 'Auto-assigned due to urgent priority'
          })
          .eq('id', lead.id)
      }
    }

    return NextResponse.json({
      ...lead,
      message: 'Thank you for contacting us. We will get back to you soon!'
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
