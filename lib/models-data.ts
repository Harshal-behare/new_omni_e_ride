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

export const MODELS: Model[] = [
  {
    id: 'urban-pro',
    slug: 'urban-pro',
    name: 'OMNI Urban Pro',
    tagline: 'Smart performance for city life',
    price: 84999,
    images: [
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
    ],
    colors: ['#111827', '#10b981', '#6b7280', '#f59e0b'],
    badges: ['Featured'],
    specs: { rangeKm: 120, topSpeed: 85, chargeHours: 4, motorPowerW: 3000, batteryWh: 3200 },
    rating: 4.8,
    reviews: 192,
    evUnitsPer100Km: 1.7,
    petrolKmPerL: 52,
  },
  {
    id: 'city-rider',
    slug: 'city-rider',
    name: 'OMNI City Rider',
    tagline: 'Style and efficiency for daily rides',
    price: 74999,
    images: [
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
    ],
    colors: ['#111827', '#e11d48', '#6b7280', '#22d3ee'],
    badges: ['Popular'],
    specs: { rangeKm: 110, topSpeed: 80, chargeHours: 4, motorPowerW: 2800, batteryWh: 3000 },
    rating: 4.6,
    reviews: 156,
    evUnitsPer100Km: 1.8,
    petrolKmPerL: 50,
  },
  {
    id: 'smart-series',
    slug: 'smart-series',
    name: 'OMNI Smart Series',
    tagline: 'IoT-ready. Future-proof.',
    price: 89999,
    images: [
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
    ],
    colors: ['#111827', '#10b981', '#6b7280'],
    badges: ['New'],
    specs: { rangeKm: 125, topSpeed: 85, chargeHours: 4, motorPowerW: 3200, batteryWh: 3300 },
    rating: 4.7,
    reviews: 98,
    evUnitsPer100Km: 1.6,
    petrolKmPerL: 52,
  },
  {
    id: 'tourer',
    slug: 'tourer',
    name: 'OMNI Tourer',
    tagline: 'Long range touring companion',
    price: 99999,
    images: [
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
    ],
    colors: ['#111827', '#10b981', '#6b7280', '#f43f5e'],
    specs: { rangeKm: 130, topSpeed: 90, chargeHours: 4, motorPowerW: 3500, batteryWh: 3600 },
    rating: 4.5,
    reviews: 64,
    evUnitsPer100Km: 1.7,
    petrolKmPerL: 48,
  },
  {
    id: 'sport',
    slug: 'sport',
    name: 'OMNI Sport',
    tagline: 'Responsive handling with punch',
    price: 92999,
    images: [
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
    ],
    colors: ['#111827', '#0ea5e9', '#10b981'],
    specs: { rangeKm: 115, topSpeed: 88, chargeHours: 4, motorPowerW: 3300, batteryWh: 3400 },
    rating: 4.4,
    reviews: 71,
    evUnitsPer100Km: 1.75,
    petrolKmPerL: 48,
  },
  {
    id: 'lite',
    slug: 'lite',
    name: 'OMNI Lite',
    tagline: 'Compact, efficient, value-packed',
    price: 67999,
    images: [
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
      '/placeholder.svg?height=700&width=1000',
    ],
    colors: ['#111827', '#10b981', '#eab308'],
    specs: { rangeKm: 95, topSpeed: 75, chargeHours: 3.5, motorPowerW: 2500, batteryWh: 2500 },
    rating: 4.2,
    reviews: 53,
    evUnitsPer100Km: 1.9,
    petrolKmPerL: 55,
  },
]

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

export const models: FlatModel[] = MODELS.map((m) => ({
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
