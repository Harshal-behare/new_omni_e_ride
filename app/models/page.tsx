'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OmniButton } from '@/components/ui/omni-button'
import { Gauge, BatteryCharging, Timer, GitCompare, ChevronRight } from 'lucide-react'
import FinanceTools from '@/components/calculators/finance-tools'
import WarrantyInfo from '@/components/warranty/warranty-info'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'

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
  battery_capacity?: string
  motor_power?: string
  description?: string
  type: string
  status: string
}

export default function ModelsListingPage() {
  const [q, setQ] = React.useState('')
  const [maxPrice, setMaxPrice] = React.useState(150000)
  const [sort, setSort] = React.useState('popular')
  const [compare, setCompare] = React.useState<string[]>([])
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchVehicles()
  }, [])

  async function fetchVehicles() {
    try {
      const response = await fetch('/api/vehicles')
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

  const filtered = vehicles
    .filter((v) => v.name.toLowerCase().includes(q.toLowerCase()))
    .filter((v) => (v.discounted_price || v.price) <= maxPrice)
    .sort((a, b) => {
      const priceA = a.discounted_price || a.price
      const priceB = b.discounted_price || b.price
      if (sort === 'low') return priceA - priceB
      if (sort === 'high') return priceB - priceA
      if (sort === 'range') return b.range_km - a.range_km
      return 0 // default (popular)
    })

  function toggleCompare(id: string) {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id)
      if (prev.length >= 2) return prev
      return [...prev, id]
    })
  }

  const a = vehicles.find((v) => v.id === compare[0])
  const b = vehicles.find((v) => v.id === compare[1])

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Our Electric Scooters</h1>
        <p className="text-gray-600">Find the perfect electric scooter for your needs</p>
      </header>

      <WarrantyInfo className="mb-8" compact />

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <div>
            <label className="text-sm font-medium">Search</label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search models…" className="mt-1 rounded-lg" />
          </div>
          <div>
            <label className="text-sm font-medium">Max Price (₹)</label>
            <div className="mt-2">
              <Slider defaultValue={[150000]} max={150000} min={50000} step={5000} onValueChange={(v) => setMaxPrice(v[0])} />
              <div className="mt-1 text-xs text-gray-600">Up to ₹{maxPrice.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Sort</label>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="mt-1 w-full rounded-lg"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="low">Price: Low to High</SelectItem>
                <SelectItem value="high">Price: High to Low</SelectItem>
                <SelectItem value="range">Range: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <OmniButton variant="ghost" onClick={() => { setQ(''); setMaxPrice(150000); setSort('popular') }}>Clear Filters</OmniButton>
        </aside>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-gray-700">Showing {filtered.length} of {vehicles.length} vehicles</div>
            <CompareBar compare={compare} vehicles={vehicles} a={a} b={b} />
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl border p-3 space-y-3">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((v) => {
                const isSel = compare.includes(v.id)
                const displayPrice = v.discounted_price || v.price
                return (
                  <article key={v.id} className="group rounded-xl border p-3 hover:shadow-sm transition">
                    <label className="inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={isSel}
                        disabled={!isSel && compare.length >= 2}
                        onChange={() => toggleCompare(v.id)}
                      />
                      Compare
                    </label>
                    <Link href={`/models/${v.slug}`} className="mt-1 block overflow-hidden rounded-lg">
                      <div className="relative h-40 w-full">
                        <Image 
                          src={v.images?.[0] || '/placeholder.svg?height=600&width=900'} 
                          alt={v.name} 
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition group-hover:scale-[1.02]" 
                        />
                      </div>
                    </Link>
                    <div className="mt-3">
                      <h3 className="text-lg font-semibold">{v.name}</h3>
                      <p className="text-sm text-gray-600">{v.description?.slice(0, 60)}...</p>
                      <div className="mt-1">
                        {v.discounted_price && (
                          <span className="text-sm line-through text-gray-400">₹{v.price.toLocaleString('en-IN')}</span>
                        )}
                        <div className="text-emerald-700 font-semibold">₹{displayPrice.toLocaleString('en-IN')}</div>
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-700">
                        <span className="inline-flex items-center gap-1"><Timer className="h-4 w-4 text-emerald-600" /> {v.charging_time_hours} hrs</span>
                        <span className="inline-flex items-center gap-1"><BatteryCharging className="h-4 w-4 text-emerald-600" /> {v.battery_capacity || '—'}</span>
                        <span className="inline-flex items-center gap-1"><Gauge className="h-4 w-4 text-emerald-600" /> {v.range_km} km</span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <Link href={`/models/${v.slug}`}>
                          <OmniButton>View Details</OmniButton>
                        </Link>
                        <Link href="/dealers">
                          <OmniButton variant="outline">Find Dealer</OmniButton>
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          <FinanceTools variant="models" />
        </section>
      </div>
      </div>
      <SiteFooter />
    </div>
  )
}

function CompareBar({ compare, vehicles, a, b }: { compare: string[]; vehicles: Vehicle[]; a?: Vehicle; b?: Vehicle }) {
  const disabled = compare.length !== 2
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
          disabled={disabled}
          aria-disabled={disabled}
          title={disabled ? 'Select 2 models to compare' : 'Compare selected models'}
        >
          <GitCompare className="h-4 w-4" /> Compare {compare.length}/2
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] md:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Compare Models</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <CompareCard m={a} />
          <CompareCard m={b} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CompareCard({ m }: { m?: Vehicle }) {
  if (!m) return <div className="rounded-xl border p-4 text-sm text-gray-600">Select a model</div>
  const displayPrice = m.discounted_price || m.price
  const principal = displayPrice
  const r = 0.1 / 12
  const n = 24
  const emi = Math.round(principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1))
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{m.name}</div>
        <div className="text-emerald-700 font-semibold">₹{displayPrice.toLocaleString('en-IN')}</div>
      </div>
      <div className="relative h-36 w-full mt-3 rounded-lg overflow-hidden">
        <Image 
          src={m.images?.[0] || '/placeholder.svg?height=700&width=1000'} 
          alt={m.name} 
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover" 
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <Info label="Range" value={`${m.range_km} km`} />
        <Info label="Top Speed" value={`${m.top_speed_kmph} km/h`} />
        <Info label="Charge" value={`${m.charging_time_hours} hrs`} />
        <Info label="Battery" value={m.battery_capacity || '—'} />
        <Info label="Motor" value={m.motor_power || '—'} />
        <Info label="EMI (24 mo, 10%)" value={`₹${emi.toLocaleString('en-IN')}`} />
      </div>
      <Link href={`/models/${m.slug}`} className="mt-3 inline-flex text-emerald-700 text-sm hover:underline">View details</Link>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-2">
      <div className="text-xs text-gray-600">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  )
}
