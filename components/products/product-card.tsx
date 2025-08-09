'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OmniButton } from '@/components/ui/omni-button'
import { BatteryCharging, Gauge, Timer, Star } from 'lucide-react'
import { type Model } from '@/lib/models-data'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export function ProductCard({ model, onLead }: { model: Model; onLead?: (m: Model) => void }) {
  const [loaded, setLoaded] = React.useState(false)

  return (
    <Card className="group overflow-hidden rounded-xl border border-gray-200 shadow-sm transition hover:shadow-lg">
      <div className="relative">
        {model.badges?.[0] && (
          <div className="absolute left-3 top-3 z-10">
            <Badge className="bg-emerald-500 hover:bg-emerald-500">{model.badges[0]}</Badge>
          </div>
        )}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {!loaded && <Skeleton className="absolute inset-0" />}
          <Image
            src={model.images[0] || '/placeholder.svg'}
            alt={`${model.name} image`}
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
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="truncate">{model.tagline}</span>
          <span className="ml-auto inline-flex items-center gap-1 text-gray-700"><Star className="h-4 w-4 text-emerald-600" /> {model.rating.toFixed(1)} ({model.reviews})</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-gray-700">
          <span className="inline-flex items-center gap-1"><BatteryCharging className="h-4 w-4 text-emerald-600" /> {model.specs.rangeKm} KM</span>
          <span className="inline-flex items-center gap-1"><Gauge className="h-4 w-4 text-emerald-600" /> {model.specs.topSpeed} KM/H</span>
          <span className="inline-flex items-center gap-1"><Timer className="h-4 w-4 text-emerald-600" /> {model.specs.chargeHours} Hrs</span>
        </div>
        <div className="flex items-center gap-2">
          {model.colors.map((c) => (
            <span key={c} className="h-5 w-5 rounded-full ring-1 ring-gray-300" style={{ backgroundColor: c }} aria-label={`Color ${c}`} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/models/${model.slug}`}><OmniButton size="md">View Details</OmniButton></Link>
          <OmniButton variant="secondary" size="md" onClick={() => onLead?.(model)}>Get More Info</OmniButton>
          <Link href="/dealers"><OmniButton variant="outline" size="md">Find Dealer</OmniButton></Link>
        </div>
      </CardContent>
    </Card>
  )
}
