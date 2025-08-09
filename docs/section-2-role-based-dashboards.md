# Section 2: Role-based Dashboards

## Overview

The Omni E-Ride platform implements a comprehensive role-based access control (RBAC) system with three distinct user dashboards, each tailored to specific business functions and responsibilities. Each role has access to dedicated interfaces, features, and workflows designed to optimize their interaction with the platform.

---

## Administrator Dashboard

### Role Summary
The Administrator role serves as the command center for the entire Omni E-Ride platform, providing complete oversight of business operations, user management, and system configuration.

### Top Responsibilities & Daily Tasks

#### Business Operations Management
• Monitor platform-wide metrics and KPIs through real-time analytics dashboards
• Track sales performance across all dealers and direct channels
• Review financial reports including revenue, commissions, and transaction summaries
• Oversee order fulfillment status and resolve escalated issues

#### User & Access Control
• Manage user accounts and role assignments across the platform
• Review and approve dealer applications with due diligence
• Monitor user activity and maintain audit trails for compliance
• Handle role elevation requests and permission modifications

#### Quality Assurance & Compliance
• Review and approve warranty registrations submitted by dealers
• Ensure compliance with business policies and regulatory requirements
• Manage product catalog updates and pricing strategies
• Validate dealer-submitted documentation and certifications

#### System Administration
• Configure platform settings and business rules
• Monitor system health and performance metrics
• Manage integration points with third-party services
• Oversee data integrity and backup procedures

### Key Features & Page Access

#### Primary Navigation Pages
• **Overview Dashboard** (`/admin`)
  - Real-time business metrics and KPI cards
  - Sales trend charts and performance analytics
  - Recent order summaries and alerts
  - System health indicators

• **User Management** (`/admin/users`)
  - Complete user directory with role assignments
  - User activity logs and session management
  - Role modification and permission controls
  - Account suspension and reactivation tools

• **Warranty Management** (`/admin/warranties`)
  - Pending warranty approval queue
  - Warranty verification and validation tools
  - Historical warranty records and analytics
  - Bulk approval/rejection capabilities

• **Dealer Applications** (`/admin/dealer-applications`)
  - New dealer application review interface
  - Application status tracking and history
  - Approval workflow with automated notifications
  - Background verification tools and checklists

• **Dealer Management** (`/admin/dealers`)
  - Active dealer directory and profiles
  - Performance metrics by dealer
  - Commission calculations and payouts
  - Dealer agreement management

• **Product Management** (`/admin/products`)
  - Product catalog administration
  - Pricing and inventory controls
  - Model specifications and feature management
  - Product lifecycle tracking

• **Order Management** (`/admin/orders`)
  - System-wide order tracking and status
  - Order modification and cancellation tools
  - Fulfillment coordination interface
  - Return and refund processing

#### Additional Capabilities
• Export functionality for all data sets
• Advanced search and filtering across all modules
• Bulk operations for efficiency
• Customizable notification preferences
• Audit log access for all system changes

---

## Dealer Dashboard

### Role Summary
The Dealer role empowers business partners to manage their sales operations, customer relationships, and inventory while tracking performance metrics and commissions.

### Top Responsibilities & Daily Tasks

#### Sales & Customer Management
• Process new customer orders and track existing ones
• Manage customer inquiries and lead pipeline
• Schedule and coordinate test ride appointments
• Build and maintain customer relationships through CRM tools

#### Inventory & Operations
• Monitor available inventory levels and request restocks
• Update product availability in real-time
• Track incoming shipments and deliveries
• Manage showroom display preferences

#### Performance Tracking
• Monitor personal and team sales targets
• Track commission earnings and payment schedules
• Review sales performance analytics
• Identify top-selling models and customer preferences

#### Service Coordination
• Register customer warranties at point of sale
• Schedule service appointments for customers
• Coordinate with service centers for repairs
• Handle customer service escalations

### Key Features & Page Access

#### Primary Navigation Pages
• **Overview Dashboard** (`/dealer`)
  - Personal sales metrics and targets
  - Commission summary and earnings
  - Recent order activity
  - Performance charts and trends

• **Test Ride Management** (`/dealer/test-rides`)
  - Schedule new test rides for walk-in customers
  - View upcoming appointments calendar
  - Track test ride conversion rates
  - Manage test ride vehicle availability

• **Order Processing** (`/dealer/orders`)
  - Create new orders for customers
  - Track order status and delivery timelines
  - Process order modifications
  - Generate order documentation

• **Customer Management** (`/dealer/customers`)
  - Customer database and contact information
  - Lead tracking and follow-up reminders
  - Purchase history and preferences
  - Communication log and notes

• **Warranty Registration** (`/dealer/warranty`)
  - Register new warranties at point of sale
  - Upload invoice and documentation
  - Capture customer signatures digitally
  - View warranty submission history

#### Additional Capabilities
• Mobile-responsive interface for field sales
• Quick order entry for repeat customers
• Commission calculator and projections
• Inventory request system
• Performance comparison with targets
• Customer communication templates
• Digital document management

---

## Customer Dashboard

### Role Summary
The Customer role provides a personalized experience for buyers to manage their purchases, schedule services, track orders, and engage with the Omni E-Ride ecosystem.

