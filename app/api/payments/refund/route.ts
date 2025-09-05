import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRazorpayInstance } from '@/lib/razorpay/client'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to continue' },
        { status: 401 }
      )
    }
    
    // Check if user is admin or dealer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || !['admin', 'dealer'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins and dealers can process refunds' },
        { status: 403 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { 
      payment_id,
      amount,
      reason,
      type, // 'test_ride' or 'order'
      reference_id // test_ride_id or order_id
    } = body
    
    // Validate required fields
    if (!payment_id || !amount || !reason || !type || !reference_id) {
      return NextResponse.json(
        { error: 'Missing required refund information' },
        { status: 400 }
      )
    }
    
    // Get payment details
    const { data: paymentTx } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('payment_id', payment_id)
      .single()
    
    if (!paymentTx) {
      return NextResponse.json(
        { error: 'Payment transaction not found' },
        { status: 404 }
      )
    }
    
    // Validate refund amount
    if (amount > paymentTx.amount) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed original payment amount' },
        { status: 400 }
      )
    }
    
    // Check if already refunded
    const { data: existingRefund } = await supabase
      .from('payment_refunds')
      .select('*')
      .eq('payment_id', payment_id)
      .eq('status', 'processed')
    
    if (existingRefund && existingRefund.length > 0) {
      const totalRefunded = existingRefund.reduce((sum, refund) => sum + Number(refund.amount), 0)
      if (totalRefunded + amount > paymentTx.amount) {
        return NextResponse.json(
          { error: 'Total refund amount exceeds original payment' },
          { status: 400 }
        )
      }
    }
    
    // Verify ownership for dealers
    if (profile.role === 'dealer') {
      if (type === 'test_ride') {
        const { data: testRide } = await supabase
          .from('test_rides')
          .select('dealer_id')
          .eq('id', reference_id)
          .single()
        
        const { data: dealer } = await supabase
          .from('dealers')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (!testRide || !dealer || testRide.dealer_id !== dealer.id) {
          return NextResponse.json(
            { error: 'Unauthorized - You can only refund your own test rides' },
            { status: 403 }
          )
        }
      } else if (type === 'order') {
        const { data: order } = await supabase
          .from('orders')
          .select('dealer_id')
          .eq('id', reference_id)
          .single()
        
        const { data: dealer } = await supabase
          .from('dealers')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (!order || !dealer || order.dealer_id !== dealer.id) {
          return NextResponse.json(
            { error: 'Unauthorized - You can only refund your own orders' },
            { status: 403 }
          )
        }
      }
    }
    
    // Process refund with Razorpay
    const razorpay = getRazorpayInstance()
    
    try {
      const refundData = {
        amount: Math.round(amount * 100), // Convert to paise
        notes: {
          reason: reason,
          type: type,
          reference_id: reference_id,
          processed_by: user.id,
          processed_at: new Date().toISOString()
        }
      }
      
      const refund = await razorpay.payments.refund(payment_id, refundData)
      
      // Store refund record
      const { error: refundError } = await supabase
        .from('payment_refunds')
        .insert({
          payment_id: payment_id,
          refund_id: refund.id,
          amount: amount,
          status: 'processing',
          reason: reason,
          notes: {
            type: type,
            reference_id: reference_id,
            processed_by: user.id,
            user_role: profile.role
          },
          processed_at: new Date().toISOString()
        })
      
      if (refundError) {
        console.error('Error storing refund record:', refundError)
        // Continue - refund is processing
      }
      
      // Update reference record based on type
      if (type === 'test_ride') {
        await supabase
          .from('test_rides')
          .update({
            payment_status: 'refunded',
            refund_id: refund.id,
            refund_amount: amount,
            refunded_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', reference_id)
      } else if (type === 'order') {
        const { data: currentOrder } = await supabase
          .from('orders')
          .select('payment_status')
          .eq('id', reference_id)
          .single()
        
        // Determine new payment status
        const newPaymentStatus = amount >= paymentTx.amount ? 'refunded' : 'partial_refund'
        
        await supabase
          .from('orders')
          .update({
            payment_status: newPaymentStatus,
            refund_amount: amount,
            refund_id: refund.id,
            refunded_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', reference_id)
      }
      
      // Log the refund action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'payment_refund',
          entity_type: type,
          entity_id: reference_id,
          details: {
            payment_id: payment_id,
            refund_id: refund.id,
            amount: amount,
            reason: reason
          },
          created_at: new Date().toISOString()
        })
      
      return NextResponse.json({
        success: true,
        message: 'Refund initiated successfully',
        refund: {
          id: refund.id,
          amount: amount,
          status: refund.status,
          payment_id: payment_id,
          created_at: refund.created_at
        }
      })
      
    } catch (razorpayError: any) {
      console.error('Razorpay refund error:', razorpayError)
      
      // Check if it's a specific error
      if (razorpayError.error?.code === 'BAD_REQUEST_ERROR') {
        return NextResponse.json(
          { error: razorpayError.error.description || 'Invalid refund request' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to process refund. Please try again.' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Error processing refund:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch refund history
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
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const reference_id = searchParams.get('reference_id')
    const status = searchParams.get('status')
    
    // Build query
    let query = supabase
      .from('payment_refunds')
      .select(`
        *,
        payment_transactions!payment_id (
          amount as original_amount,
          user_id,
          metadata
        )
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters based on user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role === 'customer') {
      // Customers can only see their own refunds
      query = query.eq('payment_transactions.user_id', user.id)
    } else if (profile?.role === 'dealer') {
      // Dealers can see refunds for their orders/test rides
      const { data: dealer } = await supabase
        .from('dealers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!dealer) {
        return NextResponse.json([])
      }
      
      // This would need a more complex join - simplified for now
      query = query.eq('notes->processed_by', user.id)
    }
    // Admins can see all refunds
    
    // Apply additional filters
    if (type) {
      query = query.eq('notes->type', type)
    }
    if (reference_id) {
      query = query.eq('notes->reference_id', reference_id)
    }
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching refunds:', error)
      return NextResponse.json(
        { error: 'Failed to fetch refunds' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error in GET /api/payments/refund:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
