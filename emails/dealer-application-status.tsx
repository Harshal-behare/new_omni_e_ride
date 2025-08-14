import * as React from 'react';
import {
  Button,
  Heading,
  Hr,
  Section,
  Text,
  Link,
} from '@react-email/components';
import { EmailLayout } from './components/layout';

export type ApplicationStatus = 'received' | 'under_review' | 'approved' | 'rejected' | 'additional_info_required';

interface DealerApplicationStatusEmailProps {
  applicantName: string;
  businessName: string;
  applicationId: string;
  status: ApplicationStatus;
  submittedDate: string;
  reviewNotes?: string;
  rejectionReason?: string;
  requiredDocuments?: string[];
  dealerPortalUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  nextSteps?: string[];
}

const statusConfig: Record<ApplicationStatus, {
  title: string;
  icon: string;
  color: string;
  defaultMessage: string;
}> = {
  received: {
    title: 'Application Received',
    icon: '📋',
    color: '#2196F3',
    defaultMessage: 'Thank you for your interest in becoming an Omni E-Ride dealer. We have received your application and it will be reviewed by our team shortly.',
  },
  under_review: {
    title: 'Application Under Review',
    icon: '🔍',
    color: '#FFA500',
    defaultMessage: 'Your dealer application is currently being reviewed by our partnership team. We appreciate your patience during this process.',
  },
  approved: {
    title: 'Application Approved!',
    icon: '🎉',
    color: '#4CAF50',
    defaultMessage: 'Congratulations! Your dealer application has been approved. Welcome to the Omni E-Ride dealer network!',
  },
  rejected: {
    title: 'Application Not Approved',
    icon: '❌',
    color: '#F44336',
    defaultMessage: 'After careful review, we regret to inform you that your dealer application has not been approved at this time.',
  },
  additional_info_required: {
    title: 'Additional Information Required',
    icon: '📝',
    color: '#FF9800',
    defaultMessage: 'We need some additional information to continue processing your dealer application.',
  },
};

export const DealerApplicationStatusEmail: React.FC<DealerApplicationStatusEmailProps> = ({
  applicantName = 'Applicant',
  businessName,
  applicationId,
  status,
  submittedDate,
  reviewNotes,
  rejectionReason,
  requiredDocuments,
  dealerPortalUrl,
  contactEmail = 'dealer-support@omni-e-ride.com',
  contactPhone = '+91 1800-XXX-XXXX',
  nextSteps,
}) => {
  const config = statusConfig[status];
  const preview = `Dealer Application ${applicationId} - ${config.title}`;

  return (
    <EmailLayout preview={preview}>
      <Section style={content}>
        <Text style={iconStyle}>{config.icon}</Text>
        
        <Heading style={heading}>{config.title}</Heading>
        
        <Text style={paragraph}>
          Dear {applicantName},
        </Text>
        
        <Text style={paragraph}>
          {reviewNotes || config.defaultMessage}
        </Text>
        
        <Section style={applicationBox}>
          <Text style={detailLabel}>Application ID:</Text>
          <Text style={detailValue}>{applicationId}</Text>
          
          <Text style={detailLabel}>Business Name:</Text>
          <Text style={detailValue}>{businessName}</Text>
          
          <Text style={detailLabel}>Submitted Date:</Text>
          <Text style={detailValue}>{submittedDate}</Text>
          
          <Text style={detailLabel}>Current Status:</Text>
          <Text style={{...detailValue, color: config.color, fontWeight: '700'}}>
            {config.title}
          </Text>
        </Section>
        
        {status === 'approved' && (
          <>
            <Heading style={subheading}>Welcome to Omni E-Ride!</Heading>
            
            <Text style={paragraph}>
              As an approved dealer, you now have access to:
            </Text>
            
            <Section style={benefitsBox}>
              <Text style={benefitItem}>✓ Dealer Portal with inventory management</Text>
              <Text style={benefitItem}>✓ Exclusive dealer pricing and promotions</Text>
              <Text style={benefitItem}>✓ Marketing and sales support materials</Text>
              <Text style={benefitItem}>✓ Technical training and certification programs</Text>
              <Text style={benefitItem}>✓ Dedicated dealer support team</Text>
              <Text style={benefitItem}>✓ Lead generation and customer referrals</Text>
            </Section>
            
            {dealerPortalUrl && (
              <Section style={buttonContainer}>
                <Button style={button} href={dealerPortalUrl}>
                  Access Dealer Portal
                </Button>
              </Section>
            )}
            
            {nextSteps && nextSteps.length > 0 && (
              <>
                <Heading style={subheading}>Next Steps</Heading>
                <Section style={stepsBox}>
                  {nextSteps.map((step, index) => (
                    <Text key={index} style={stepItem}>
                      {index + 1}. {step}
                    </Text>
                  ))}
                </Section>
              </>
            )}
          </>
        )}
        
        {status === 'rejected' && rejectionReason && (
          <>
            <Section style={rejectionBox}>
              <Text style={rejectionLabel}>Reason for Decision:</Text>
              <Text style={rejectionText}>{rejectionReason}</Text>
            </Section>
            
            <Text style={paragraph}>
              We encourage you to address these concerns and reapply in the future. 
              Our team is available to discuss how you can strengthen your application.
            </Text>
          </>
        )}
        
        {status === 'additional_info_required' && requiredDocuments && (
          <>
            <Heading style={subheading}>Required Documents</Heading>
            
            <Text style={paragraph}>
              Please provide the following documents to continue with your application:
            </Text>
            
            <Section style={documentsBox}>
              {requiredDocuments.map((doc, index) => (
                <Text key={index} style={documentItem}>
                  • {doc}
                </Text>
              ))}
            </Section>
            
            <Text style={urgentText}>
              Please submit these documents within 7 business days to avoid delays in processing.
            </Text>
            
            {dealerPortalUrl && (
              <Section style={buttonContainer}>
                <Button style={button} href={dealerPortalUrl}>
                  Upload Documents
                </Button>
              </Section>
            )}
          </>
        )}
        
        {status === 'under_review' && (
          <>
            <Text style={paragraph}>
              Our review process typically takes 5-7 business days. We will notify you via email 
              once a decision has been made. In the meantime, you can track your application 
              status using your Application ID.
            </Text>
            
            <Section style={timelineBox}>
              <Text style={timelineItem}>📋 Application Received ✓</Text>
              <Text style={timelineItemActive}>🔍 Under Review (Current)</Text>
              <Text style={timelineItemPending}>📧 Decision Notification</Text>
            </Section>
          </>
        )}
        
        <Hr style={hr} />
        
        <Section style={contactSection}>
          <Heading style={contactHeading}>Need Assistance?</Heading>
          
          <Text style={contactText}>
            Our dealer support team is here to help you through the application process.
          </Text>
          
          <Text style={contactDetails}>
            Email: <Link href={`mailto:${contactEmail}`} style={link}>{contactEmail}</Link><br />
            Phone: <Link href={`tel:${contactPhone}`} style={link}>{contactPhone}</Link><br />
            Hours: Monday - Friday, 9:00 AM - 6:00 PM IST
          </Text>
        </Section>
        
        <Text style={paragraph}>
          Thank you for your interest in partnering with Omni E-Ride.<br />
          <br />
          Best regards,<br />
          The Omni E-Ride Partnership Team
        </Text>
      </Section>
    </EmailLayout>
  );
};