### Top Responsibilities & Daily Tasks

#### Purchase Management
• Track order status from placement to delivery
• Access purchase history and invoices
• Manage payment information and billing
• Review and submit product feedback

#### Service Coordination
• Book test rides for vehicle evaluation
• Schedule service appointments
• Track warranty status and coverage
• Submit support tickets for assistance

#### Account Management
• Maintain personal profile information
• Manage notification preferences
• Update contact and delivery addresses
• View loyalty program status

#### Engagement Activities
• Browse product catalog and compare models
• Add vehicles to wishlist for future purchase
• Write reviews for purchased products
• Participate in customer surveys

### Key Features & Page Access

#### Primary Navigation Pages
• **Overview Dashboard** (`/dashboard`)
  - Order status summary cards
  - Upcoming test ride appointments
  - Recent activity timeline
  - Quick action buttons

• **My Orders** (`/dashboard/orders`)
  - Complete order history
  - Real-time tracking information
  - Invoice downloads
  - Return/exchange requests

• **Test Rides** (`/dashboard/test-rides`)
  - Browse available time slots
  - Book new test ride appointments (`/dashboard/test-rides/new`)
  - View appointment history
  - Reschedule or cancel bookings

• **Warranty Management** (`/dashboard/warranty`)
  - View active warranties
  - Download warranty certificates
  - Initiate warranty claims
  - Track claim status

• **Profile Management** (`/dashboard/profile`)
  - Update personal information
  - Change password and security settings
  - Manage delivery addresses
  - Communication preferences

• **Notifications** (`/dashboard/notifications`)
  - System alerts and updates
  - Order status changes
  - Promotional offers
  - Service reminders

• **Support Center** (`/dashboard/support`)
  - Create support tickets
  - Track ticket status
  - Access FAQ and help articles
  - Live chat availability (planned)

#### Additional Capabilities
• Wishlist management for future purchases
• Product comparison tools
• Savings calculator for electric vehicles
• Referral program participation
• Review and rating submission
• Document storage for purchases
• Service history tracking
• Newsletter subscription management

---

## Role Transition & Elevation

### Customer to Dealer Process
Customers can apply to become dealers through a formal application process:

1. **Application Submission** (`/dashboard/dealer-application`)
   - Business information and experience
   - GST registration details
   - Territory preferences
   - Investment capacity

2. **Review Process**
   - Administrator reviews application
   - Background verification
   - Business viability assessment
   - Territory availability check

3. **Approval & Onboarding**
   - Role elevation upon approval
   - Access to dealer dashboard
   - Training resources provision
   - Initial inventory allocation

### Permission Inheritance
• Dealers retain access to customer features for personal purchases
• Administrators have read-only access to all dashboard views for support
• Role changes are logged in audit trails for compliance

---

## Security & Access Control

### Authentication Mechanisms
• Email and password-based login
• Session management with secure cookies
• Remember me functionality for convenience
• Password reset via email verification

### Authorization Levels
• **Page-level access control**: Each dashboard route is protected by role verification
• **Feature-level permissions**: Specific actions are gated based on user role
• **Data isolation**: Users can only access their own data unless explicitly authorized
• **API-level security**: All backend endpoints verify role permissions

### Audit & Compliance
• All role changes are logged with timestamp and actor
• Sensitive operations require additional confirmation
• Session timeout for security
• Failed login attempt monitoring

---

## Appendix: Demo Credentials

> **⚠️ DEMO ENVIRONMENT ONLY**  
> These credentials are for demonstration and testing purposes only. They should never be used in production environments.

### Quick Access Demo Accounts

#### Administrator Account
- **Email**: `admin@demo.com`
- **Password**: `demo123`
- **Access**: Full platform administration, all features enabled

#### Dealer Account
- **Email**: `dealer@demo.com`
- **Password**: `demo123`
- **Access**: Dealer portal, sales management, customer CRM

#### Customer Account
- **Email**: `customer@demo.com`
- **Password**: `demo123`
- **Access**: Customer dashboard, orders, test rides, support

### Demo Features
- **Quick Login Buttons**: Available on the login page for instant access
- **Pre-populated Forms**: Demo credentials can be auto-filled
- **Sample Data**: Each demo account includes realistic sample data
- **Reset Capability**: Demo data resets periodically for consistency

### Usage Guidelines
1. Use demo accounts to explore platform capabilities
2. Test workflows across different roles
3. Evaluate user experience and interface design
4. Demonstrate platform features to stakeholders
5. Training and onboarding new users

### Limitations of Demo Accounts
- No real transactions are processed
- Email notifications are simulated
- Payment workflows use test mode
- Data is not persisted permanently
- Some integrations may be mocked

---

## Summary

The Omni E-Ride platform's role-based dashboard system ensures that each user type—Administrator, Dealer, and Customer—has access to precisely the tools and information they need to fulfill their responsibilities effectively. The clear separation of concerns, combined with intuitive navigation and comprehensive feature sets, creates an efficient and secure environment for all stakeholders in the electric vehicle ecosystem.

Through thoughtful permission management and role-specific interfaces, the platform maintains data security while providing the flexibility needed for business operations. The progression path from customer to dealer, along with comprehensive administrative oversight, ensures the platform can scale while maintaining quality and compliance standards.
