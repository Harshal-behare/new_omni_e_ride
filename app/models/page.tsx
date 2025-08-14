'use client'

import * as React from 'react'
import Link from 'next/link'
import { models, MODELS } from '@/lib/models-data'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OmniButton } from '@/components/ui/omni-button'
import { Gauge, BatteryCharging, Timer, GitCompare } from 'lucide-react'
import FinanceTools from '@/components/calculators/finance-tools'
import WarrantyInfo from '@/components/warranty/warranty-info'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function ModelsListingPage() {
  const [q, setQ] = React.useState('')
  const [maxPrice, setMaxPrice] = React.useState(150000)
  const [sort, setSort] = React.useState('popular')
  const [compare, setCompare] = React.useState<string[]>([])

  const filtered = models
    .filter((m) => m.name.toLowerCase().includes(q.toLowerCase()))
    .filter((m) => m.price <= maxPrice)
    .sort((a, b) => {
      if (sort === 'low') return a.price - b.price
      if (sort === 'high') return b.price - a.price
      if (sort === 'new') return (b.releasedAt?.getTime() || 0) - (a.releasedAt?.getTime() || 0)
      return (b.rating || 0) - (a.rating || 0)
    })

  function toggleCompare(slug: string) {
    setCompare((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug)
      if (prev.length >= 2) return prev
      return [...prev, slug]
    })
  }

  const a = MODELS.find((m) => m.slug === compare[0])
  const b = MODELS.find((m) => m.slug === compare[1])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
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
                <SelectItem value="new">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <OmniButton variant="ghost" onClick={() => { setQ(''); setMaxPrice(150000); setSort('popular') }}>Clear Filters</OmniButton>
        </aside>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-gray-700">Showing {filtered.length} of {models.length} scooters</div>
            <CompareBar compare={compare} a={a} b={b} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => {
              const kwh = m.batteryWh ? (m.batteryWh / 1000).toFixed(1) : undefined
              const isSel = compare.includes(m.slug)
              return (
                <article key={m.id} className="group rounded-xl border p-3 hover:shadow-sm transition">
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={isSel}
                      disabled={!isSel && compare.length >= 2}
                      onChange={() => toggleCompare(m.slug)}
                    />
                    Compare
                  </label>
                  <Link href={`/models/${m.slug}`} className="mt-1 block overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={(m.images?.[0] as string) || '/placeholder.svg?height=600&width=900&query=electric%20scooter'} alt={m.name} className="h-40 w-full object-cover transition group-hover:scale-[1.02]" />
                  </Link>
                  <div className="mt-3">
                    <h3 className="text-lg font-semibold">{m.name}</h3>
                    <p className="text-sm text-gray-600">{m.tagline}</p>
                    <div className="mt-1 text-emerald-700 font-semibold">₹{m.price.toLocaleString('en-IN')}</div>

                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-700">
                      <span className="inline-flex items-center gap-1"><Gauge className="h-4 w-4 text-emerald-600" /> {m.topSpeed} km/h</span>
                      <span className="inline-flex items-center gap-1"><BatteryCharging className="h-4 w-4 text-emerald-600" /> {kwh ? `${kwh} kWh` : '—'}</span>
                      <span className="inline-flex items-center gap-1"><Timer className="h-4 w-4 text-emerald-600" /> {m.rangeKm} km</span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link href={`/models/${m.slug}`}>
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

          <FinanceTools variant="models" />
        </section>
      </div>
    </div>
  )
}

function CompareBar({ compare, a, b }: { compare: string[]; a?: typeof MODELS[number]; b?: typeof MODELS[number] }) {
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

function CompareCard({ m }: { m?: typeof MODELS[number] }) {
  if (!m) return <div className="rounded-xl border p-4 text-sm text-gray-600">Select a model</div>
  const kwh = m.specs.batteryWh ? (m.specs.batteryWh / 1000).toFixed(1) : undefined
  const principal = m.price
  const r = 0.1 / 12
  const n = 24
  const emi = Math.round(principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1))
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{m.name}</div>
        <div className="text-emerald-700 font-semibold">₹{m.price.toLocaleString('en-IN')}</div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.images[0] || '/placeholder.svg?height=700&width=1000&query=electric%20scooter'} alt={m.name} className="mt-3 h-36 w-full rounded-lg object-cover" />
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <Info label="Range" value={`${m.specs.rangeKm} km`} />
        <Info label="Top Speed" value={`${m.specs.topSpeed} km/h`} />
        <Info label="Charge" value={`${m.specs.chargeHours} hrs`} />
        <Info label="Battery" value={kwh ? `${kwh} kWh` : '—'} />
        <Info label="Motor" value={`${m.specs.motorPowerW ?? '—'} W`} />
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
