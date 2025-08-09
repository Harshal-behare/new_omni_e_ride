'use client'

import * as React from 'react'
import { MapPin, Search, Phone, Navigation, Globe } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { OmniButton } from '@/components/ui/omni-button'
import { cn } from '@/lib/utils'

type Dealer = {
  id: string
  name: string
  owner: string
  phone: string
  email?: string
  address: string
  city: string
  state: string
  pincode: string
  lat: number
  lng: number
  rating: number
  services: Array<'Sales' | 'Service' | 'Spare Parts'>
  website?: string
  distanceKm?: number
}

const dealersData: Dealer[] = [
  { id: 'blr', name: 'Green Wheels Bengaluru', owner: 'Karan S', phone: '+91 98111 22334', address: 'MG Road, Bengaluru 560001', city: 'Bengaluru', state: 'Karnataka', pincode: '560001', lat: 12.9716, lng: 77.5946, rating: 4.8, services: ['Sales', 'Service', 'Spare Parts'], website: '#', distanceKm: 2.4 },
  { id: 'mum', name: 'EcoRide Mumbai', owner: 'Anita R', phone: '+91 98222 33445', address: 'Bandra West, Mumbai 400050', city: 'Mumbai', state: 'Maharashtra', pincode: '400050', lat: 19.076, lng: 72.8777, rating: 4.6, services: ['Sales', 'Service'], website: '#', distanceKm: 6.1 },
  { id: 'del', name: 'SmartMove Delhi', owner: 'Rohit G', phone: '+91 98333 44556', address: 'Connaught Place, New Delhi 110001', city: 'Delhi', state: 'Delhi', pincode: '110001', lat: 28.6139, lng: 77.209, rating: 4.7, services: ['Sales', 'Spare Parts'], website: '#', distanceKm: 4.2 },
  { id: 'hyd', name: 'Volt Mobility Hyderabad', owner: 'Sana P', phone: '+91 98444 55667', address: 'Banjara Hills, Hyderabad 500034', city: 'Hyderabad', state: 'Telangana', pincode: '500034', lat: 17.385, lng: 78.4867, rating: 4.5, services: ['Service', 'Spare Parts'], website: '#', distanceKm: 8.5 },
  { id: 'ahd', name: 'Urban EV Ahmedabad', owner: 'Arjun P', phone: '+91 98555 66778', address: 'CG Road, Ahmedabad 380009', city: 'Ahmedabad', state: 'Gujarat', pincode: '380009', lat: 23.0225, lng: 72.5714, rating: 4.4, services: ['Sales', 'Service'], website: '#', distanceKm: 3.9 },
]

// Simple equirectangular projection to place markers within placeholder map bounds (not accurate; replace with Google Maps when available)
function projectToBox(lat: number, lng: number, bounds = { minLat: 6, maxLat: 37, minLng: 68, maxLng: 97 }) {
  const x = (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)
  const y = 1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)
  return { x: Math.min(0.98, Math.max(0.02, x)), y: Math.min(0.98, Math.max(0.02, y)) }
}

export default function DealerLocations() {
  const [search, setSearch] = React.useState('')
  const [service, setService] = React.useState<'All' | 'Sales' | 'Service' | 'Spare Parts'>('All')
  const [city, setCity] = React.useState('All')
  const [radius, setRadius] = React.useState(25)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  const filtered = dealersData.filter((d) => {
    const matchesSearch = [d.name, d.city, d.state, d.address].join(' ').toLowerCase().includes(search.toLowerCase())
    const matchesService = service === 'All' ? true : d.services.includes(service)
    const matchesCity = city === 'All' ? true : d.city === city
    const matchesRadius = !d.distanceKm || d.distanceKm <= radius
    return matchesSearch && matchesService && matchesCity && matchesRadius
  })

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex flex-col gap-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Find Our Dealers</h2>
              <p className="text-gray-600">Search dealers near you and book your test ride.</p>
            </div>
            <OmniButton variant="ghost">Use Current Location</OmniButton>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Map */}
            <div className="relative lg:col-span-7 rounded-xl ring-1 ring-gray-200 overflow-hidden">
              <img
                src="/placeholder.svg?height=700&width=1000"
                alt="Map of India showing dealer locations"
                className="h-full w-full object-cover"
              />
              {/* Markers (placeholder positioning) */}
              {filtered.map((d) => {
                const { x, y } = projectToBox(d.lat, d.lng)
                const active = selectedId === d.id
                return (
                  <button
                    key={d.id}
                    title={d.name}
                    aria-label={`${d.name}, ${d.city}`}
                    onClick={() => setSelectedId(d.id)}
                    className={cn(
                      'absolute -translate-x-1/2 -translate-y-full rounded-full border bg-white p-1.5 shadow-md transition',
                      active ? 'border-emerald-600 ring-2 ring-emerald-300' : 'border-gray-300 hover:scale-105'
                    )}
                    style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                  >
                    <MapPin className={cn('h-5 w-5', active ? 'text-emerald-600' : 'text-emerald-500')} />
                  </button>
                )
              })}
            </div>

            {/* Filters + List */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="relative sm:col-span-2">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search dealer or location"
                      className="pl-8 rounded-lg"
                      aria-label="Search dealers"
                    />
                  </div>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="City" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Cities</SelectItem>
                      {[...new Set(dealersData.map((d) => d.city))].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={service} onValueChange={(v) => setService(v as any)}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {['All', 'Sales', 'Service', 'Spare Parts'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Distance radius: {radius} KM</label>
                    <Slider
                      value={[radius]}
                      onValueChange={(v) => setRadius(v[0] ?? 25)}
                      min={5}
                      max={50}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 max-h-[520px] overflow-auto pr-1">
                {filtered.map((d) => {
                  const active = selectedId === d.id
                  return (
                    <div
                      key={d.id}
                      className={cn(
                        'rounded-lg border p-4 shadow-sm transition hover:shadow-md',
                        active ? 'border-emerald-600 bg-emerald-50/40' : 'border-gray-200 bg-white'
                      )}
                      onMouseEnter={() => setSelectedId(d.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-emerald-700">{d.name}</div>
                          <div className="text-sm text-gray-600">Owner: {d.owner}</div>
                          <div className="mt-1 text-sm text-gray-700">{d.address}</div>
                          <div className="mt-1 text-xs text-gray-500">Rating: {'★'.repeat(Math.round(d.rating))}{'☆'.repeat(5 - Math.round(d.rating))} ({d.rating.toFixed(1)})</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {d.services.map((s) => (
                              <Badge key={s} className={cn('bg-gray-200 text-gray-800 hover:bg-gray-200', s === 'Sales' && 'bg-emerald-100 text-emerald-700', s === 'Service' && 'bg-blue-100 text-blue-700')}>
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-600 min-w-[84px]">
                          {d.distanceKm ? `${d.distanceKm} KM` : ''}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a href={`tel:${d.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm">
                          <Phone className="h-4 w-4" /> Call Now
                        </a>
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700">
                          <Navigation className="h-4 w-4" /> Get Directions
                        </a>
                        {d.website && (
                          <a href={d.website} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm hover:bg-gray-100">
                            <Globe className="h-4 w-4" /> Website
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
                {filtered.length === 0 && (
                  <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600">
                    No dealers match your filters. Try adjusting them.
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Map integration-ready: When Google Maps JS API is available on window.google.maps, replace the placeholder with a live map and synchronized markers.
          </p>
        </div>
      </div>
    </section>
  )
}
