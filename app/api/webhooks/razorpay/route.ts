import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WEBHOOK_EVENTS } from '@/lib/razorpay/client'
import crypto from 'crypto'

// Verify webhook signature
function verifyWebhookSignature(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 503 }
      )
    }
    
    // Get raw body and signature
    const rawBody = await request.text()
    const signature = request.headers.get('x-razorpay-signature')
    
    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret)
    
    if (!isValid) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    // Parse webhook payload
    const payload = JSON.parse(rawBody)
    const { event, payload: eventPayload } = payload
    
    console.log('Received webhook event:', event)
    
    // Initialize Supabase client
    const supabase = await createClient()
    
    // Process different webhook events
    switch (event) {
      case WEBHOOK_EVENTS.PAYMENT_CAPTURED:
        await handlePaymentCaptured(supabase, eventPayload)
        break
        
      case WEBHOOK_EVENTS.PAYMENT_FAILED:
        await handlePaymentFailed(supabase, eventPayload)
        break
        
      case WEBHOOK_EVENTS.ORDER_PAID:
        await handleOrderPaid(supabase, eventPayload)
        break
        
      case WEBHOOK_EVENTS.REFUND_PROCESSED:
        await handleRefundProcessed(supabase, eventPayload)
        break
        
      default:
        console.log('Unhandled webhook event:', event)
    }
    
    // Store webhook event for audit
    await storeWebhookEvent(supabase, event, eventPayload)
    
    // Return success response
    return NextResponse.json({ status: 'ok' })
    
  } catch (error) {
    console.error('Error processing webhook:', error)
    
    // Return success to prevent retry
    // Log error for debugging
    return NextResponse.json({ status: 'ok' })
  }
}

// Handle payment captured event
async function handlePaymentCaptured(supabase: any, payload: any) {
  try {
    const { payment } = payload
    const { order_id, id: payment_id, amount, method, status } = payment.entity
    
    // Update payment order status
    await supabase
      .from('payment_orders')
      .update({
        status: 'captured',
        razorpay_payment_id: payment_id,
        payment_method: method,
        captured_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', order_id)
    
    // Get the payment order to determine type
    const { data: paymentOrder } = await supabase
      .from('payment_orders')
      .select('notes')
      .eq('razorpay_order_id', order_id)
      .single()
    
    if (paymentOrder?.notes?.type === 'test_ride') {
      // Update test ride booking
      await supabase
        .from('test_ride_bookings')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          payment_id: payment_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentOrder.notes.testRideId)
      
      // Send confirmation notification
      await sendTestRideConfirmation(paymentOrder.notes.testRideId)
      
    } else if (paymentOrder?.notes?.type === 'vehicle_order') {
      // Update vehicle order
      await supabase
        .from('vehicle_orders')
        .update({
          payment_status: 'paid',
          order_status: 'confirmed',
          payment_id: payment_id,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentOrder.notes.orderId)
      
      // Update stock quantity
      await updateVehicleStock(supabase, paymentOrder.notes.vehicleId, paymentOrder.notes.quantity)
      
      // Send order confirmation
      await sendOrderConfirmation(paymentOrder.notes.orderId)
    }
    
    console.log('Payment captured successfully:', payment_id)
    
  } catch (error) {
    console.error('Error handling payment captured:', error)
  }
}

// Handle payment failed event
async function handlePaymentFailed(supabase: any, payload: any) {
  try {
    const { payment } = payload
    const { order_id, id: payment_id, error: paymentError } = payment.entity
    
    // Update payment order status
    await supabase
      .from('payment_orders')
      .update({
        status: 'failed',
        razorpay_payment_id: payment_id,
        failure_reason: paymentError?.description || 'Payment failed',
        failed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', order_id)
    
    // Get the payment order to determine type
    const { data: paymentOrder } = await supabase
      .from('payment_orders')
      .select('notes')
      .eq('razorpay_order_id', order_id)
      .single()
    
    if (paymentOrder?.notes?.type === 'test_ride') {
      // Update test ride booking
      await supabase
        .from('test_ride_bookings')
        .update({
          payment_status: 'failed',
          status: 'cancelled',
          cancellation_reason: 'Payment failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentOrder.notes.testRideId)
      
    } else if (paymentOrder?.notes?.type === 'vehicle_order') {
      // Update vehicle order
      await supabase
        .from('vehicle_orders')
        .update({
          payment_status: 'failed',
          order_status: 'cancelled',
          cancellation_reason: 'Payment failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentOrder.notes.orderId)
      
      // Release stock reservation
      await releaseStockReservation(supabase, paymentOrder.notes.orderId)
    }
    
    console.log('Payment failed:', payment_id, paymentError)
    
  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

// Handle order paid event
async function handleOrderPaid(supabase: any, payload: any) {
  try {
    const { order } = payload
    const { id: order_id, amount_paid, amount_due } = order.entity
    
    // Update payment order with paid amount
    await supabase
      .from('payment_orders')
      .update({
        amount_paid: amount_paid / 100, // Convert from paise
        amount_due: amount_due / 100,
        status: amount_due === 0 ? 'completed' : 'partial',
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', order_id)
    
    console.log('Order payment updated:', order_id)
    
  } catch (error) {
    console.error('Error handling order paid:', error)
  }
}

// Handle refund processed event
async function handleRefundProcessed(supabase: any, payload: any) {
  try {
    const { refund } = payload
    const { payment_id, id: refund_id, amount, status } = refund.entity
    
    // Store refund record
    await supabase
      .from('payment_refunds')
      .insert({
        refund_id: refund_id,
        payment_id: payment_id,
        amount: amount / 100, // Convert from paise
        status: status,
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
    
    // Update payment transaction
    await supabase
      .from('payment_transactions')
      .update({
        refund_status: status,
        refund_amount: amount / 100,
        refund_id: refund_id,
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', payment_id)
    
    console.log('Refund processed:', refund_id)
    
  } catch (error) {
    console.error('Error handling refund:', error)
  }
}

// Store webhook event for audit
async function storeWebhookEvent(supabase: any, event: string, payload: any) {
  try {
    await supabase
      .from('webhook_events')
      .insert({
        source: 'razorpay',
        event_type: event,
        payload: payload,
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error storing webhook event:', error)
  }
}

// Update vehicle stock after successful payment
async function updateVehicleStock(supabase: any, vehicleId: string, quantity: number) {
  try {
    // Decrease stock quantity
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('stock_quantity')
      .eq('id', vehicleId)
      .single()
    
    if (vehicle) {
      await supabase
        .from('vehicles')
        .update({
          stock_quantity: Math.max(0, vehicle.stock_quantity - quantity),
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId)
    }
  } catch (error) {
    console.error('Error updating vehicle stock:', error)
  }
}

// Release stock reservation on payment failure
async function releaseStockReservation(supabase: any, orderId: string) {
  try {
    await supabase
      .from('stock_reservations')
      .delete()
      .eq('order_id', orderId)
  } catch (error) {
    console.error('Error releasing stock reservation:', error)
  }
}

// Send test ride confirmation (placeholder)
async function sendTestRideConfirmation(testRideId: string) {
  console.log('Sending test ride confirmation for:', testRideId)
  // Implement email/SMS notification
}

// Send order confirmation (placeholder)
async function sendOrderConfirmation(orderId: string) {
  console.log('Sending order confirmation for:', orderId)
  // Implement email/SMS notification
}
