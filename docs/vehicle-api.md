# Vehicle Management API Documentation

## Overview

The Vehicle Management API provides a complete set of endpoints and functions for managing electric vehicles in the OMNI E-Ride platform. The API supports both client-side and server-side operations with proper authentication and authorization.

## Database Schema

The vehicles are stored in a PostgreSQL database table with the following structure:

- `id`: UUID (Primary Key)
- `slug`: Unique text identifier for URLs
- `name`: Vehicle name
- `tagline`: Marketing tagline
- `price`: Integer price in INR
- `images`: Array of image URLs
- `colors`: Array of color hex codes
- `badges`: Array of badge labels (e.g., "Featured", "Popular", "New")
- `range_km`: Range in kilometers
- `top_speed`: Top speed in km/h
- `charge_hours`: Charging time in hours
- `motor_power_w`: Motor power in watts (optional)
- `battery_wh`: Battery capacity in watt-hours (optional)
- `ev_units_per_100km`: Energy consumption (optional)
- `petrol_km_per_l`: Equivalent petrol efficiency (optional)
- `rating`: Average rating (0-5)
- `reviews_count`: Number of reviews
- `is_active`: Boolean for soft delete
- `stock_quantity`: Available stock
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `released_at`: Release date (optional)

## API Endpoints

### 1. List All Vehicles

**Endpoint:** `GET /api/vehicles`

**Query Parameters:**
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter
- `minRange`: Minimum range filter (km)
- `maxRange`: Maximum range filter (km)
- `badges`: Comma-separated badge filters
- `sortBy`: Sort field (`price`, `range`, `rating`, `name`)
- `sortOrder`: Sort direction (`asc`, `desc`)
- `limit`: Number of results
- `offset`: Pagination offset

**Example:**
```javascript
// Client-side
const response = await fetch('/api/vehicles?minPrice=50000&maxPrice=100000&sortBy=price&sortOrder=asc')
const vehicles = await response.json()
```

### 2. Get Vehicle by Slug

**Endpoint:** `GET /api/vehicles/[slug]`

**Example:**
```javascript
const response = await fetch('/api/vehicles/urban-pro')
const vehicle = await response.json()
```

### 3. Create Vehicle (Admin Only)

**Endpoint:** `POST /api/vehicles`

**Required Fields:**
- `slug`: Unique slug
- `name`: Vehicle name
- `price`: Price in INR
- `range_km`: Range in kilometers
- `top_speed`: Top speed
- `charge_hours`: Charging time

**Example:**
```javascript
const response = await fetch('/api/vehicles', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    slug: 'new-model',
    name: 'OMNI New Model',
    price: 85000,
    range_km: 120,
    top_speed: 85,
    charge_hours: 4,
    tagline: 'The future of urban mobility',
    images: ['/images/new-model.jpg'],
    colors: ['#000000', '#FFFFFF'],
    badges: ['New']
  })
})
```

### 4. Update Vehicle (Admin Only)

**Endpoint:** `PUT /api/vehicles/[id]`

**Example:**
```javascript
const response = await fetch('/api/vehicles/uuid-here', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    price: 90000,
    stock_quantity: 50
  })
})
```

### 5. Delete Vehicle (Admin Only)

**Endpoint:** `DELETE /api/vehicles/[id]`

Note: This performs a soft delete by setting `is_active` to false.

## Client Functions

Import from `lib/api/vehicles.ts`:

```typescript
import {
  getVehicles,
  getVehicleBySlug,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  searchVehicles,
  getVehicleStats
} from '@/lib/api/vehicles'

// Get all vehicles with filters
const vehicles = await getVehicles({
  minPrice: 50000,
  maxPrice: 100000,
  sortBy: 'price',
  sortOrder: 'asc'
})

// Get single vehicle
const vehicle = await getVehicleBySlug('urban-pro')

// Search vehicles
const results = await searchVehicles('Urban')

// Admin operations
const newVehicle = await createVehicle(vehicleData)
const updated = await updateVehicle(id, updates)
const deleted = await deleteVehicle(id)

// Get statistics
const stats = await getVehicleStats()
```

## Server Functions

Import from `lib/api/vehicles.server.ts` for use in Server Components:

```typescript
import {
  getVehicles,
  getVehicleBySlug,
  getFeaturedVehicles,
  getPopularVehicles
} from '@/lib/api/vehicles.server'

// In a Server Component
export default async function VehiclesPage() {
  const vehicles = await getVehicles()
  const featured = await getFeaturedVehicles()
  const popular = await getPopularVehicles()
  
  return (
    // Render vehicles
  )
}
```

## Legacy Support

The `lib/models-data.ts` file has been updated to fetch data from Supabase while maintaining backward compatibility:

```typescript
import { getModels, getFlatModels, getModelBySlug } from '@/lib/models-data'

// Get all models (async)
const models = await getModels()

// Get flat models for list views
const flatModels = await getFlatModels()

// Get single model
const model = await getModelBySlug('urban-pro')
```

## Database Migrations

To set up the database:

1. Run the migration to create the vehicles table:
```bash
npx supabase db push
```

2. The migration includes:
   - Table creation with all fields
   - Row-level security policies
   - Indexes for performance
   - Initial seed data

## Security

- **Public Access**: Anyone can view active vehicles
- **Admin Access**: Only admins can:
  - View inactive vehicles
  - Create new vehicles
  - Update existing vehicles
  - Delete vehicles (soft delete)

## Error Handling

All API functions include proper error handling:

- **401 Unauthorized**: User not authenticated
- **403 Forbidden**: User lacks required permissions
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Duplicate slug on creation
- **500 Internal Server Error**: Server-side error

## Performance Considerations

1. **Indexes**: The database includes indexes on:
   - `slug` for fast lookups
   - `is_active` for filtering
   - `price` for sorting
   - `created_at` for chronological ordering

2. **Pagination**: Use `limit` and `offset` for large datasets

3. **Caching**: Consider implementing caching for frequently accessed vehicles

## Testing

Example test scenarios:

```javascript
// Test filtering
const affordableVehicles = await getVehicles({
  maxPrice: 80000,
  minRange: 100
})

// Test sorting
const topRated = await getVehicles({
  sortBy: 'rating',
  sortOrder: 'desc',
  limit: 5
})

// Test search
const searchResults = await searchVehicles('Smart')

// Test admin operations (requires admin auth)
const testVehicle = await createVehicle({
  slug: 'test-vehicle',
  name: 'Test Vehicle',
  price: 50000,
  range_km: 100,
  top_speed: 70,
  charge_hours: 3
})

await updateVehicle(testVehicle.id, { price: 55000 })
await deleteVehicle(testVehicle.id)
```
