import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { loadRazorpay } from '@/lib/utils/razorpay-loader'

interface BookTestRideData {
  vehicleId: string
  preferredDate: string
  preferredTime: string
  dealershipId?: string | null
  specialRequests?: string
  contactNumber?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  skipPayment?: boolean
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export function useTestRidePayment() {
  const router = useRouter()
  const [isBooking, setIsBooking] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const bookTestRideWithPayment = useCallback(async (data: BookTestRideData) => {
    setIsBooking(true)

    try {
      // Step 1: Create booking and get Razorpay order
      const response = await fetch('/api/test-rides/book-with-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to initiate booking')
        return null
      }

      // If payment is not required (skipPayment was true)
      if (!result.payment) {
        toast.success('Test ride booked successfully!')
        router.push('/dashboard/test-rides')
        return result.booking
      }

      // Step 2: Load Razorpay and process payment
      const Razorpay = await loadRazorpay()
      
      if (!Razorpay) {
        toast.error('Failed to load payment gateway')
        return null
      }

      const options = {
        key: result.payment.keyId,
        amount: result.payment.amount,
        currency: result.payment.currency,
        name: 'Omni E-Ride',
        description: result.payment.description,
        order_id: result.payment.orderId,
        prefill: result.payment.prefill,
        notes: result.payment.notes,
        theme: {
          color: '#000000'
        },
        handler: async (response: RazorpaySuccessResponse) => {
          // Payment successful, verify it
          setIsProcessingPayment(true)
          
          try {
            const verifyResponse = await fetch('/api/test-rides/verify-payment-v2', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_id: result.booking.id
              })
            })

            const verifyResult = await verifyResponse.json()

            if (!verifyResponse.ok) {
              toast.error(verifyResult.error || 'Payment verification failed')
              return
            }

            toast.success('Payment successful! Test ride confirmed.')
            router.push('/dashboard/test-rides')
          } catch (error) {
            console.error('Payment verification error:', error)
            toast.error('Payment verification failed. Please contact support.')
          } finally {
            setIsProcessingPayment(false)
          }
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled')
            setIsBooking(false)
          }
        }
      }

      const razorpayInstance = new Razorpay(options)
      razorpayInstance.open()

      return result.booking

    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Failed to book test ride')
      return null
    } finally {
      setIsBooking(false)
    }
  }, [router])

  return {
    bookTestRideWithPayment,
    isBooking,
    isProcessingPayment
  }
}
