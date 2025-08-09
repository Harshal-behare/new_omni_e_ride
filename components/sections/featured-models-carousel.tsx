'use client'

import * as React from 'react'
import Image from 'next/image'
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

type ProductModel = {
  id: string
  name: string
  price: number
  image: string
  rangeKm: number
  topSpeed: number
  chargeHours: number
  colors: string[]
  badge?: 'Featured' | 'New' | 'Popular'
}

const products: ProductModel[] = [
  {
    id: 'urban-pro',
    name: 'OMNI Urban Pro',
    price: 84999,
    image: '/placeholder.svg?height=700&width=1000',
    rangeKm: 120,
    topSpeed: 85,
    chargeHours: 4,
    colors: ['#111827', '#10b981', '#6b7280', '#f59e0b'],
    badge: 'Featured',
  },
  {
    id: 'city-rider',
    name: 'OMNI City Rider',
    price: 74999,
    image: '/placeholder.svg?height=700&width=1000',
    rangeKm: 110,
    topSpeed: 80,
    chargeHours: 4,
    colors: ['#111827', '#e11d48', '#6b7280', '#22d3ee'],
    badge: 'Popular',
  },
  {
    id: 'smart-series',
    name: 'OMNI Smart Series',
    price: 89999,
    image: '/placeholder.svg?height=700&width=1000',
    rangeKm: 125,
    topSpeed: 85,
    chargeHours: 4,
    colors: ['#111827', '#10b981', '#6b7280'],
    badge: 'New',
  },
  {
    id: 'tourer',
    name: 'OMNI Tourer',
    price: 99999,
    image: '/placeholder.svg?height=700&width=1000',
    rangeKm: 130,
    topSpeed: 90,
    chargeHours: 4,
    colors: ['#111827', '#10b981', '#6b7280', '#f43f5e'],
  },
]

export default function FeaturedModelsCarousel() {
  const [compare, setCompare] = React.useState<string[]>([])

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
        <Carousel
          opts={{ align: 'start', loop: true }}
          plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
          className="w-full"
        >
          <CarouselContent>
            {products.map((p) => (
              <CarouselItem key={p.id} className="basis-full sm:basis-1/2 lg:basis-1/3">
                <ProductCard model={p} onCompare={toggleCompare} compared={compare.includes(p.id)} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 bg-emerald-600 text-white hover:bg-emerald-700" />
          <CarouselNext className="right-0 bg-emerald-600 text-white hover:bg-emerald-700" />
        </Carousel>
      </div>
    </section>
  )
}

function ProductCard({ model, onCompare, compared }: { model: ProductModel; onCompare: (id: string, checked: boolean) => void; compared: boolean }) {
  const [loaded, setLoaded] = React.useState(false)
  return (
    <Card className="group overflow-hidden rounded-xl border border-gray-200 shadow-sm transition hover:shadow-lg">
      <div className="relative">
        {model.badge && (
          <div className="absolute left-3 top-3 z-10">
            <Badge className="bg-emerald-500 hover:bg-emerald-500">{model.badge}</Badge>
          </div>
        )}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {!loaded && <Skeleton className="absolute inset-0" />}
          <Image
            src={model.image || "/placeholder.svg"}
            alt={`${model.name} product image`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={cn('object-cover transition-transform duration-500', loaded ? 'scale-100' : 'scale-105', 'group-hover:scale-110')}
            onLoadingComplete={() => setLoaded(true)}
          />
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-3 text-xl">
          <span className="truncate">{model.name}</span>
          <span className="text-emerald-600 text-base font-semibold">₹{model.price.toLocaleString('en-IN')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-gray-700">
          <span className="inline-flex items-center gap-1"><BatteryCharging className="h-4 w-4 text-emerald-600" /> {model.rangeKm} KM</span>
          <span className="inline-flex items-center gap-1"><Gauge className="h-4 w-4 text-emerald-600" /> {model.topSpeed} KM/H</span>
          <span className="inline-flex items-center gap-1"><Timer className="h-4 w-4 text-emerald-600" /> {model.chargeHours} Hrs</span>
        </div>

        {/* Color options */}
        <div className="flex items-center gap-2">
          {model.colors.map((c) => (
            <span key={c} className="h-5 w-5 rounded-full ring-1 ring-gray-300" style={{ backgroundColor: c }} aria-label={`Color ${c}`} />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <OmniButton variant="primary" size="md">Get More Info</OmniButton>
          <OmniButton variant="secondary" size="md">Request Quote</OmniButton>
          <Dialog>
            <DialogTrigger asChild>
              <OmniButton variant="outline" size="md" startIcon={<Eye className="h-4 w-4" />}>Quick View</OmniButton>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{model.name}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-gray-200">
                  <Image src={model.image || "/placeholder.svg"} alt={`${model.name} image`} fill className="object-cover" />
                </div>
                <div className="space-y-4">
                  <div className="text-emerald-700 font-semibold">Starting from ₹{model.price.toLocaleString('en-IN')}</div>
                  <ul className="grid gap-2 text-sm text-gray-700">
                    <li className="inline-flex items-center gap-2"><BatteryCharging className="h-4 w-4 text-emerald-600" /> Range: {model.rangeKm} KM</li>
                    <li className="inline-flex items-center gap-2"><Gauge className="h-4 w-4 text-emerald-600" /> Top Speed: {model.topSpeed} KM/H</li>
                    <li className="inline-flex items-center gap-2"><Timer className="h-4 w-4 text-emerald-600" /> Charging: {model.chargeHours} Hours</li>
                  </ul>
                  <div className="flex gap-2">
                    <OmniButton variant="primary">Request Info</OmniButton>
                    <OmniButton variant="ghost">Find Dealer</OmniButton>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <div className="ml-auto inline-flex items-center gap-2">
            <Checkbox
              id={`compare-${model.id}`}
              checked={compared}
              onCheckedChange={(v) => onCompare(model.id, Boolean(v))}
              className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
            />
            <label htmlFor={`compare-${model.id}`} className="text-sm text-gray-700">Compare</label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
