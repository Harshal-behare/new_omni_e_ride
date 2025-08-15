import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  loadRazorpayScript,
  initializePayment,
  verifyPayment,
  RazorpayOptions,
  RazorpayResponse,
  PaymentVerificationData,
} from '@/lib/razorpay/razorpay-client';

interface UseRazorpayOptions {
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
  onDismiss?: () => void;
}

interface PaymentConfig {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  keyId: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  metadata?: Record<string, any>;
}

export const useRazorpay = (options?: UseRazorpayOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const processPayment = useCallback(
    async (config: PaymentConfig) => {
      setIsLoading(true);
      setError(null);

      try {
        // Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Failed to load payment gateway');
        }

        // Configure Razorpay options
        const razorpayOptions: RazorpayOptions = {
          key: config.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          amount: config.amount * 100, // Convert to paise
          currency: config.currency,
          name: 'Omni E-Ride',
          description: config.description,
          image: '/logo.png',
          order_id: config.orderId,
          handler: async (response: RazorpayResponse) => {
            try {
              // Verify payment on backend
              const verificationData: PaymentVerificationData = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                metadata: config.metadata,
              };

              const result = await verifyPayment(verificationData);
              
              toast.success('Payment successful!');
              options?.onSuccess?.(result);
            } catch (verifyError: any) {
              console.error('Payment verification failed:', verifyError);
              toast.error(verifyError.message || 'Payment verification failed');
              setError(verifyError);
              options?.onError?.(verifyError);
            } finally {
              setIsLoading(false);
            }
          },
          prefill: config.prefill,
          theme: {
            color: '#3B82F6', // Blue theme
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
              options?.onDismiss?.();
            },
            confirm_close: true,
          },
          retry: {
            enabled: true,
            max_count: 3,
          },
        };

        // Open Razorpay checkout
        await initializePayment(razorpayOptions);
      } catch (err: any) {
        console.error('Payment processing error:', err);
        toast.error(err.message || 'Failed to process payment');
        setError(err);
        setIsLoading(false);
        options?.onError?.(err);
      }
    },
    [options]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    processPayment,
    isLoading,
    error,
    resetError,
  };
};

// Hook for test ride booking with payment
export const useTestRidePayment = () => {
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<Error | null>(null);

  const { processPayment, isLoading: isProcessingPayment } = useRazorpay({
    onSuccess: async (result) => {
      toast.success('Test ride booked successfully!');
      // Redirect to bookings page or show confirmation
      window.location.href = '/dashboard/test-rides';
    },
    onError: (error) => {
      setBookingError(error);
    },
  });

  const bookTestRide = useCallback(async (bookingData: any) => {
    setIsBooking(true);
    setBookingError(null);

    try {
      // Create booking and payment order
      const response = await fetch('/api/test-rides/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to book test ride');
      }

      const result = await response.json();

      // Process payment
      await processPayment({
        orderId: result.payment.orderId,
        amount: result.payment.amount,
        currency: result.payment.currency,
        description: result.payment.description,
        keyId: result.payment.keyId,
        prefill: result.payment.prefill,
        metadata: {
          type: 'test_ride',
          testRideId: result.booking.id,
        },
      });

      return result;
    } catch (error: any) {
      console.error('Test ride booking error:', error);
      toast.error(error.message || 'Failed to book test ride');
      setBookingError(error);
      throw error;
    } finally {
      setIsBooking(false);
    }
  }, [processPayment]);

  return {
    bookTestRide,
    isBooking: isBooking || isProcessingPayment,
    error: bookingError,
  };
};

// Hook for vehicle order checkout with payment
export const useVehicleCheckout = () => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<Error | null>(null);

  const { processPayment, isLoading: isProcessingPayment } = useRazorpay({
    onSuccess: async (result) => {
      toast.success('Order placed successfully!');
      // Redirect to orders page
      window.location.href = '/dashboard/orders';
    },
    onError: (error) => {
      setCheckoutError(error);
    },
  });

  const checkout = useCallback(async (orderData: any) => {
    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      // Create order and payment order
      const response = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process checkout');
      }

      const result = await response.json();

      // Process payment
      await processPayment({
        orderId: result.payment.orderId,
        amount: result.payment.amount,
        currency: result.payment.currency,
        description: result.payment.description,
        keyId: result.payment.keyId,
        prefill: result.payment.prefill,
        metadata: {
          type: 'vehicle_order',
          orderId: result.order.id,
        },
      });

      return result;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to process checkout');
      setCheckoutError(error);
      throw error;
    } finally {
      setIsCheckingOut(false);
    }
  }, [processPayment]);

  return {
    checkout,
    isCheckingOut: isCheckingOut || isProcessingPayment,
    error: checkoutError,
  };
};
