import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for contact inquiry
const contactInquirySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address').max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number').optional().or(z.literal('')),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000)
})

// POST /api/contact-inquiries - Submit new support inquiry
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = contactInquirySchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const inquiryData = validationResult.data
    
    // Create contact inquiry
    const { data: inquiry, error: insertError } = await supabase
      .from('contact_inquiries')
      .insert({
        name: inquiryData.name,
        email: inquiryData.email,
        phone: inquiryData.phone || null,
        subject: inquiryData.subject,
        message: inquiryData.message,
        status: 'new',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating contact inquiry:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit inquiry' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Your inquiry has been submitted successfully. We will get back to you soon.',
      inquiry: inquiry
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/contact-inquiries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/contact-inquiries - Fetch user's contact inquiries
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user's contact inquiries
    const { data: inquiries, error: fetchError } = await supabase
      .from('contact_inquiries')
      .select('*')
      .eq('email', user.email)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching contact inquiries:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch inquiries' },
        { status: 500 }
      )
    }

    return NextResponse.json(inquiries)
  } catch (error) {
    console.error('Error in GET /api/contact-inquiries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
