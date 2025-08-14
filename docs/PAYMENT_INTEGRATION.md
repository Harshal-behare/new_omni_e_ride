# Razorpay Payment Integration Documentation

## Overview
This document describes the Razorpay payment integration implemented for Omni E-Ride platform, handling test ride bookings and vehicle order payments.

## Features Implemented

### 1. Payment Processing
- **Test Ride Booking**: ₹2,000 refundable deposit
- **Vehicle Orders**: Full or partial payment options
- **Payment Methods**: Card, UPI, Net Banking, Wallets
- **Secure Verification**: Signature-based payment verification
- **Webhook Integration**: Automatic payment status updates

### 2. API Endpoints

#### Payment APIs
- `POST /api/payments/create-order` - Create Razorpay payment order
- `POST /api/payments/verify` - Verify payment signature and update status
- `POST /api/webhooks/razorpay` - Handle Razorpay webhook events

#### Business APIs
- `POST /api/test-rides/book` - Book test ride with payment
- `GET /api/test-rides/book` - Get user's test ride bookings
- `POST /api/orders/checkout` - Process vehicle order with payment
- `GET /api/orders/checkout` - Get user's orders

## Setup Instructions

### 1. Environment Configuration

Add the following variables to your `.env.local` file:

```env
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Database Setup

Run the migration file to create required tables:

```bash
# Using Supabase CLI
supabase db push

# Or run the SQL directly in Supabase Dashboard
# File: supabase/migrations/20240814_payment_tables.sql
```

### 3. Razorpay Dashboard Configuration

1. **Get API Keys**:
   - Login to [Razorpay Dashboard](https://dashboard.razorpay.com)
   - Navigate to Settings → API Keys
   - Generate test/live keys

2. **Setup Webhook**:
   - Go to Settings → Webhooks
   - Add webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
   - Select events:
     - `payment.captured`
     - `payment.failed`
     - `order.paid`
     - `refund.processed`
   - Copy the webhook secret

## Usage Examples

### 1. Test Ride Booking with Payment

```tsx
import { useTestRidePayment } from '@/hooks/use-razorpay';

function TestRideBooking() {
  const { bookTestRide, isBooking, error } = useTestRidePayment();

  const handleBooking = async () => {
    try {
      await bookTestRide({
        vehicleId: 'vehicle-uuid',
        preferredDate: '2024-08-20',
        preferredTime: '10:00',
        contactNumber: '9876543210',
        address: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      });
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };

  return (
    <button onClick={handleBooking} disabled={isBooking}>
      {isBooking ? 'Processing...' : 'Book Test Ride (₹2,000 deposit)'}
    </button>
  );
}
```

### 2. Vehicle Checkout with Payment

```tsx
import { useVehicleCheckout } from '@/hooks/use-razorpay';

function VehicleCheckout() {
  const { checkout, isCheckingOut, error } = useVehicleCheckout();

  const handleCheckout = async () => {
    try {
      await checkout({
        vehicleId: 'vehicle-uuid',
        quantity: 1,
        color: 'Midnight Blue',
        paymentType: 'full', // or 'partial'
        deliveryAddress: {
          street: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        billingAddress: {
          // Same as delivery or different
        },
        contactNumber: '9876543210',
        promoCode: 'LAUNCH2024' // Optional
      });
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

  return (
    <button onClick={handleCheckout} disabled={isCheckingOut}>
      {isCheckingOut ? 'Processing...' : 'Proceed to Payment'}
    </button>
  );
}
```

### 3. Direct Payment Integration

```tsx
import { useRazorpay } from '@/hooks/use-razorpay';
import { createPaymentOrder } from '@/lib/razorpay/razorpay-client';

function CustomPayment() {
  const { processPayment, isLoading } = useRazorpay({
    onSuccess: (response) => {
      console.log('Payment successful:', response);
    },
    onError: (error) => {
      console.error('Payment failed:', error);
    }
  });

  const handlePayment = async () => {
    // Create order on backend
    const order = await createPaymentOrder(
      5000, // Amount in rupees
      'Custom payment description'
    );

    // Process payment
    await processPayment({
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      description: order.description,
      keyId: order.keyId,
      prefill: order.prefill
    });
  };

  return (
    <button onClick={handlePayment} disabled={isLoading}>
      Pay ₹5,000
    </button>
  );
}
```

## Payment Flow

### Test Ride Booking Flow
1. User fills booking form with vehicle and schedule details
2. System creates booking record with `pending` status
3. Razorpay order is created for ₹2,000 deposit
4. User completes payment through Razorpay checkout
5. Payment signature is verified on backend
6. Booking status updated to `confirmed`
7. Confirmation email sent to user

### Vehicle Order Flow
1. User selects vehicle, color, and quantity
2. System calculates pricing (base + taxes - discount)
3. User chooses full or partial payment
4. Razorpay order created for payment amount
5. Stock is temporarily reserved (30 minutes)
6. User completes payment
7. Order confirmed and stock updated
8. Order confirmation and tracking details sent

## Security Considerations

1. **API Keys**: 
   - Never expose `RAZORPAY_KEY_SECRET` to client
   - Use `NEXT_PUBLIC_RAZORPAY_KEY_ID` only for client-side

2. **Signature Verification**:
   - Always verify payment signature on backend
   - Use webhook secret for webhook signature verification

3. **Database Security**:
   - Row Level Security (RLS) enabled
   - Users can only access their own payment records

4. **Error Handling**:
   - Graceful fallbacks for payment failures
   - Automatic stock reservation release on failure
   - Comprehensive error logging

## Testing

### Test Cards for Razorpay

- **Success**: 4111 1111 1111 1111
- **Failure**: 5105 1051 0510 5100
- **UPI**: success@razorpay
- **Net Banking**: Any bank with username/password as 'razorpay'

### Test Scenarios

1. **Successful Payment**:
   - Use test success card
   - Verify order status updates
   - Check email notifications

2. **Failed Payment**:
   - Use test failure card
   - Verify booking/order cancellation
   - Check stock reservation release

3. **Webhook Testing**:
   - Use Razorpay webhook tester
   - Verify event processing
   - Check database updates

## Troubleshooting

### Common Issues

1. **"Razorpay credentials not configured"**
   - Ensure environment variables are set
   - Restart development server after adding env vars

2. **"Payment verification failed"**
   - Check if signature calculation is correct
   - Verify webhook secret is properly configured

3. **"Failed to load payment gateway"**
   - Check internet connectivity
   - Verify Razorpay script URL is accessible

4. **Webhook not receiving events**
   - Verify webhook URL is publicly accessible
   - Check webhook secret configuration
   - Review Razorpay dashboard webhook logs

## Monitoring

### Key Metrics to Track
- Payment success rate
- Average payment time
- Failed payment reasons
- Refund processing time
- Webhook delivery success

### Logs to Monitor
- Payment creation failures
- Signature verification failures
- Webhook processing errors
- Stock reservation timeouts

## Support

For payment-related issues:
- **Technical Issues**: Check server logs and Razorpay dashboard
- **Integration Help**: Refer to [Razorpay Documentation](https://razorpay.com/docs/)
- **Business Queries**: Contact Razorpay support

## Future Enhancements

- [ ] EMI payment options
- [ ] International payment support
- [ ] Subscription-based payments
- [ ] Auto-retry for failed payments
- [ ] Payment analytics dashboard
- [ ] Bulk refund processing
- [ ] Invoice generation
- [ ] Payment reminder notifications
