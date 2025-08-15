import * as React from 'react';
import {
  Button,
  Heading,
  Section,
  Text,
  Link,
} from '@react-email/components';
import { EmailLayout } from './components/layout';

interface WelcomeEmailProps {
  firstName: string;
  email: string;
  verificationUrl?: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  firstName = 'User',
  email,
  verificationUrl,
}) => {
  const preview = `Welcome to Omni E-Ride, ${firstName}!`;

  return (
    <EmailLayout preview={preview}>
      <Section style={content}>
        <Heading style={heading}>Welcome to Omni E-Ride! 🎉</Heading>
        
        <Text style={paragraph}>
          Hi {firstName},
        </Text>
        
        <Text style={paragraph}>
          Thank you for joining Omni E-Ride! We're thrilled to have you as part of our community 
          of electric vehicle enthusiasts. Your account has been successfully created with the 
          email address: <strong>{email}</strong>
        </Text>

        {verificationUrl && (
          <>
            <Text style={paragraph}>
              Please verify your email address to get started:
            </Text>
            
            <Section style={buttonContainer}>
              <Button style={button} href={verificationUrl}>
                Verify Email Address
              </Button>
            </Section>
            
            <Text style={smallText}>
              Or copy and paste this link into your browser:{' '}
              <Link href={verificationUrl} style={link}>
                {verificationUrl}
              </Link>
            </Text>
          </>
        )}
        
        <Text style={paragraph}>
          Here's what you can do with your Omni E-Ride account:
        </Text>
        
        <Section style={features}>
          <Text style={featureItem}>
            ✅ Browse our extensive catalog of electric vehicles
          </Text>
          <Text style={featureItem}>
            ✅ Schedule test rides at your convenience
          </Text>
          <Text style={featureItem}>
            ✅ Track your orders and delivery status
          </Text>
          <Text style={featureItem}>
            ✅ Access exclusive member benefits and discounts
          </Text>
          <Text style={featureItem}>
            ✅ Connect with our dealer network
          </Text>
        </Section>
        
        <Text style={paragraph}>
          Need help getting started? Check out our{' '}
          <Link href="https://omni-e-ride.com/help" style={link}>
            Help Center
          </Link>{' '}
          or reply to this email - we're here to help!
        </Text>
        
        <Text style={paragraph}>
          Welcome aboard,<br />
          The Omni E-Ride Team
        </Text>
      </Section>
    </EmailLayout>
  );
};

export const WelcomeEmailPreviewProps = {
  firstName: 'John',
  email: 'john.doe@example.com',
  verificationUrl: 'https://omni-e-ride.com/verify?token=abc123',
} as WelcomeEmailProps;

export default WelcomeEmail;

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

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#3c4043',
  margin: '16px 0',
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

const smallText = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#6c757d',
  margin: '8px 0',
};

const link = {
  color: '#0066cc',
  textDecoration: 'underline',
};

const features = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const featureItem = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#3c4043',
  margin: '8px 0',
};
