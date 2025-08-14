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

interface LeadDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  interestedIn: string;
  budget?: string;
  timeframe?: string;
  message?: string;
  source: string;
  createdAt: string;
  score?: number; // Lead quality score
}

interface LeadAssignmentEmailProps {
  dealerName: string;
  dealerContactName: string;
  lead: LeadDetails;
  assignmentDeadline: string;
  leadManagementUrl: string;
  acceptUrl?: string;
  declineUrl?: string;
  previousInteractions?: number;
  estimatedValue?: number;
}

export const LeadAssignmentEmail: React.FC<LeadAssignmentEmailProps> = ({
  dealerName,
  dealerContactName = 'Partner',
  lead,
  assignmentDeadline,
  leadManagementUrl,
  acceptUrl,
  declineUrl,
  previousInteractions = 0,
  estimatedValue,
}) => {
  const preview = `New lead assigned: ${lead.name} - Interested in ${lead.interestedIn}`;

  const getLeadScoreColor = (score?: number) => {
    if (!score) return '#6c757d';
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFA500';
    return '#FF9800';
  };

  const getLeadScoreLabel = (score?: number) => {
    if (!score) return 'Not Scored';
    if (score >= 80) return 'Hot Lead 🔥';
    if (score >= 60) return 'Warm Lead 🌟';
    return 'Cold Lead ❄️';
  };

  return (
    <EmailLayout preview={preview}>
      <Section style={content}>
        <Text style={alertIcon}>🎯</Text>
        
        <Heading style={heading}>New Lead Assigned!</Heading>
        
        <Text style={paragraph}>
          Hi {dealerContactName},
        </Text>
        
        <Text style={paragraph}>
          A new lead has been assigned to <strong>{dealerName}</strong>. Please review the details 
          below and take action before the deadline.
        </Text>
        
        <Section style={urgentBox}>
          <Text style={urgentLabel}>⏰ Response Deadline:</Text>
          <Text style={urgentValue}>{assignmentDeadline}</Text>
          <Text style={urgentNote}>
            Please contact this lead within 24 hours for best conversion rates
          </Text>
        </Section>
        
        <Section style={leadCard}>
          <Row>
            <Column>
              <Heading style={cardHeading}>Lead Information</Heading>
            </Column>
            <Column style={scoreCol}>
              {lead.score !== undefined && (
                <Text style={{
                  ...scoreText,
                  color: getLeadScoreColor(lead.score),
                }}>
                  {getLeadScoreLabel(lead.score)}
                </Text>
              )}
            </Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={labelCol}>
              <Text style={label}>Name:</Text>
            </Column>
            <Column style={valueCol}>
              <Text style={value}>{lead.name}</Text>
            </Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={labelCol}>
              <Text style={label}>Email:</Text>
            </Column>
            <Column style={valueCol}>
              <Link href={`mailto:${lead.email}`} style={link}>
                {lead.email}
              </Link>
            </Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={labelCol}>
              <Text style={label}>Phone:</Text>
            </Column>
            <Column style={valueCol}>
              <Link href={`tel:${lead.phone}`} style={link}>
                {lead.phone}
              </Link>
            </Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={labelCol}>
              <Text style={label}>Location:</Text>
            </Column>
            <Column style={valueCol}>
              <Text style={value}>{lead.location}</Text>
            </Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={labelCol}>
              <Text style={label}>Interested In:</Text>
            </Column>
            <Column style={valueCol}>
              <Text style={highlightValue}>{lead.interestedIn}</Text>
            </Column>
          </Row>
          
          {lead.budget && (
            <Row style={detailRow}>
              <Column style={labelCol}>
                <Text style={label}>Budget:</Text>
              </Column>
              <Column style={valueCol}>
                <Text style={value}>{lead.budget}</Text>
              </Column>
            </Row>
          )}
          
          {lead.timeframe && (
            <Row style={detailRow}>
              <Column style={labelCol}>
                <Text style={label}>Purchase Timeframe:</Text>
              </Column>
              <Column style={valueCol}>
                <Text style={value}>{lead.timeframe}</Text>
              </Column>
            </Row>
          )}
          
          <Row style={detailRow}>
            <Column style={labelCol}>
              <Text style={label}>Lead Source:</Text>
            </Column>
            <Column style={valueCol}>
              <Text style={value}>{lead.source}</Text>
            </Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={labelCol}>
              <Text style={label}>Submitted:</Text>
            </Column>
            <Column style={valueCol}>
              <Text style={value}>{lead.createdAt}</Text>
            </Column>
          </Row>
        </Section>
        
        {lead.message && (
          <Section style={messageBox}>
            <Text style={messageLabel}>Customer Message:</Text>
            <Text style={messageText}>"{lead.message}"</Text>
          </Section>
        )}
        
        {(previousInteractions > 0 || estimatedValue) && (
          <Section style={insightsBox}>
            <Heading style={insightsHeading}>Lead Insights</Heading>
            
            {previousInteractions > 0 && (
              <Text style={insightItem}>
                📊 Previous Interactions: <strong>{previousInteractions}</strong>
              </Text>
            )}
            
            {estimatedValue && (
              <Text style={insightItem}>
                💰 Estimated Deal Value: <strong>₹{estimatedValue.toLocaleString('en-IN')}</strong>
              </Text>
            )}
            
            {lead.score && lead.score >= 80 && (
              <Text style={insightItem}>
                ⚡ High Priority: This lead shows strong buying signals
              </Text>
            )}
          </Section>
        )}
        
        <Section style={actionButtons}>
          {acceptUrl && (
            <Button style={acceptButton} href={acceptUrl}>
              Accept Lead
            </Button>
          )}
          {declineUrl && (
            <Button style={declineButton} href={declineUrl}>
              Decline Lead
            </Button>
          )}
        </Section>
        
        <Section style={buttonContainer}>
          <Button style={secondaryButton} href={leadManagementUrl}>
            View in Lead Management Portal
          </Button>
        </Section>
        
        <Hr style={hr} />
        
        <Heading style={tipsHeading}>Quick Tips for Success</Heading>
        
        <Section style={tipsBox}>
          <Text style={tipItem}>
            ✓ Contact within 1 hour - leads contacted quickly are 7x more likely to convert
          </Text>
          <Text style={tipItem}>
            ✓ Send a personalized email immediately if you can't call right away
          </Text>
          <Text style={tipItem}>
            ✓ Reference their specific vehicle interest in your first contact
          </Text>
          <Text style={tipItem}>
            ✓ Offer a test ride appointment in your initial outreach
          </Text>
          <Text style={tipItem}>
            ✓ Log all interactions in the dealer portal for tracking
          </Text>
        </Section>
        
        <Text style={footerText}>
          Need help with this lead? Contact dealer support at{' '}
          <Link href="mailto:dealer-support@omni-e-ride.com" style={link}>
            dealer-support@omni-e-ride.com
          </Link>
        </Text>
        
        <Text style={paragraph}>
          Good luck with your new lead!<br />
          The Omni E-Ride Sales Team
        </Text>
      </Section>
    </EmailLayout>
  );
};

