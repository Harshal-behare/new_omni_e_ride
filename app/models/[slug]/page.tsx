'use client'

import { MODELS } from '@/lib/models-data'
import Link from 'next/link'
import { OmniButton } from '@/components/ui/omni-button'
import { BatteryCharging, Gauge, Timer, Zap, BadgeCheck, Sparkles } from 'lucide-react'
import ImageGallery from '@/components/products/image-gallery'
import ColorSwatches from '@/components/products/color-swatches'
import FinanceTools from '@/components/calculators/finance-tools'
import WarrantyInfo from '@/components/warranty/warranty-info'

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const model = MODELS.find((m) => m.slug === params.slug)
  if (!model) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-2xl font-bold">Model not found</h1>
        <Link className="text-emerald-700 hover:underline" href="/models">Back to Models</Link>
      </div>
    )
  }

  const kwh = model.specs.batteryWh ? (model.specs.batteryWh / 1000).toFixed(1) : undefined

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <ImageGallery images={model.images} alt={model.name} />

        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{model.name}</h1>
              <p className="text-gray-600">{model.tagline}</p>
            </div>
            {model.badges?.length ? (
              <div className="flex gap-2">
                {model.badges.map((b) => (
                  <span key={b} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 text-xs ring-1 ring-emerald-200">
                    <Sparkles className="h-3 w-3" /> {b}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-2 text-emerald-700 text-xl font-semibold">₹{model.price.toLocaleString('en-IN')}</div>

          <div className="mt-4">
            <div className="text-sm font-medium text-gray-800 mb-2">Colors</div>
            <ColorSwatches colors={model.colors} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Spec label="Range" value={`${model.specs.rangeKm} km`} icon={<BatteryCharging className="h-4 w-4 text-emerald-600" />} />
            <Spec label="Top Speed" value={`${model.specs.topSpeed} km/h`} icon={<Gauge className="h-4 w-4 text-emerald-600" />} />
            <Spec label="Charging Time" value={`${model.specs.chargeHours} hrs`} icon={<Timer className="h-4 w-4 text-emerald-600" />} />
            <Spec label="Motor Power" value={`${model.specs.motorPowerW || '—'} W`} icon={<Zap className="h-4 w-4 text-emerald-600" />} />
            <Spec label="Battery Capacity" value={kwh ? `${kwh} kWh` : '—'} icon={<BatteryCharging className="h-4 w-4 text-emerald-600" />} />
            <Spec label="Warranty" value="2 years vehicle, battery per policy" icon={<BadgeCheck className="h-4 w-4 text-emerald-600" />} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/dealers"><OmniButton variant="primary">Find Dealer</OmniButton></Link>
            <a href="#finance" className="text-emerald-700 hover:underline text-sm">See Savings & EMI</a>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold">Highlights</h2>
            <ul className="mt-2 grid gap-1 text-sm text-gray-700">
              <li>• Responsive acceleration and regenerative braking</li>
              <li>• Connected app features with anti-theft alerts</li>
              <li>• IP67-rated battery with thermal management</li>
              <li>• Tubeless tires and combi braking system</li>
            </ul>
          </div>
        </div>
      </div>

      <WarrantyInfo compact />

      <div id="finance">
        <FinanceTools variant="model-detail" modelSlug={model.slug} />
      </div>
    </div>
  )
}

function Spec({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-gray-600 inline-flex items-center gap-2">{icon}{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  )
}
