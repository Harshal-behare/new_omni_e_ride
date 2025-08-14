import * as React from 'react';
import {
  Button,
  Heading,
  Section,
  Text,
  Link,
} from '@react-email/components';
import { EmailLayout } from './components/layout';

export type OrderStatus = 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';

interface OrderStatusUpdateEmailProps {
  customerName: string;
  orderNumber: string;
  status: OrderStatus;
  statusMessage?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  deliveryDate?: string;
  reason?: string; // For cancellation
}

const statusConfig: Record<OrderStatus, {
  title: string;
  icon: string;
  color: string;
  defaultMessage: string;
}> = {
  processing: {
    title: 'Order Being Processed',
    icon: '⚙️',
    color: '#FFA500',
    defaultMessage: 'Your order is being prepared for shipment. We\'ll notify you once it ships.',
  },
  shipped: {
    title: 'Order Shipped!',
    icon: '📦',
    color: '#4CAF50',
    defaultMessage: 'Great news! Your order has been shipped and is on its way to you.',
  },
  out_for_delivery: {
    title: 'Out for Delivery',
    icon: '🚚',
    color: '#2196F3',
    defaultMessage: 'Your order is out for delivery today! Please ensure someone is available to receive it.',
  },
  delivered: {
    title: 'Order Delivered!',
    icon: '✅',
    color: '#4CAF50',
    defaultMessage: 'Your order has been successfully delivered. We hope you enjoy your purchase!',
  },
  cancelled: {
    title: 'Order Cancelled',
    icon: '❌',
    color: '#F44336',
    defaultMessage: 'Your order has been cancelled. If you have any questions, please contact our support team.',
  },
};

export const OrderStatusUpdateEmail: React.FC<OrderStatusUpdateEmailProps> = ({
  customerName = 'Customer',
  orderNumber,
  status,
  statusMessage,
  trackingNumber,
  trackingUrl,
  deliveryDate,
  reason,
}) => {
  const config = statusConfig[status];
  const preview = `Order #${orderNumber} - ${config.title}`;

  return (
    <EmailLayout preview={preview}>
      <Section style={content}>
        <Text style={iconStyle}>{config.icon}</Text>
        
        <Heading style={heading}>{config.title}</Heading>
        
        <Text style={paragraph}>
          Hi {customerName},
        </Text>
        
        <Text style={paragraph}>
          {statusMessage || config.defaultMessage}
        </Text>
        
        <Section style={orderInfoBox}>
          <Text style={orderLabel}>Order Number</Text>
          <Text style={orderValue}>{orderNumber}</Text>
          
          {trackingNumber && (
            <>
              <Text style={orderLabel}>Tracking Number</Text>
              <Text style={orderValue}>{trackingNumber}</Text>
            </>
          )}
          
          {deliveryDate && (
            <>
              <Text style={orderLabel}>
                {status === 'delivered' ? 'Delivered On' : 'Expected Delivery'}
              </Text>
              <Text style={orderValue}>{deliveryDate}</Text>
            </>
          )}
          
          {reason && status === 'cancelled' && (
            <>
              <Text style={orderLabel}>Cancellation Reason</Text>
              <Text style={orderValue}>{reason}</Text>
            </>
          )}
        </Section>
        
        {trackingUrl && status !== 'cancelled' && status !== 'delivered' && (
          <Section style={buttonContainer}>
            <Button style={button} href={trackingUrl}>
              Track Your Order
            </Button>
          </Section>
        )}
        
        {status === 'delivered' && (
          <>
            <Heading style={subheading}>How was your experience?</Heading>
            <Text style={paragraph}>
              We'd love to hear your feedback! Please take a moment to rate your purchase and 
              delivery experience.
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={`https://omni-e-ride.com/orders/${orderNumber}/review`}>
                Leave a Review
              </Button>
            </Section>
          </>
        )}
        
        {status === 'cancelled' && (
          <>
            <Text style={paragraph}>
              If you paid for this order, a refund will be processed within 5-7 business days. 
              You'll receive a confirmation email once the refund is initiated.
            </Text>
            <Section style={buttonContainer}>
              <Button style={secondaryButton} href="https://omni-e-ride.com/shop">
                Continue Shopping
              </Button>
            </Section>
          </>
        )}
        
        <Text style={paragraph}>
          Need help? Visit our{' '}
          <Link href="https://omni-e-ride.com/help" style={link}>
            Help Center
          </Link>{' '}
          or reply to this email to contact our support team.
        </Text>
        
        <Text style={paragraph}>
          Thank you for choosing Omni E-Ride!<br />
          The Omni E-Ride Team
        </Text>
      </Section>
    </EmailLayout>
  );
};

OrderStatusUpdateEmail.PreviewProps = {
  customerName: 'John Doe',
  orderNumber: 'ORD-2024-001234',
  status: 'shipped',
  trackingNumber: 'TRK123456789',
  trackingUrl: 'https://tracking.example.com/TRK123456789',
  deliveryDate: 'January 22, 2024',
} as OrderStatusUpdateEmailProps;

export default OrderStatusUpdateEmail;

// Styles
const content = {
  padding: '40px 32px',
};

const iconStyle = {
  fontSize: '48px',
  textAlign: 'center' as const,
  margin: '0 0 16px',
};

const heading = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const subheading = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '32px 0 16px',
  textAlign: 'center' as const,
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#3c4043',
  margin: '16px 0',
};

const orderInfoBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const orderLabel = {
  fontSize: '14px',
  color: '#6c757d',
  margin: '12px 0 4px',
  fontWeight: '500',
};

const orderValue = {
  fontSize: '16px',
  color: '#1a1a1a',
  margin: '0 0 12px',
  fontWeight: '600',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#4CAF50',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  border: 'none',
};

const secondaryButton = {
  backgroundColor: '#6c757d',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  border: 'none',
};

const link = {
  color: '#0066cc',
  textDecoration: 'underline',
};