LeadAssignmentEmail.PreviewProps = {
  dealerName: 'Omni E-Ride Mumbai Central',
  dealerContactName: 'Rajesh',
  lead: {
    id: 'LEAD-2024-001234',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91 98765 43210',
    location: 'Mumbai, Maharashtra',
    interestedIn: 'Omni E-Bike Pro - Model X',
    budget: '₹80,000 - ₹1,00,000',
    timeframe: 'Within 1 month',
    message: 'I am interested in the Omni E-Bike Pro. Can you share more details about the battery life and warranty? Also, do you have EMI options available?',
    source: 'Website - Product Page',
    createdAt: 'January 15, 2024 at 2:30 PM',
    score: 85,
  },
  assignmentDeadline: 'January 16, 2024 at 2:30 PM',
  leadManagementUrl: 'https://dealers.omni-e-ride.com/leads/LEAD-2024-001234',
  acceptUrl: 'https://dealers.omni-e-ride.com/leads/LEAD-2024-001234/accept',
  declineUrl: 'https://dealers.omni-e-ride.com/leads/LEAD-2024-001234/decline',
  previousInteractions: 3,
  estimatedValue: 95000,
} as LeadAssignmentEmailProps;

export default LeadAssignmentEmail;

// Styles
const content = {
  padding: '40px 32px',
};

const alertIcon = {
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

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#3c4043',
  margin: '16px 0',
};

const urgentBox = {
  backgroundColor: '#fff3e0',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '2px solid #ff9800',
  textAlign: 'center' as const,
};

const urgentLabel = {
  fontSize: '14px',
  color: '#e65100',
  margin: '0 0 8px',
  fontWeight: '600',
};

const urgentValue = {
  fontSize: '20px',
  color: '#e65100',
  margin: '0 0 8px',
  fontWeight: '700',
};

const urgentNote = {
  fontSize: '13px',
  color: '#6c757d',
  margin: '8px 0 0',
  fontStyle: 'italic' as const,
};

const leadCard = {
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

const scoreCol = {
  textAlign: 'right' as const,
};

const scoreText = {
  fontSize: '16px',
  fontWeight: '700',
  margin: '0',
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
  fontSize: '15px',
  color: '#1a1a1a',
  margin: '0',
};

const highlightValue = {
  fontSize: '15px',
  color: '#1a1a1a',
  margin: '0',
  fontWeight: '600',
};

const messageBox = {
  backgroundColor: '#e3f2fd',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  borderLeft: '4px solid #2196f3',
};

const messageLabel = {
  fontSize: '14px',
  color: '#1565c0',
  margin: '0 0 8px',
  fontWeight: '600',
};

const messageText = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#3c4043',
  margin: '0',
  fontStyle: 'italic' as const,
};

const insightsBox = {
  backgroundColor: '#f3e5f5',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const insightsHeading = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#6a1b9a',
  margin: '0 0 12px',
};

const insightItem = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#3c4043',
  margin: '6px 0',
};

const actionButtons = {
  display: 'flex',
  gap: '16px',
  justifyContent: 'center',
  margin: '32px 0',
};

const acceptButton = {
  backgroundColor: '#4CAF50',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  border: 'none',
};

const declineButton = {
  backgroundColor: '#f44336',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  border: 'none',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
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

const hr = {
  borderColor: '#e9ecef',
  margin: '32px 0',
};

const tipsHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const tipsBox = {
  backgroundColor: '#e8f5e9',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0 24px',
};

const tipItem = {
  fontSize: '14px',
  lineHeight: '26px',
  color: '#2e7d32',
  margin: '6px 0',
};

const footerText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#6c757d',
  margin: '24px 0 16px',
  textAlign: 'center' as const,
};

const link = {
  color: '#0066cc',
  textDecoration: 'underline',
};
