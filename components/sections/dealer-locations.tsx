'use client'

import * as React from 'react'
import { MapPin, Search, Phone, Navigation, Globe, Info } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { OmniButton } from '@/components/ui/omni-button'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { DealerDetailModal } from '@/components/modals/dealer-detail-modal'

type Dealer = {
  id: string
  business_name: string
  business_address: string
  business_phone: string
  business_email?: string
  city: string
  state: string
  pincode: string
  latitude?: number
  longitude?: number
  status: string
  commission_rate?: number
  approved_at?: string
  created_at: string
}

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
  const [dealers, setDealers] = React.useState<Dealer[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedDealer, setSelectedDealer] = React.useState<Dealer | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)

  React.useEffect(() => {
    fetchDealers()
  }, [])

  async function fetchDealers() {
    try {
      const response = await fetch('/api/public/dealers')
      if (response.ok) {
        const data = await response.json()
        setDealers(data)
      }
    } catch (error) {
      console.error('Error fetching dealers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = dealers.filter((d) => {
    const matchesSearch = [d.business_name, d.city, d.state, d.business_address].join(' ').toLowerCase().includes(search.toLowerCase())
    const matchesCity = city === 'All' ? true : d.city === city
    return matchesSearch && matchesCity
  })

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex flex-col gap-6">
          <div className="flex items-end justify-between gap-4">
            <div>
          <h2 className="text-3xl font-bold text-gray-900">Our Dealers</h2>
          <p className="text-gray-600">Visit our showroom or connect with our authorized dealers.</p>
        </div>
          </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Showroom Image */}
        <div className="relative lg:col-span-7 rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <img
            src="/placeholder.svg?height=700&width=1000"
            alt="Omni ElectraRide Showroom"
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <h3 className="text-white text-xl font-semibold mb-2">Omni ElectraRide Showroom</h3>
            <p className="text-white/90 text-sm mb-3">NH-107, Yadav Chowk, Saharsa, Bihar - 852201</p>
            <a 
              href="https://www.google.com/maps/place/Omni+ElectraRide+Showroom/@25.8789055,86.6212866" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
            >
              <Navigation className="h-4 w-4" />
              Get Directions
            </a>
          </div>
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
                      {[...new Set(dealers.map((d) => d.city))].map((c) => (
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
                {loading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-lg border p-4">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2 mb-2" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    ))}
                  </>
                ) : filtered.length > 0 ? (
                  filtered.map((d) => {
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
                            <div className="text-base font-semibold text-emerald-700">{d.business_name}</div>
                            <div className="mt-1 text-sm text-gray-700">{d.business_address}</div>
                            <div className="text-sm text-gray-600">{d.city}, {d.state} - {d.pincode}</div>
                            {d.commission_rate && (
                              <div className="mt-1 text-xs text-gray-500">Commission Rate: {d.commission_rate}%</div>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge className={cn(
                                'text-xs',
                                d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              )}>
                                {d.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <a href={`tel:${d.business_phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs">
                            <Phone className="h-3 w-3" /> Call
                          </a>
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.business_address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-xs text-white hover:bg-emerald-700">
                            <Navigation className="h-3 w-3" /> Directions
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDealer(d)
                              setModalOpen(true)
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs h-auto"
                          >
                            <Info className="h-3 w-3" /> More Info
                          </Button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600">
                    No dealers available. Please check back later.
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

      {/* Dealer Detail Modal */}
      <DealerDetailModal
        dealer={selectedDealer}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </section>
  )
}
