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

interface TestRideConfirmationEmailProps {
  customerName: string;
  bookingId: string;
  vehicleName: string;
  vehicleModel?: string;
  date: string;
  time: string;
  dealerName: string;
  dealerAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  dealerPhone: string;
  dealerEmail?: string;
  mapUrl?: string;
  cancellationUrl?: string;
  rescheduleUrl?: string;
  notes?: string;
}

export const TestRideConfirmationEmail: React.FC<TestRideConfirmationEmailProps> = ({
  customerName = 'Customer',
  bookingId,
  vehicleName,
  vehicleModel,
  date,
  time,
  dealerName,
  dealerAddress,
  dealerPhone,
  dealerEmail,
  mapUrl,
  cancellationUrl,
  rescheduleUrl,
  notes,
}) => {
  const preview = `Test ride confirmed for ${date} - Omni E-Ride`;

  return (
    <EmailLayout preview={preview}>
      <Section style={content}>
        <Text style={iconStyle}>🏍️</Text>
        
        <Heading style={heading}>Test Ride Confirmed!</Heading>
        
        <Text style={paragraph}>
          Hi {customerName},
        </Text>
        
        <Text style={paragraph}>
          Great news! Your test ride has been confirmed. We're excited for you to experience 
          the {vehicleName} {vehicleModel && `(${vehicleModel})`}. Please arrive 10 minutes 
          early for a brief safety orientation.
        </Text>
        
        <Section style={bookingCard}>
          <Heading style={cardHeading}>Booking Details</Heading>
          
          <Row style={detailRow}>
            <Column style={labelCol}>
              <Text style={label}>Booking ID:</Text>
            </Column>
            <Column style={valueCol}>
              <Text style={value}>{bookingId}</Text>
            </Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={labelCol}>
              <Text style={label}>Vehicle:</Text>
            </Column>
            <Column style={valueCol}>
              <Text style={value}>
                {vehicleName}
                {vehicleModel && <><br />{vehicleModel}</>}
              </Text>
            </Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={labelCol}>
              <Text style={label}>Date:</Text>
            </Column>
            <Column style={valueCol}>
              <Text style={value}>{date}</Text>
            </Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={labelCol}>
              <Text style={label}>Time:</Text>
            </Column>
            <Column style={valueCol}>
              <Text style={value}>{time}</Text>
            </Column>
          </Row>
        </Section>
        
        <Section style={dealerCard}>
          <Heading style={cardHeading}>Dealer Location</Heading>
          
          <Text style={dealerNameText}>{dealerName}</Text>
          
          <Text style={addressText}>
            {dealerAddress.street}<br />
            {dealerAddress.city}, {dealerAddress.state} {dealerAddress.postalCode}
          </Text>
          
          <Text style={contactText}>
            Phone: <Link href={`tel:${dealerPhone}`} style={link}>{dealerPhone}</Link>
            {dealerEmail && (
              <>
                <br />
                Email: <Link href={`mailto:${dealerEmail}`} style={link}>{dealerEmail}</Link>
              </>
            )}
          </Text>
          
          {mapUrl && (
            <Section style={buttonContainer}>
              <Button style={secondaryButton} href={mapUrl}>
                Get Directions
              </Button>
            </Section>
          )}
        </Section>
        
        {notes && (
          <Section style={notesSection}>
            <Text style={notesLabel}>Additional Notes:</Text>
            <Text style={notesText}>{notes}</Text>
          </Section>
        )}
        
        <Heading style={subheading}>What to Bring</Heading>
        
        <Section style={checklistSection}>
          <Text style={checklistItem}>✓ Valid driver's license</Text>
          <Text style={checklistItem}>✓ Government-issued photo ID</Text>
          <Text style={checklistItem}>✓ Closed-toe shoes</Text>
          <Text style={checklistItem}>✓ Comfortable clothing suitable for riding</Text>
        </Section>
        
        <Text style={importantText}>
          <strong>Important:</strong> Helmets and safety gear will be provided at the dealership. 
          Please arrive sober and ready for a safety briefing before your test ride.
        </Text>
        
        <Row style={actionButtons}>
          {rescheduleUrl && (
            <Column style={buttonCol}>
              <Button style={outlineButton} href={rescheduleUrl}>
                Reschedule
              </Button>
            </Column>
          )}
          {cancellationUrl && (
            <Column style={buttonCol}>
              <Button style={outlineButton} href={cancellationUrl}>
                Cancel Booking
              </Button>
            </Column>
          )}
        </Row>
        
        <Hr style={hr} />
        
        <Text style={paragraph}>
          Need help? Contact us at{' '}
          <Link href="mailto:support@omni-e-ride.com" style={link}>
            support@omni-e-ride.com
          </Link>{' '}
          or call our helpline.
        </Text>
        
        <Text style={paragraph}>
          Safe riding!<br />
          The Omni E-Ride Team
        </Text>
      </Section>
    </EmailLayout>
  );
};

