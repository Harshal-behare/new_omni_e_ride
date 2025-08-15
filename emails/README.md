# Email Notification System

This directory contains all email templates and utilities for the Omni E-Ride notification system.

## Setup

### 1. Install Dependencies

```bash
npm install resend @react-email/components react-email
```

### 2. Configure Environment Variables

Add your Resend API key to your `.env.local` file:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM="Omni E-Ride <noreply@omni-e-ride.com>"
```

### 3. Verify Domain in Resend

1. Log into your [Resend dashboard](https://resend.com/domains)
2. Add and verify your domain
3. Configure DNS records as instructed

## Email Templates

All email templates are built using [React Email](https://react.email/) components for consistent styling and responsive design.

### Available Templates

1. **Welcome Email** (`welcome.tsx`)
   - Sent when a new user signs up
   - Includes optional email verification link
   - Features onboarding information

2. **Order Confirmation** (`order-confirmation.tsx`)
   - Sent immediately after order placement
   - Includes order details, items, pricing
   - Shipping address and tracking link

3. **Order Status Update** (`order-status-update.tsx`)
   - Sent when order status changes
   - Supports: processing, shipped, out for delivery, delivered, cancelled
   - Dynamic content based on status

4. **Test Ride Confirmation** (`test-ride-confirmation.tsx`)
   - Sent when test ride is booked
   - Includes booking details, dealer location
   - What to bring checklist
   - Reschedule/cancel options

5. **Dealer Application Status** (`dealer-application-status.tsx`)
   - Updates on dealer application progress
   - Supports: received, under review, approved, rejected, additional info required
   - Next steps for approved dealers

6. **Lead Assignment** (`lead-assignment.tsx`)
   - Sent to dealers when new lead is assigned
   - Lead details and contact information
   - Response deadline and tips
   - Accept/decline options

## Usage Examples

### Sending Emails Directly

```typescript
import { sendEmail } from '@/lib/email/send';
import WelcomeEmail from '@/emails/welcome';

// Send a welcome email
await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to Omni E-Ride!',
  react: WelcomeEmail({
    firstName: 'John',
    email: 'user@example.com',
    verificationUrl: 'https://omni-e-ride.com/verify?token=xxx'
  })
});
```

### Using Helper Functions

```typescript
import { 
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendTestRideConfirmationEmail 
} from '@/lib/email/send';

// Send welcome email
await sendWelcomeEmail(
  'user@example.com',
  'John',
  'https://omni-e-ride.com/verify?token=xxx'
);

// Send order confirmation
await sendOrderConfirmationEmail('user@example.com', {
  customerName: 'John Doe',
  orderNumber: 'ORD-2024-001234',
  orderDate: 'January 15, 2024',
  items: [...],
  total: 102070,
  shippingAddress: {...}
});

// Send test ride confirmation
await sendTestRideConfirmationEmail('user@example.com', {
  customerName: 'John Doe',
  bookingId: 'TR-2024-001234',
  vehicleName: 'Omni E-Bike Pro',
  date: 'Saturday, January 20, 2024',
  time: '10:00 AM - 11:00 AM',
  dealerName: 'Omni E-Ride Mumbai',
  dealerAddress: {...}
});
```

### Using Email Queue

The email queue is useful for:
- Bulk email sending
- Scheduled emails
- Automatic retries on failure
- Rate limiting

```typescript
import { emailQueue, queueWelcomeEmail } from '@/lib/email/queue';

// Queue a single email
const queueId = await queueWelcomeEmail(
  'user@example.com',
  'John',
  'https://omni-e-ride.com/verify?token=xxx'
);

// Check email status
const status = emailQueue.getStatus(queueId);
console.log(status);

// Queue multiple emails with scheduling
await emailQueue.addBatch(emails, {
  scheduledFor: new Date('2024-01-20 10:00:00')
});

// Get queue statistics
const stats = emailQueue.getStats();
console.log(stats);
// { total: 10, pending: 5, processing: 2, sent: 3, failed: 0 }

