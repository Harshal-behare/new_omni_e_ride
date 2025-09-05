import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

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
}

interface BookingError {
  type: 'duplicate' | 'limit' | 'network' | 'validation' | 'unknown'
  message: string
}

export function useTestRideBooking() {
  const router = useRouter()
  const supabase = useSupabaseClient()
  const [isBooking, setIsBooking] = useState(false)
  const [error, setError] = useState<BookingError | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const bookingInProgressRef = useRef(false)

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  const bookTestRide = useCallback(async (data: BookTestRideData) => {
    // Prevent multiple simultaneous bookings
    if (bookingInProgressRef.current) {
      console.log('Booking already in progress, ignoring duplicate request')
      return null
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController()
    
    setIsBooking(true)
    setError(null)
    bookingInProgressRef.current = true

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Please login to book a test ride')
      }

      // Validate data
      if (!data.vehicleId || !data.preferredDate || !data.preferredTime) {
        const error: BookingError = {
          type: 'validation',
          message: 'Please fill in all required fields'
        }
        setError(error)
        toast.error(error.message)
        return null
      }

      // Make the booking request with timeout
      const response = await fetch('/api/test-rides/book-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: abortControllerRef.current.signal
      })

      // Handle response
      const result = await response.json()

      if (!response.ok) {
        let errorType: BookingError['type'] = 'unknown'
        let errorMessage = result.error || 'Failed to book test ride'

        // Categorize errors
        if (response.status === 409 || errorMessage.toLowerCase().includes('duplicate')) {
          errorType = 'duplicate'
          errorMessage = 'You already have a booking for this time slot. Please choose a different time.'
        } else if (response.status === 429 || errorMessage.toLowerCase().includes('limit')) {
          errorType = 'limit'
          errorMessage = result.error || 'Booking limit reached. Please try again tomorrow.'
        } else if (response.status === 400) {
          errorType = 'validation'
        }

        const error: BookingError = {
          type: errorType,
          message: errorMessage
        }
        setError(error)
        toast.error(errorMessage)
        return null
      }

      // Success
      toast.success(
        <div>
          <p className="font-semibold">Test ride booked successfully!</p>
          <p className="text-sm">Confirmation code: <span className="font-mono">{result.booking.confirmationCode}</span></p>
        </div>,
        { duration: 6000 }
      )

      // Navigate after a brief delay to ensure state updates
      setTimeout(() => {
        router.push('/dashboard/test-rides')
      }, 500)

      return result.booking

    } catch (error: any) {
      console.error('Test ride booking error:', error)

      let errorType: BookingError['type'] = 'unknown'
      let errorMessage = 'An error occurred while booking. Please try again.'

      if (error.name === 'AbortError') {
        // Request was aborted, likely due to a new request
        return null
      } else if (error.message?.includes('fetch')) {
        errorType = 'network'
        errorMessage = 'Network error. Please check your connection and try again.'
      }

      const bookingError: BookingError = {
        type: errorType,
        message: errorMessage
      }
      setError(bookingError)
      toast.error(errorMessage)
      return null

    } finally {
      setIsBooking(false)
      bookingInProgressRef.current = false
      abortControllerRef.current = null
    }
  }, [router, supabase])

  // Cancel ongoing request
  const cancelBooking = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsBooking(false)
    bookingInProgressRef.current = false
  }, [])

  return {
    bookTestRide,
    isBooking,
    error,
    resetError,
    cancelBooking
  }
}
