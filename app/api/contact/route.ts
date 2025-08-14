import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Save to contact_inquiries table
    const { data: inquiry, error } = await supabase
      .from('contact_inquiries')
      .insert({
        name,
        email,
        phone,
        subject,
        message,
        status: 'new'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to submit contact form' },
        { status: 500 }
      )
    }

    // Log the submission
    console.log('Contact form submission saved:', inquiry)

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Thank you for contacting us. We will get back to you soon!',
      data: inquiry
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
