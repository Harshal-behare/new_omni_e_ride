import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({
  preview,
  children,
}) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src="https://omni-e-ride.com/logo.png"
              width="150"
              height="50"
              alt="Omni E-Ride"
              style={logo}
            />
          </Section>
          
          {children}
          
          <Hr style={hr} />
          
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Omni E-Ride. All rights reserved.
            </Text>
            <Text style={footerLinks}>
              <Link href="https://omni-e-ride.com" style={link}>
                Website
              </Link>
              {' | '}
              <Link href="https://omni-e-ride.com/privacy" style={link}>
                Privacy Policy
              </Link>
              {' | '}
              <Link href="https://omni-e-ride.com/terms" style={link}>
                Terms of Service
              </Link>
            </Text>
            <Text style={address}>
              Omni E-Ride Pvt. Ltd.<br />
              123 Business District<br />
              Mumbai, Maharashtra 400001<br />
              India
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
};

const header = {
  padding: '24px 32px',
  backgroundColor: '#f8f9fa',
  borderBottom: '1px solid #e9ecef',
};

const logo = {
  margin: '0 auto',
  display: 'block',
};

const hr = {
  borderColor: '#e9ecef',
  margin: '32px 0',
};

const footer = {
  padding: '24px 32px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6c757d',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 10px 0',
};

const footerLinks = {
  color: '#6c757d',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 10px 0',
};

const link = {
  color: '#0066cc',
  textDecoration: 'underline',
};

const address = {
  color: '#999999',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '16px 0 0 0',
};
