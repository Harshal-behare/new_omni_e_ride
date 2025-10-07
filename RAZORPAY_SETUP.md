# Razorpay Setup Guide for Omni E-Ride
## Getting Your Razorpay Credentials

1. **Sign up / Login to Razorpay**
   - Go to https://dashboard.razorpay.com/
   - Sign up for a new account or login if you already have one

2. **Get Test Credentials (For Development)**
   - Once logged in, you'll be in Test Mode by default
   - Go to **Settings** → **API Keys**
   - Click on **Generate Test Key**
   - You'll get:
     - **Key ID**: Starts with `rzp_test_` (e.g., `rzp_test_1DP5mmOlF5G5ag`)
     - **Key Secret**: A random string (e.g., `thisissupersecretkey`)

3. **Update Your .env.local File**
   ```env
   # Replace these with your actual values
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID
   RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID
   RAZORPAY_KEY_SECRET=YOUR_ACTUAL_KEY_SECRET
   ```

4. **Get Webhook Secret (Optional but Recommended)**
   - In Razorpay Dashboard, go to **Webhooks**
   - Click **Add New Webhook**
   - Set Webhook URL: `https://your-domain.com/api/webhooks/razorpay`
   - Select events: payment.captured, payment.failed
   - After creating, copy the **Secret**
   - Update in .env.local:
     ```env
     RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
     ```

## Important Notes

- **Test Mode**: Always use test credentials during development
- **Live Mode**: Switch to live credentials only in production
- **Security**: Never commit your actual credentials to Git
- **Key Secret**: Keep it server-side only, never expose to client

## Testing Payments

In test mode, use these test card details:
- **Card Number**: 4111 1111 1111 1111
- **Expiry**: Any future date
- **CVV**: Any 3 digits
- **Name**: Any name

## Troubleshooting

If you see "Authentication failed" error:
1. Double-check your credentials are copied correctly
2. Ensure no extra spaces in the values
3. Restart your development server after updating .env.local
4. Make sure both RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set

## Next Steps

1. Update your .env.local with actual Razorpay credentials
2. Restart your development server: `pnpm run dev`
3. Test the payment flow with the test card details above