// Retry failed emails
emailQueue.retryFailed();
```

## Development

### Preview Emails Locally

Run the email development server:

```bash
npm run email:dev
```

This will start a local server at `http://localhost:3001` where you can preview all email templates.

### Creating New Templates

1. Create a new file in `/emails` directory
2. Import and use the `EmailLayout` component for consistent styling
3. Export the component with `PreviewProps` for testing

Example:

```typescript
import * as React from 'react';
import { EmailLayout } from './components/layout';

interface MyEmailProps {
  name: string;
  message: string;
}

export const MyEmail: React.FC<MyEmailProps> = ({ name, message }) => {
  return (
    <EmailLayout preview={`New message for ${name}`}>
      {/* Your email content */}
    </EmailLayout>
  );
};

MyEmail.PreviewProps = {
  name: 'John',
  message: 'Hello World'
} as MyEmailProps;

export default MyEmail;
```

### Testing Emails

```typescript
// In your test files
import { sendEmail } from '@/lib/email/send';

describe('Email Tests', () => {
  it('should send welcome email', async () => {
    const response = await sendEmail({
      to: process.env.TEST_EMAIL || 'test@example.com',
      subject: 'Test Email',
      text: 'This is a test'
    });
    
    expect(response.success).toBe(true);
  });
});
```

## API Routes

Create API routes to handle email sending from your application:

```typescript
// app/api/email/welcome/route.ts
import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/send';

export async function POST(request: Request) {
  const { email, firstName, verificationUrl } = await request.json();
  
  const result = await sendWelcomeEmail(email, firstName, verificationUrl);
  
  if (result.success) {
    return NextResponse.json({ success: true, id: result.id });
  }
  
  return NextResponse.json(
    { success: false, error: result.error },
    { status: 500 }
  );
}
```

## Best Practices

1. **Always validate email addresses** before sending
   ```typescript
   import { isValidEmail } from '@/lib/email/send';
   
   if (!isValidEmail(email)) {
     throw new Error('Invalid email address');
   }
   ```

2. **Use tags for tracking** email performance in Resend dashboard
   ```typescript
   tags: [
     { name: 'type', value: 'welcome' },
     { name: 'user_id', value: userId }
   ]
   ```

3. **Handle errors gracefully**
   ```typescript
   const result = await sendEmail(options);
   if (!result.success) {
     console.error('Email failed:', result.error);
     // Handle error appropriately
   }
   ```

4. **Use queue for bulk operations** to avoid rate limits
   ```typescript
   // Instead of sending 100 emails at once
   // Queue them for processing
   await emailQueue.addBatch(emails);
   ```

5. **Test in development** with preview mode
   ```typescript
   if (process.env.NODE_ENV === 'development') {
     console.log('Email preview:', getEmailPreviewUrl('welcome'));
   }
   ```

## Troubleshooting

### Common Issues

1. **"Invalid API Key"**
   - Verify your `RESEND_API_KEY` in `.env.local`
   - Ensure the key starts with `re_`

2. **"Domain not verified"**
   - Check domain verification status in Resend dashboard
   - Ensure DNS records are properly configured

3. **"Rate limit exceeded"**
   - Use the email queue for bulk sending
   - Implement exponential backoff for retries

4. **"Email not delivered"**
   - Check spam folder
   - Verify sender domain reputation
   - Review email content for spam triggers

### Debug Mode

Enable debug logging:

```typescript
// In your email sending code
if (process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true') {
  console.log('Sending email:', {
    to: options.to,
    subject: options.subject,
    tags: options.tags
  });
}
```

## Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email/docs)
- [Email Best Practices](https://resend.com/docs/best-practices)
- [Deliverability Guide](https://resend.com/docs/deliverability)

## Support

For issues or questions about the email system:
1. Check this README and troubleshooting section
2. Review Resend dashboard for delivery status
3. Contact the development team

## License

This email system is part of the Omni E-Ride platform and follows the same license terms.
