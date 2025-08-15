// Export all email templates
export { default as WelcomeEmail } from './welcome';
export { default as OrderConfirmationEmail } from './order-confirmation';
export { default as OrderStatusUpdateEmail } from './order-status-update';
export { default as TestRideConfirmationEmail } from './test-ride-confirmation';
export { default as DealerApplicationStatusEmail } from './dealer-application-status';
export { default as LeadAssignmentEmail } from './lead-assignment';

// Export email layout component
export { EmailLayout } from './components/layout';

// Export types
export type { OrderStatus } from './order-status-update';
export type { ApplicationStatus } from './dealer-application-status';
