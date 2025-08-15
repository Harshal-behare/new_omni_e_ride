import * as React from 'react';
import {
  Button,
  Column,
  Heading,
  Hr,
  Row,
  Section,
  Text,
  Link,
} from '@react-email/components';
import { EmailLayout } from './components/layout';

interface OrderItem {
  id: string;
  name: string;
  variant?: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  estimatedDelivery?: string;
  trackingUrl?: string;
}

export const OrderConfirmationEmail: React.FC<OrderConfirmationEmailProps> = ({
  customerName = 'Customer',
  orderNumber,
  orderDate,
  items = [],
  subtotal,
  tax,
  shipping,
  total,
  shippingAddress,
  estimatedDelivery,
  trackingUrl,
}) => {
  const preview = `Order #${orderNumber} confirmed - Omni E-Ride`;

  return (
    <EmailLayout preview={preview}>
      <Section style={content}>
        <Heading style={heading}>Order Confirmed! ✓</Heading>
        
        <Text style={paragraph}>
          Hi {customerName},
        </Text>
        
        <Text style={paragraph}>
          Thank you for your order! We've received your purchase and it's being processed. 
          You'll receive another email when your order ships.
        </Text>
        
        <Section style={orderInfo}>
          <Row>
            <Column>
              <Text style={label}>Order Number:</Text>
              <Text style={value}>{orderNumber}</Text>
            </Column>
            <Column>
              <Text style={label}>Order Date:</Text>
              <Text style={value}>{orderDate}</Text>
            </Column>
          </Row>
          {estimatedDelivery && (
            <Row>
              <Column>
                <Text style={label}>Estimated Delivery:</Text>
                <Text style={value}>{estimatedDelivery}</Text>
              </Column>
            </Row>
          )}
        </Section>

        {trackingUrl && (
          <Section style={buttonContainer}>
            <Button style={button} href={trackingUrl}>
              Track Your Order
            </Button>
          </Section>
        )}
        
        <Heading style={subheading}>Order Details</Heading>
        
        <Section style={itemsContainer}>
          {items.map((item) => (
            <Row key={item.id} style={itemRow}>
              <Column style={itemDetails}>
                <Text style={itemName}>{item.name}</Text>
                {item.variant && (
                  <Text style={itemVariant}>{item.variant}</Text>
                )}
                <Text style={itemQuantity}>Quantity: {item.quantity}</Text>
              </Column>
              <Column style={itemPriceCol}>
                <Text style={itemPrice}>₹{item.price.toLocaleString('en-IN')}</Text>
              </Column>
            </Row>
          ))}
        </Section>
        
        <Hr style={hr} />
        
        <Section style={summary}>
          <Row style={summaryRow}>
            <Column>
              <Text style={summaryLabel}>Subtotal:</Text>
            </Column>
            <Column style={summaryValueCol}>
              <Text style={summaryValue}>₹{subtotal.toLocaleString('en-IN')}</Text>
            </Column>
          </Row>
          <Row style={summaryRow}>
            <Column>
              <Text style={summaryLabel}>Tax:</Text>
            </Column>
            <Column style={summaryValueCol}>
              <Text style={summaryValue}>₹{tax.toLocaleString('en-IN')}</Text>
            </Column>
          </Row>
          <Row style={summaryRow}>
            <Column>
              <Text style={summaryLabel}>Shipping:</Text>
            </Column>
            <Column style={summaryValueCol}>
              <Text style={summaryValue}>
                {shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`}
              </Text>
            </Column>
          </Row>
          <Hr style={hrLight} />
          <Row style={summaryRow}>
            <Column>
              <Text style={totalLabel}>Total:</Text>
            </Column>
            <Column style={summaryValueCol}>
              <Text style={totalValue}>₹{total.toLocaleString('en-IN')}</Text>
            </Column>
          </Row>
        </Section>
        
        <Heading style={subheading}>Shipping Address</Heading>
        
        <Section style={addressBox}>
          <Text style={addressText}>
            {shippingAddress.street}<br />
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}<br />
            {shippingAddress.country}
          </Text>
        </Section>
        
        <Text style={paragraph}>
          Have questions about your order? Visit our{' '}
          <Link href="https://omni-e-ride.com/help" style={link}>
            Help Center
          </Link>{' '}
          or contact our customer support team.
        </Text>
        
        <Text style={paragraph}>
          Thank you for choosing Omni E-Ride!<br />
          The Omni E-Ride Team
        </Text>
      </Section>
    </EmailLayout>
  );
};

export const OrderConfirmationEmailPreviewProps = {
  customerName: 'John Doe',
  orderNumber: 'ORD-2024-001234',
  orderDate: 'January 15, 2024',
  items: [
    {
      id: '1',
      name: 'Omni E-Bike Pro',
      variant: 'Color: Black, Battery: 48V',
      quantity: 1,
      price: 85000,
    },
    {
      id: '2',
      name: 'Safety Helmet',
      variant: 'Size: L',
      quantity: 1,
      price: 1500,
    },
  ],
  subtotal: 86500,
  tax: 15570,
  shipping: 0,
  total: 102070,
  shippingAddress: {
    street: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
  },
  estimatedDelivery: 'January 22-25, 2024',
  trackingUrl: 'https://omni-e-ride.com/track/ORD-2024-001234',
} as OrderConfirmationEmailProps;

export default OrderConfirmationEmail;

// Styles
const content = {
  padding: '40px 32px',
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
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#3c4043',
  margin: '16px 0',
};

const orderInfo = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const label = {
  fontSize: '14px',
  color: '#6c757d',
  margin: '0 0 4px',
};

const value = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0',
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

const itemsContainer = {
  margin: '16px 0',
};

const itemRow = {
  borderBottom: '1px solid #e9ecef',
  padding: '16px 0',
};

const itemDetails = {
  width: '70%',
};

const itemName = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 4px',
};

const itemVariant = {
  fontSize: '14px',
  color: '#6c757d',
  margin: '0 0 4px',
};

const itemQuantity = {
  fontSize: '14px',
  color: '#6c757d',
  margin: '0',
};

const itemPriceCol = {
  width: '30%',
  textAlign: 'right' as const,
};

const itemPrice = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0',
};

const hr = {
  borderColor: '#e9ecef',
  margin: '24px 0',
};

const hrLight = {
  borderColor: '#f0f0f0',
  margin: '12px 0',
};

const summary = {
  margin: '16px 0',
};

const summaryRow = {
  padding: '8px 0',
};

const summaryLabel = {
  fontSize: '15px',
  color: '#6c757d',
  margin: '0',
};

const summaryValue = {
  fontSize: '15px',
  color: '#1a1a1a',
  margin: '0',
  textAlign: 'right' as const,
};

const summaryValueCol = {
  textAlign: 'right' as const,
};

const totalLabel = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0',
};

const totalValue = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#4CAF50',
  margin: '0',
  textAlign: 'right' as const,
};

const addressBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0 24px',
};

const addressText = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#3c4043',
  margin: '0',
};

const link = {
  color: '#0066cc',
  textDecoration: 'underline',
};
