# Customer Feedback Feature

## Overview
The Customer Feedback feature allows admins to manage customer testimonials and reviews that are displayed on the homepage. This includes adding, editing, approving, and deleting feedback entries.

## Database Setup

### 1. Create the Table
Run the SQL script located at `sql/create_customer_feedback_table.sql` in your Supabase SQL Editor:

```bash
# The file includes:
- Table creation with all necessary fields
- Indexes for performance
- Row Level Security (RLS) policies
- Sample data for testing
- Automated triggers for updated_at field
```

### 2. Table Schema
The `customer_feedback` table includes:

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Optional link to user profile |
| `name` | text | Customer name (required) |
| `email` | text | Customer email (optional) |
| `location` | text | City, State (required) |
| `rating` | integer | Rating 1-5 stars (required) |
| `feedback_text` | text | The feedback message (required) |
| `vehicle_purchased` | text | Name of vehicle purchased |
| `vehicle_id` | uuid | Optional link to vehicle |
| `photo_url` | text | Customer photo URL |
| `verified` | boolean | Verified customer badge |
| `status` | text | pending/approved/rejected |
| `display_on_homepage` | boolean | Show on homepage or not |
| `order_id` | uuid | Optional link to order |
| `approved_by` | uuid | Admin who approved |
| `approved_at` | timestamp | When approved |
| `rejection_reason` | text | Why rejected |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

## Admin Interface

### Accessing the Admin Panel
1. Login as an admin user
2. Navigate to **Admin Dashboard** → **Customer Feedback**
3. URL: `/admin/customer-feedback`

### Features

#### View All Feedback
- Lists all customer feedback entries
- Shows name, location, rating, status, and homepage display status
- Sortable by date (newest first)

#### Add New Feedback
1. Click the **"Add Feedback"** button
2. Fill in the form:
   - **Required fields**: Name, Location, Rating, Feedback Text
   - **Optional fields**: Email, Vehicle Purchased, Photo URL
   - **Checkboxes**: Verified Customer, Display on Homepage
   - **Status**: Approved/Pending/Rejected
3. Click **"Add Feedback"** to save

#### Approve/Reject Feedback
- Click the status badge to toggle between **Approved** and **Pending**
- Approved feedback can be displayed on homepage
- Rejected feedback is hidden from public view

#### Toggle Homepage Display
- Click the eye icon (👁️) to show on homepage
- Click the crossed eye icon (👁️‍🗨️) to hide from homepage
- Only approved feedback should be displayed on homepage

#### Delete Feedback
- Click the trash icon (🗑️) to permanently delete
- Confirmation dialog will appear

## Homepage Integration

### Automatic Data Fetching
The homepage testimonials section (`components/sections/testimonials.tsx`) automatically:
1. Fetches approved feedback from the database
2. Filters by `status = 'approved'` AND `display_on_homepage = true`
3. Falls back to demo data if:
   - Database is unavailable
   - No approved feedback exists
   - Any error occurs

### Fallback Behavior
If the database query fails, the component will:
- Display a loading spinner initially
- Show demo testimonials (6 pre-defined entries)
- Log errors to console for debugging

## API Endpoints

### Admin API Routes (Protected)
All routes require admin authentication.

#### `GET /api/admin/customer-feedback`
Fetch all customer feedback entries.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Customer Name",
    "location": "City, State",
    "rating": 5,
    "feedback_text": "Great product!",
    "status": "approved",
    "display_on_homepage": true,
    ...
  }
]
```

#### `POST /api/admin/customer-feedback`
Create new customer feedback.

**Request Body:**
```json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "location": "City, State",
  "rating": 5,
  "feedback_text": "Excellent service!",
  "vehicle_purchased": "OMNI Urban Pro",
  "verified": true,
  "status": "approved",
  "display_on_homepage": true
}
```

#### `DELETE /api/admin/customer-feedback/[id]`
Delete feedback by ID.

#### `PUT /api/admin/customer-feedback/[id]/status`
Update feedback status.

**Request Body:**
```json
{
  "status": "approved" // or "pending" or "rejected"
}
```

#### `PUT /api/admin/customer-feedback/[id]/homepage`
Toggle homepage display.

**Request Body:**
```json
{
  "display_on_homepage": true // or false
}
```

## Security

### Row Level Security (RLS)
The table has RLS enabled with policies:
- **Public**: Can view approved feedback marked for homepage
- **Authenticated users**: Can view their own feedback
- **Authenticated users**: Can create feedback
- **Admins only**: Full CRUD access to all feedback

### Admin Authentication
All admin API routes verify:
1. User is authenticated
2. User has `admin` role in profiles table

## Best Practices

### Content Moderation
1. Review all new feedback before approving
2. Verify customer identity when possible
3. Check for inappropriate content
4. Ensure feedback is relevant to your products

### Homepage Display
1. Only approve high-quality, genuine feedback
2. Maintain a mix of different vehicles/locations
3. Limit homepage display to 6-12 entries
4. Regularly update with fresh testimonials

### Performance
- The table has indexes on status, display, rating, and created_at
- Homepage query is limited to 12 entries
- Loading state prevents layout shift

## Troubleshooting

### Feedback not showing on homepage?
Check:
1. Status is set to "approved"
2. "Display on homepage" is enabled
3. Database query is working (check console)
4. RLS policies are correctly applied

### Can't delete/edit feedback?
Verify:
1. You're logged in as admin
2. Admin role is correctly set in profiles table
3. API routes are accessible

### Demo data showing instead of database data?
1. Check database connection
2. Verify table exists and has data
3. Check browser console for errors
4. Ensure RLS policies allow public SELECT

## Future Enhancements
Potential improvements:
- Image upload for customer photos
- Bulk import/export functionality
- Email notifications for new feedback
- Filtering and search in admin panel
- Customer self-service feedback submission form
- Analytics on feedback trends
