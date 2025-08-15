import Razorpay from 'razorpay'

// Initialize Razorpay instance with credentials
const initializeRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables.')
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

// Export a function to get the Razorpay instance
// This allows for lazy initialization and better error handling
export const getRazorpayInstance = () => {
  try {
    return initializeRazorpay()
  } catch (error) {
    console.error('Failed to initialize Razorpay:', error)
    throw error
  }
}

// Verify payment signature
export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const crypto = require('crypto')
  
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured')
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  return generatedSignature === signature
}

// Helper function to format amount for Razorpay (converts to paise)
export const formatAmountForRazorpay = (amountInRupees: number): number => {
  return Math.round(amountInRupees * 100) // Convert to paise
}

// Helper function to format amount from Razorpay (converts from paise)
export const formatAmountFromRazorpay = (amountInPaise: number): number => {
  return amountInPaise / 100 // Convert to rupees
}

// Common currency code
export const CURRENCY = 'INR'

// Payment method configurations
export const PAYMENT_METHODS = {
  card: true,
  netbanking: true,
  wallet: true,
  upi: true,
}

// Test ride deposit amount in rupees
export const TEST_RIDE_DEPOSIT = 2000

// Order payment configuration
export const ORDER_PAYMENT_CONFIG = {
  partialPaymentAllowed: false,
  minPartialAmount: 10000, // Minimum ₹10,000 for partial payment
}

// Webhook event types we handle
export const WEBHOOK_EVENTS = {
  PAYMENT_CAPTURED: 'payment.captured',
  PAYMENT_FAILED: 'payment.failed',
  ORDER_PAID: 'order.paid',
  REFUND_PROCESSED: 'refund.processed',
}
