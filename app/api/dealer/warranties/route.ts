import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/dealer/warranties - Get warranties for the authenticated dealer
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get dealer info
    const { data: dealerData, error: dealerError } = await supabase
      .from('dealers')
      .select('id, business_name')
      .eq('user_id', user.id)
      .single()

    if (dealerError || !dealerData) {
      return NextResponse.json({ error: 'Dealer not found' }, { status: 404 })
    }

    // Get warranties for this dealer
    const { data: warranties, error: warrantiesError } = await supabase
      .from('warranty_registrations')
      .select('*')
      .eq('dealer_id', dealerData.id)
      .order('created_at', { ascending: false })

    if (warrantiesError) {
      console.error('Error fetching warranties:', warrantiesError)
      return NextResponse.json({ error: 'Failed to fetch warranties' }, { status: 500 })
    }

    return NextResponse.json({ 
      warranties: warranties || [],
      dealerId: dealerData.id,
      dealerName: dealerData.business_name
    })
  } catch (error) {
    console.error('Error in GET /api/dealer/warranties:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/dealer/warranties - Create a new warranty registration
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get dealer info
    const { data: dealerData, error: dealerError } = await supabase
      .from('dealers')
      .select('id, business_name')
      .eq('user_id', user.id)
      .single()

    if (dealerError || !dealerData) {
      return NextResponse.json({ error: 'Dealer not found' }, { status: 404 })
    }

    // Validate required fields
    const {
      customer_email,
      customer_name,
      phone,
      vehicle_model,
      model_id,
      vin,
      purchase_date,
      period_years,
      invoice_image_url,
      notes
    } = body

    if (!customer_email || !customer_name || !vehicle_model || !vin || !purchase_date || !period_years) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['customer_email', 'customer_name', 'vehicle_model', 'vin', 'purchase_date', 'period_years']
      }, { status: 400 })
    }

    // Validate period_years
    if (![1, 2, 3].includes(period_years)) {
      return NextResponse.json({ error: 'Invalid warranty period. Must be 1, 2, or 3 years' }, { status: 400 })
    }

    // Create warranty registration
    const { data: warranty, error: createError } = await supabase
      .from('warranty_registrations')
      .insert({
        customer_email,
        customer_name,
        phone,
        vehicle_model,
        model_id,
        vin,
        purchase_date,
        period_years,
        dealer_id: dealerData.id,
        dealer_name: dealerData.business_name,
        invoice_image_url,
        notes,
        review_status: 'PendingReview'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating warranty:', createError)
      return NextResponse.json({ error: 'Failed to create warranty registration' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      warranty,
      message: 'Warranty registration submitted successfully'
    })
  } catch (error) {
    console.error('Error in POST /api/dealer/warranties:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/dealer/warranties/[id] - Update warranty registration
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Warranty ID is required' }, { status: 400 })
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get dealer info
    const { data: dealerData, error: dealerError } = await supabase
      .from('dealers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (dealerError || !dealerData) {
      return NextResponse.json({ error: 'Dealer not found' }, { status: 404 })
    }

    // Update warranty (RLS will ensure dealer can only update their own)
    const { data: warranty, error: updateError } = await supabase
      .from('warranty_registrations')
      .update(updateData)
      .eq('id', id)
      .eq('dealer_id', dealerData.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating warranty:', updateError)
      return NextResponse.json({ error: 'Failed to update warranty' }, { status: 500 })
    }

    if (!warranty) {
      return NextResponse.json({ error: 'Warranty not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      warranty,
      message: 'Warranty updated successfully'
    })
  } catch (error) {
    console.error('Error in PUT /api/dealer/warranties:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