export const TestRideConfirmationEmailPreviewProps = {
  customerName: 'John Doe',
  bookingId: 'TR-2024-001234',
  vehicleName: 'Omni E-Bike Pro',
  vehicleModel: 'Model X - 48V Battery',
  date: 'Saturday, January 20, 2024',
  time: '10:00 AM - 11:00 AM',
  dealerName: 'Omni E-Ride Mumbai Central',
  dealerAddress: {
    street: '456 MG Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
  },
  dealerPhone: '+91 98765 43210',
  dealerEmail: 'mumbai.central@omni-e-ride.com',
  mapUrl: 'https://maps.google.com/?q=Omni+E-Ride+Mumbai',
  cancellationUrl: 'https://omni-e-ride.com/bookings/TR-2024-001234/cancel',
  rescheduleUrl: 'https://omni-e-ride.com/bookings/TR-2024-001234/reschedule',
  notes: 'Please park in the visitor parking area near the main entrance.',
} as TestRideConfirmationEmailProps;

export default TestRideConfirmationEmail;

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
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#3c4043',
  margin: '16px 0',
};

const bookingCard = {
  backgroundColor: '#e8f5e9',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #c8e6c9',
};

const dealerCard = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const cardHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 16px',
};

const detailRow = {
  margin: '12px 0',
};

const labelCol = {
  width: '35%',
};

const valueCol = {
  width: '65%',
};

const label = {
  fontSize: '14px',
  color: '#6c757d',
  margin: '0',
  fontWeight: '500',
};

const value = {
  fontSize: '16px',
  color: '#1a1a1a',
  margin: '0',
  fontWeight: '600',
};

const dealerNameText = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 8px',
};

const addressText = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#3c4043',
  margin: '8px 0',
};

const contactText = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#3c4043',
  margin: '8px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '20px 0 0',
};

const secondaryButton = {
  backgroundColor: '#2196F3',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
  border: 'none',
};

const notesSection = {
  backgroundColor: '#fff9c4',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  border: '1px solid #f9e082',
};

const notesLabel = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#f57c00',
  margin: '0 0 8px',
};

const notesText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#3c4043',
  margin: '0',
};

const checklistSection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0 24px',
};

const checklistItem = {
  fontSize: '15px',
  lineHeight: '28px',
  color: '#3c4043',
  margin: '4px 0',
};

const importantText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#d32f2f',
  backgroundColor: '#ffebee',
  padding: '12px',
  borderRadius: '6px',
  margin: '24px 0',
};

const actionButtons = {
  margin: '32px 0',
};

const buttonCol = {
  textAlign: 'center' as const,
  padding: '0 8px',
};

const outlineButton = {
  backgroundColor: 'transparent',
  borderRadius: '6px',
  border: '2px solid #6c757d',
  color: '#6c757d',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '8px 20px',
};

const hr = {
  borderColor: '#e9ecef',
  margin: '32px 0',
};

const link = {
  color: '#0066cc',
  textDecoration: 'underline',
};
