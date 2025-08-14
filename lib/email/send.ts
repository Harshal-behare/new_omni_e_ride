import { Resend } from 'resend';
import { ReactElement } from 'react';

// Initialize Resend with API key from environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender email
const DEFAULT_FROM = process.env.EMAIL_FROM || 'Omni E-Ride <noreply@omni-e-ride.com>';

// Email sending options
export interface EmailOptions {
  to: string | string[];
  subject: string;
  react?: ReactElement;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    type?: string;
    disposition?: 'attachment' | 'inline';
  }>;
  tags?: Array<{
    name: string;
    value: string;
  }>;
  headers?: Record<string, string>;
}

// Response type for sent emails
export interface EmailResponse {
  id: string;
  success: boolean;
  error?: string;
}

/**
 * Send an email using Resend
 * @param options Email sending options
 * @returns Promise with email response
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
  try {
    // Validate required fields
    if (!options.to) {
      throw new Error('Recipient email address is required');
    }
    
    if (!options.subject) {
      throw new Error('Email subject is required');
    }
    
    if (!options.react && !options.html && !options.text) {
      throw new Error('Email content is required (react, html, or text)');
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: options.from || DEFAULT_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      react: options.react,
      html: options.html,
      text: options.text,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      attachments: options.attachments,
      tags: options.tags,
      headers: options.headers,
    });

    if (error) {
      console.error('Resend API error:', error);
      return {
        id: '',
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    if (!data) {
      return {
        id: '',
        success: false,
        error: 'No response data from Resend API',
      };
    }

    return {
      id: data.id,
      success: true,
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      id: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Send bulk emails using Resend
 * @param emails Array of email options
 * @returns Promise with array of email responses
 */
export async function sendBulkEmails(
  emails: EmailOptions[]
): Promise<EmailResponse[]> {
  try {
    const emailData = emails.map(email => ({
      from: email.from || DEFAULT_FROM,
      to: Array.isArray(email.to) ? email.to : [email.to],
      subject: email.subject,
      react: email.react,
      html: email.html,
      text: email.text,
      cc: email.cc,
      bcc: email.bcc,
      replyTo: email.replyTo,
      attachments: email.attachments,
      tags: email.tags,
      headers: email.headers,
    }));

    const { data, error } = await resend.batch.send(emailData);

    if (error) {
      console.error('Resend batch API error:', error);
      return emails.map(() => ({
        id: '',
        success: false,
        error: error.message || 'Failed to send bulk emails',
      }));
    }

    if (!data || !Array.isArray(data.data)) {
      return emails.map(() => ({
        id: '',
        success: false,
        error: 'No response data from Resend batch API',
      }));
    }

    return data.data.map((result: any) => ({
      id: result.id || '',
      success: true,
    }));
  } catch (error) {
    console.error('Bulk email sending error:', error);
    return emails.map(() => ({
      id: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }));
  }
}

// Email template helper functions

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  verificationUrl?: string
): Promise<EmailResponse> {
  const React = await import('react');
  const { WelcomeEmail } = await import('@/emails/welcome');
  
  return sendEmail({
    to: email,
    subject: 'Welcome to Omni E-Ride! 🎉',
    react: React.createElement(WelcomeEmail, {
      firstName,
      email,
      verificationUrl,
    }),
    tags: [
      { name: 'type', value: 'welcome' },
      { name: 'user_email', value: email },
    ],
  });
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderData: any
): Promise<EmailResponse> {
  const React = await import('react');
  const { OrderConfirmationEmail } = await import('@/emails/order-confirmation');
  
  return sendEmail({
    to: email,
    subject: `Order Confirmed - #${orderData.orderNumber}`,
    react: React.createElement(OrderConfirmationEmail, orderData),
    tags: [
      { name: 'type', value: 'order_confirmation' },
      { name: 'order_id', value: orderData.orderNumber },
    ],
  });
}

/**
 * Send order status update email
 */
export async function sendOrderStatusUpdateEmail(
  email: string,
  statusData: any
): Promise<EmailResponse> {
  const React = await import('react');
  const { OrderStatusUpdateEmail } = await import('@/emails/order-status-update');
  
  return sendEmail({
    to: email,
    subject: `Order Update - #${statusData.orderNumber}`,
    react: React.createElement(OrderStatusUpdateEmail, statusData),
    tags: [
      { name: 'type', value: 'order_status' },
      { name: 'order_id', value: statusData.orderNumber },
      { name: 'status', value: statusData.status },
    ],
  });
}

/**
 * Send test ride booking confirmation email
 */
export async function sendTestRideConfirmationEmail(
  email: string,
  bookingData: any
): Promise<EmailResponse> {
  const React = await import('react');
  const { TestRideConfirmationEmail } = await import('@/emails/test-ride-confirmation');
  
  return sendEmail({
    to: email,
    subject: `Test Ride Confirmed - ${bookingData.date}`,
    react: React.createElement(TestRideConfirmationEmail, bookingData),
    tags: [
      { name: 'type', value: 'test_ride_confirmation' },
      { name: 'booking_id', value: bookingData.bookingId },
    ],
  });
}

/**
 * Send dealer application status update email
 */
export async function sendDealerApplicationStatusEmail(
  email: string,
  applicationData: any
): Promise<EmailResponse> {
  const React = await import('react');
  const { DealerApplicationStatusEmail } = await import('@/emails/dealer-application-status');
  
  return sendEmail({
    to: email,
    subject: `Dealer Application Update - ${applicationData.applicationId}`,
    react: React.createElement(DealerApplicationStatusEmail, applicationData),
    tags: [
      { name: 'type', value: 'dealer_application' },
      { name: 'application_id', value: applicationData.applicationId },
      { name: 'status', value: applicationData.status },
    ],
  });
}

/**
 * Send lead assignment notification to dealer
 */
export async function sendLeadAssignmentEmail(
  dealerEmail: string,
  leadData: any
): Promise<EmailResponse> {
  const React = await import('react');
  const { LeadAssignmentEmail } = await import('@/emails/lead-assignment');
  
  return sendEmail({
    to: dealerEmail,
    subject: `New Lead Assigned: ${leadData.lead.name}`,
    react: React.createElement(LeadAssignmentEmail, leadData),
    tags: [
      { name: 'type', value: 'lead_assignment' },
      { name: 'lead_id', value: leadData.lead.id },
      { name: 'dealer', value: leadData.dealerName },
    ],
  });
}

// Utility functions for email validation and formatting

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format multiple email addresses
 */
export function formatEmailAddresses(emails: string | string[]): string[] {
  if (Array.isArray(emails)) {
    return emails.filter(email => isValidEmail(email));
  }
  return isValidEmail(emails) ? [emails] : [];
}

/**
 * Create a test email preview URL (for development)
 */
export function getEmailPreviewUrl(template: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/email-preview/${template}`;
}

// Export types for use in other modules
export type {
  EmailOptions,
  EmailResponse,
};

// Default export
export default {
  sendEmail,
  sendBulkEmails,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendTestRideConfirmationEmail,
  sendDealerApplicationStatusEmail,
  sendLeadAssignmentEmail,
  isValidEmail,
  formatEmailAddresses,
  getEmailPreviewUrl,
};
