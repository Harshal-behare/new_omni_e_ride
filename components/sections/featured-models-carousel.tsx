'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { BatteryCharging, Gauge, Timer, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type Vehicle = {
  id: string
  name: string
  slug: string
  price: number
  discounted_price?: number
  images: string[]
  range_km: number
  top_speed_kmph: number
  charging_time_hours: number
  colors: string[]
  type: string
  status: string
}

export default function FeaturedModelsCarousel() {
  const [compare, setCompare] = React.useState<string[]>([])
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchVehicles()
  }, [])

  async function fetchVehicles() {
    try {
      const response = await fetch('/api/vehicles?limit=6')
      if (response.ok) {
        const data = await response.json()
        setVehicles(data)
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  function toggleCompare(id: string, checked: boolean) {
    setCompare((prev) => {
      const next = checked ? [...prev, id] : prev.filter((x) => x !== id)
      return next.slice(0, 3) // limit to 3
    })
  }

  return (
    <section id="featured" className="mx-auto max-w-7xl px-4 py-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Featured Models</h2>
          <p className="text-gray-600">Explore our most loved scooters, crafted for performance and reliability.</p>
        </div>
        {compare.length > 0 && (
          <OmniButton variant="primary" size="md">
            Compare ({compare.length})
          </OmniButton>
        )}
      </div>

      <div className="mt-6 relative">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : vehicles.length > 0 ? (
          <Carousel
            opts={{ align: 'start', loop: true }}
            plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
            className="w-full"
          >
            <CarouselContent>
              {vehicles.map((vehicle) => (
                <CarouselItem key={vehicle.id} className="basis-full sm:basis-1/2 lg:basis-1/3">
                  <ProductCard vehicle={vehicle} onCompare={toggleCompare} compared={compare.includes(vehicle.id)} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 bg-emerald-600 text-white hover:bg-emerald-700" />
            <CarouselNext className="right-0 bg-emerald-600 text-white hover:bg-emerald-700" />
          </Carousel>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No vehicles available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  )
}

function ProductCard({ vehicle, onCompare, compared }: { vehicle: Vehicle; onCompare: (id: string, checked: boolean) => void; compared: boolean }) {
  const [loaded, setLoaded] = React.useState(false)
  const mainImage = vehicle.images?.[0] || '/placeholder.svg?height=700&width=1000'
  const displayPrice = vehicle.discounted_price || vehicle.price

  // Determine badge based on vehicle properties
  const getBadge = () => {
    if (vehicle.type === 'electric_scooter' && vehicle.range_km > 100) return 'Featured'
    if (vehicle.type === 'electric_bike') return 'Popular'
    if (vehicle.type === 'electric_moped') return 'New'
    return null
  }

  const badge = getBadge()

  return (
    <Card className="group overflow-hidden rounded-xl border border-gray-200 shadow-sm transition hover:shadow-lg">
      <div className="relative">
        {badge && (
          <div className="absolute left-3 top-3 z-10">
            <Badge className="bg-emerald-500 hover:bg-emerald-500">{badge}</Badge>
          </div>
        )}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {!loaded && <Skeleton className="absolute inset-0" />}
          <Image
            src={mainImage}
            alt={`${vehicle.name} product image`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={cn('object-cover transition-transform duration-500', loaded ? 'scale-100' : 'scale-105', 'group-hover:scale-110')}
            onLoad={() => setLoaded(true)}
          />
        </div>
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-col gap-2">
          <span className="text-lg font-semibold line-clamp-1">{vehicle.name}</span>
          <div className="flex items-baseline gap-2">
            {vehicle.discounted_price && (
              <span className="text-sm line-through text-gray-400">₹{vehicle.price.toLocaleString('en-IN')}</span>
            )}
            <span className="text-emerald-600 text-xl font-bold">₹{displayPrice.toLocaleString('en-IN')}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Key Specs - Made More Prominent */}
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-600 mb-1">Max Speed</div>
            <div className="text-lg font-bold text-gray-900">{vehicle.top_speed_kmph} km/h</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-600 mb-1">Range</div>
            <div className="text-lg font-bold text-gray-900">{vehicle.range_km} km</div>
          </div>
        </div>

        {/* Secondary spec */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Timer className="h-4 w-4 text-emerald-600" />
          <span>Charging: {vehicle.charging_time_hours} hours</span>
        </div>

        {/* Color options - Made smaller */}
        {vehicle.colors && vehicle.colors.length > 0 && (
          <div className="flex items-center justify-center gap-1">
            {vehicle.colors.slice(0, 4).map((color, index) => (
              <span 
                key={index} 
                className="h-4 w-4 rounded-full ring-1 ring-gray-300" 
                style={{ backgroundColor: color.toLowerCase().includes('black') ? '#000' : color.toLowerCase().includes('white') ? '#fff' : color.toLowerCase().includes('red') ? '#ef4444' : color.toLowerCase().includes('blue') ? '#3b82f6' : color.toLowerCase().includes('green') ? '#10b981' : '#6b7280' }} 
                aria-label={`Color ${color}`}
              />
            ))}
            {vehicle.colors.length > 4 && (
              <span className="text-xs text-gray-500 ml-1">+{vehicle.colors.length - 4}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Link href={`/models/${vehicle.slug}`} className="flex-1">
            <OmniButton variant="primary" size="sm" fullWidth>View Details</OmniButton>
          </Link>
          <Dialog>
            <DialogTrigger asChild>
              <OmniButton variant="outline" size="sm" startIcon={<Eye className="h-4 w-4" />}>Quick View</OmniButton>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{vehicle.name}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-gray-200">
                  <Image src={mainImage} alt={`${vehicle.name} image`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                </div>
                <div className="space-y-4">
                  <div>
                    {vehicle.discounted_price && (
                      <span className="text-sm line-through text-gray-400 block">₹{vehicle.price.toLocaleString('en-IN')}</span>
                    )}
                    <div className="text-emerald-700 font-semibold">Starting from ₹{displayPrice.toLocaleString('en-IN')}</div>
                  </div>
                  <ul className="grid gap-2 text-sm text-gray-700">
                    <li className="inline-flex items-center gap-2"><BatteryCharging className="h-4 w-4 text-emerald-600" /> Range: {vehicle.range_km} KM</li>
                    <li className="inline-flex items-center gap-2"><Gauge className="h-4 w-4 text-emerald-600" /> Top Speed: {vehicle.top_speed_kmph} KM/H</li>
                    <li className="inline-flex items-center gap-2"><Timer className="h-4 w-4 text-emerald-600" /> Charging: {vehicle.charging_time_hours} Hours</li>
                  </ul>
                  <div className="flex gap-2">
                    <Link href={`/models/${vehicle.slug}`}>
                      <OmniButton variant="primary">View Full Details</OmniButton>
                    </Link>
                    <Link href="/dealers">
                      <OmniButton variant="ghost">Find Dealer</OmniButton>
                    </Link>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
