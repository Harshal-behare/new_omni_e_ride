import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    
    // Get dealer profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    // Get dealer ID
    let dealerId: string | null = null
    
    if (profile?.role === 'dealer') {
      const { data: dealer } = await supabase
        .from('dealers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!dealer) {
        return NextResponse.json(
          { error: 'Dealer profile not found' },
          { status: 404 }
        )
      }
      dealerId = dealer.id
    } else if (profile?.role === 'admin') {
      // Admin can view any dealer's payouts
      const searchParams = request.nextUrl.searchParams
      dealerId = searchParams.get('dealer_id')
    } else {
      return NextResponse.json(
        { error: 'Unauthorized - Only dealers and admins can access payouts' },
        { status: 403 }
      )
    }
    
    // Build query
    let query = supabase
      .from('dealer_payouts')
      .select(`
        *,
        dealer:dealers(
          id,
          business_name,
          business_email,
          business_phone
        )
      `)
      .order('created_at', { ascending: false })
    
    // Filter by dealer if specified
    if (dealerId) {
      query = query.eq('dealer_id', dealerId)
    }
    
    // Apply additional filters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')
    
    if (status) {
      query = query.eq('status', status)
    }
    if (fromDate) {
      query = query.gte('created_at', fromDate)
    }
    if (toDate) {
      query = query.lte('created_at', toDate)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching payouts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payouts' },
        { status: 500 }
      )
    }
    
    // Get summary statistics
    const summaryQuery = dealerId 
      ? supabase.from('dealer_payment_summary').select('*').eq('dealer_id', dealerId).single()
      : supabase.from('dealer_payment_summary').select('*')
    
    const { data: summary } = await summaryQuery
    
    return NextResponse.json({
      payouts: data,
      summary: summary
    })
    
  } catch (error) {
    console.error('Error in GET /api/dealer/payouts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new payout (admin only)
export async function POST(request: NextRequest) {
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
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can create payouts' },
        { status: 403 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { 
      dealer_id,
      from_date,
      to_date,
      notes
    } = body
    
    // Validate required fields
    if (!dealer_id || !from_date || !to_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Get unpaid orders for the dealer in the date range
    const { data: unpaidOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('dealer_id', dealer_id)
      .eq('payment_status', 'completed')
      .eq('commission_paid', false)
      .gte('created_at', from_date)
      .lte('created_at', to_date)
    
    if (ordersError || !unpaidOrders || unpaidOrders.length === 0) {
      return NextResponse.json(
        { error: 'No unpaid commissions found for the selected period' },
        { status: 404 }
      )
    }
    
    // Calculate total commission
    const totalCommission = unpaidOrders.reduce(
      (sum, order) => sum + (order.dealer_commission_amount || 0), 
      0
    )
    
    if (totalCommission === 0) {
      return NextResponse.json(
        { error: 'No commission amount to payout' },
        { status: 400 }
      )
    }
    
    // Get dealer details
    const { data: dealer } = await supabase
      .from('dealers')
      .select('*')
      .eq('id', dealer_id)
      .single()
    
    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      )
    }
    
    // Create payout record
    const { data: payout, error: payoutError } = await supabase
      .from('dealer_payouts')
      .insert({
        dealer_id: dealer_id,
        amount: totalCommission,
        commission_rate: dealer.commission_rate || 10.0,
        orders_included: {
          order_ids: unpaidOrders.map(o => o.id),
          count: unpaidOrders.length,
          from_date: from_date,
          to_date: to_date
        },
        status: 'pending',
        notes: notes,
        payout_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single()
    
    if (payoutError) {
      console.error('Error creating payout:', payoutError)
      return NextResponse.json(
        { error: 'Failed to create payout' },
        { status: 500 }
      )
    }
    
    // Mark orders as commission paid
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        commission_paid: true,
        commission_paid_at: new Date().toISOString(),
        payout_id: payout.id,
        updated_at: new Date().toISOString()
      })
      .in('id', unpaidOrders.map(o => o.id))
    
    if (updateError) {
      console.error('Error updating orders:', updateError)
      // Should ideally rollback the payout creation
    }
    
    // Send notification to dealer
    await supabase
      .from('notifications')
      .insert({
        user_id: dealer.user_id,
        title: 'New Payout Created',
        message: `A new payout of ₹${totalCommission.toLocaleString('en-IN')} has been created for your account.`,
        type: 'payout',
        data: {
          payout_id: payout.id,
          amount: totalCommission
        }
      })
    
    return NextResponse.json({
      success: true,
      message: 'Payout created successfully',
      payout: {
        id: payout.id,
        amount: totalCommission,
        orders_count: unpaidOrders.length,
        status: 'pending',
        created_at: payout.created_at
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error in POST /api/dealer/payouts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update payout status (admin only)
export async function PUT(request: NextRequest) {
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
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can update payouts' },
        { status: 403 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { 
      payout_id,
      status,
      razorpay_payout_id,
      bank_reference,
      notes
    } = body
    
    // Validate required fields
    if (!payout_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate status
    if (!['pending', 'processing', 'completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }
    
    // Get current payout
    const { data: currentPayout } = await supabase
      .from('dealer_payouts')
      .select('*')
      .eq('id', payout_id)
      .single()
    
    if (!currentPayout) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      )
    }
    
    // Update payout
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    }
    
    if (status === 'completed') {
      updateData.processed_at = new Date().toISOString()
    }
    
    if (razorpay_payout_id) {
      updateData.razorpay_payout_id = razorpay_payout_id
    }
    
    if (bank_reference) {
      updateData.bank_reference = bank_reference
    }
    
    if (notes) {
      updateData.notes = notes
    }
    
    const { data: updatedPayout, error: updateError } = await supabase
      .from('dealer_payouts')
      .update(updateData)
      .eq('id', payout_id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating payout:', updateError)
      return NextResponse.json(
        { error: 'Failed to update payout' },
        { status: 500 }
      )
    }
    
    // Send notification to dealer
    const { data: dealer } = await supabase
      .from('dealers')
      .select('user_id')
      .eq('id', currentPayout.dealer_id)
      .single()
    
    if (dealer) {
      const statusMessage = status === 'completed' 
        ? 'has been completed and transferred to your bank account'
        : status === 'failed'
        ? 'has failed. Please contact support.'
        : `is now ${status}`
      
      await supabase
        .from('notifications')
        .insert({
          user_id: dealer.user_id,
          title: 'Payout Status Update',
          message: `Your payout of ₹${currentPayout.amount.toLocaleString('en-IN')} ${statusMessage}.`,
          type: 'payout',
          priority: status === 'failed' ? 'high' : 'normal',
          data: {
            payout_id: payout_id,
            amount: currentPayout.amount,
            status: status
          }
        })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Payout updated successfully',
      payout: updatedPayout
    })
    
  } catch (error) {
    console.error('Error in PUT /api/dealer/payouts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
