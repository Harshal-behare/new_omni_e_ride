import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface BookingData {
  vehicle_id: string;
  dealer_id?: string;
  scheduled_date: string;
  scheduled_time: string;
  notes?: string;
}

export const useSimpleTestRideBooking = () => {
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<Error | null>(null);
  const router = useRouter();

  const bookTestRide = useCallback(async (bookingData: BookingData) => {
    setIsBooking(true);
    setBookingError(null);

    try {
      // Transform booking data to match API expectations
      const apiData = {
        vehicleId: bookingData.vehicle_id,
        preferredDate: bookingData.scheduled_date,
        preferredTime: bookingData.scheduled_time,
        dealershipId: bookingData.dealer_id,
        contactNumber: '9999999999', // Default contact number
        address: 'User Address',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        specialRequests: bookingData.notes
      };

      // Create booking
      const response = await fetch('/api/test-rides/book-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to book test ride');
      }

      const result = await response.json();

      // Show success message
      toast.success(
        `Test ride booked successfully! Confirmation code: ${result.booking.confirmationCode || 'Will be sent via email'}`,
        { duration: 5000 }
      );

      // Redirect to bookings page after a short delay
      setTimeout(() => {
        router.push('/dashboard/test-rides');
      }, 2000);

      return result;
    } catch (error: any) {
      console.error('Test ride booking error:', error);
      toast.error(error.message || 'Failed to book test ride');
      setBookingError(error);
      throw error;
    } finally {
      setIsBooking(false);
    }
  }, [router]);

  return {
    bookTestRide,
    isBooking,
    error: bookingError,
  };
};