DealerApplicationStatusEmail.PreviewProps = {
  applicantName: 'Rajesh Kumar',
  businessName: 'Kumar Auto Sales',
  applicationId: 'DA-2024-001234',
  status: 'approved',
  submittedDate: 'January 10, 2024',
  dealerPortalUrl: 'https://dealers.omni-e-ride.com/login',
  nextSteps: [
    'Complete your dealer profile in the portal',
    'Schedule your onboarding call with our team',
    'Review and sign the dealer agreement',
    'Complete the online training modules',
    'Place your initial inventory order',
  ],
} as DealerApplicationStatusEmailProps;

export default DealerApplicationStatusEmail;

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

const applicationBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const detailLabel = {
  fontSize: '14px',
  color: '#6c757d',
  margin: '12px 0 4px',
  fontWeight: '500',
};

const detailValue = {
  fontSize: '16px',
  color: '#1a1a1a',
  margin: '0 0 12px',
  fontWeight: '600',
};

const benefitsBox = {
  backgroundColor: '#e8f5e9',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const benefitItem = {
  fontSize: '15px',
  lineHeight: '28px',
  color: '#2e7d32',
  margin: '4px 0',
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

const stepsBox = {
  backgroundColor: '#fff3e0',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0 24px',
};

const stepItem = {
  fontSize: '15px',
  lineHeight: '28px',
  color: '#3c4043',
  margin: '8px 0',
};

const rejectionBox = {
  backgroundColor: '#ffebee',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #ffcdd2',
};

const rejectionLabel = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#c62828',
  margin: '0 0 8px',
};

const rejectionText = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#3c4043',
  margin: '0',
};

const documentsBox = {
  backgroundColor: '#fff9c4',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
};

const documentItem = {
  fontSize: '15px',
  lineHeight: '28px',
  color: '#3c4043',
  margin: '4px 0',
};

const urgentText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#f57c00',
  fontWeight: '600',
  margin: '16px 0',
};

const timelineBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const timelineItem = {
  fontSize: '15px',
  lineHeight: '32px',
  color: '#6c757d',
  margin: '4px 0',
};

const timelineItemActive = {
  fontSize: '15px',
  lineHeight: '32px',
  color: '#1a1a1a',
  fontWeight: '600',
  margin: '4px 0',
};

const timelineItemPending = {
  fontSize: '15px',
  lineHeight: '32px',
  color: '#adb5bd',
  margin: '4px 0',
};

const hr = {
  borderColor: '#e9ecef',
  margin: '32px 0',
};

const contactSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const contactHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 12px',
};

const contactText = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#6c757d',
  margin: '8px 0',
};

const contactDetails = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#3c4043',
  margin: '12px 0',
};

const link = {
  color: '#0066cc',
  textDecoration: 'underline',
};
