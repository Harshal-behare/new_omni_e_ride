import { createClient } from '@/lib/supabase/client'
import type { Vehicle } from '@/lib/database.types'

// Legacy types for backward compatibility
export type Specs = {
  rangeKm: number
  topSpeed: number
  chargeHours: number
  motorPowerW?: number
  batteryWh?: number
}

export type Model = {
  id: string
  slug: string
  name: string
  tagline: string
  price: number
  images: string[]
  colors: string[]
  badges?: string[]
  specs: Specs
  rating: number
  reviews: number
  // For calculators
  evUnitsPer100Km?: number
  petrolKmPerL?: number
}

// Flattened alias for list views.
export type FlatModel = {
  id: string
  slug: string
  name: string
  tagline: string
  price: number
  images: string[]
  rating: number
  reviews: number
  rangeKm: number
  topSpeed: number
  chargeHours: number
  batteryWh?: number
  motorPowerW?: number
  releasedAt?: Date
}

/**
 * Convert a Vehicle from database to Model format
 */
function vehicleToModel(vehicle: Vehicle): Model {
  return {
    id: vehicle.id,
    slug: vehicle.slug,
    name: vehicle.name,
    tagline: vehicle.tagline || '',
    price: vehicle.price,
    images: vehicle.images,
    colors: vehicle.colors,
    badges: vehicle.badges.length > 0 ? vehicle.badges : undefined,
    specs: {
      rangeKm: vehicle.range_km,
      topSpeed: vehicle.top_speed,
      chargeHours: vehicle.charge_hours,
      motorPowerW: vehicle.motor_power_w || undefined,
      batteryWh: vehicle.battery_wh || undefined,
    },
    rating: vehicle.rating,
    reviews: vehicle.reviews_count,
    evUnitsPer100Km: vehicle.ev_units_per_100km || undefined,
    petrolKmPerL: vehicle.petrol_km_per_l || undefined,
  }
}

/**
 * Convert a Vehicle from database to FlatModel format
 */
function vehicleToFlatModel(vehicle: Vehicle): FlatModel {
  return {
    id: vehicle.id,
    slug: vehicle.slug,
    name: vehicle.name,
    tagline: vehicle.tagline || '',
    price: vehicle.price,
    images: vehicle.images,
    rating: vehicle.rating,
    reviews: vehicle.reviews_count,
    rangeKm: vehicle.range_km,
    topSpeed: vehicle.top_speed,
    chargeHours: vehicle.charge_hours,
    batteryWh: vehicle.battery_wh || undefined,
    motorPowerW: vehicle.motor_power_w || undefined,
    releasedAt: vehicle.released_at ? new Date(vehicle.released_at) : undefined,
  }
}

/**
 * Get all models from the database
 * This function is async and should be used in server components or with proper loading states
 */
export async function getModels(): Promise<Model[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching vehicles:', error)
    return []
  }
  
  return data.map(vehicleToModel)
}

/**
 * Get all flat models from the database
 */
export async function getFlatModels(): Promise<FlatModel[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching vehicles:', error)
    return []
  }
  
  return data.map(vehicleToFlatModel)
}

/**
 * Get a single model by slug
 */
export async function getModelBySlug(slug: string): Promise<Model | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  if (error) {
    console.error('Error fetching vehicle:', error)
    return null
  }
  
  return vehicleToModel(data)
}

// Default models for initial render and fallback
// These will be replaced with actual data from Supabase when available
export const DEFAULT_MODELS: Model[] = [
  {
    id: 'urban-pro',
    slug: 'urban-pro',
    name: 'OMNI Urban Pro',
    tagline: 'Premium electric scooter for urban commute',
    price: 84999,
    images: ['/placeholder.svg'],
    colors: ['#111827', '#10b981', '#6b7280', '#f59e0b'],
    badges: ['Featured'],
    specs: {
      rangeKm: 120,
      topSpeed: 85,
      chargeHours: 4,
      motorPowerW: 3000,
      batteryWh: 3200,
    },
    rating: 4.5,
    reviews: 234,
    evUnitsPer100Km: 1.5,
    petrolKmPerL: 50,
  },
  {
    id: 'city-rider',
    slug: 'city-rider',
    name: 'OMNI City Rider',
    tagline: 'Affordable and efficient city transport',
    price: 74999,
    images: ['/placeholder.svg'],
    colors: ['#111827', '#e11d48', '#6b7280', '#22d3ee'],
    badges: ['Popular'],
    specs: {
      rangeKm: 110,
      topSpeed: 80,
      chargeHours: 4,
      motorPowerW: 2500,
      batteryWh: 2800,
    },
    rating: 4.3,
    reviews: 189,
    evUnitsPer100Km: 1.4,
    petrolKmPerL: 50,
  },
  {
    id: 'smart-series',
    slug: 'smart-series',
    name: 'OMNI Smart Series',
    tagline: 'Smart features for modern riders',
    price: 89999,
    images: ['/placeholder.svg'],
    colors: ['#111827', '#10b981', '#6b7280'],
    badges: ['New'],
    specs: {
      rangeKm: 125,
      topSpeed: 85,
      chargeHours: 4,
      motorPowerW: 3000,
      batteryWh: 3400,
    },
    rating: 4.6,
    reviews: 156,
    evUnitsPer100Km: 1.6,
    petrolKmPerL: 50,
  },
]

export const MODELS: Model[] = DEFAULT_MODELS
export const models: FlatModel[] = DEFAULT_MODELS.map(m => ({
  id: m.id,
  slug: m.slug,
  name: m.name,
  tagline: m.tagline,
  price: m.price,
  images: m.images,
  rating: m.rating,
  reviews: m.reviews,
  rangeKm: m.specs.rangeKm,
  topSpeed: m.specs.topSpeed,
  chargeHours: m.specs.chargeHours,
  batteryWh: m.specs.batteryWh,
  motorPowerW: m.specs.motorPowerW,
}))
