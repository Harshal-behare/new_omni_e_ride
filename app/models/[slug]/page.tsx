'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { OmniButton } from '@/components/ui/omni-button'
import { BatteryCharging, Gauge, Timer, Zap, BadgeCheck, Sparkles, TestTube, ChevronRight } from 'lucide-react'
import ImageGallery from '@/components/products/image-gallery'
import ColorSwatches from '@/components/products/color-swatches'
import FinanceTools from '@/components/calculators/finance-tools'
import WarrantyInfo from '@/components/warranty/warranty-info'

interface Vehicle {
  id: string
  name: string
  slug: string
  price: number
  discounted_price?: number
  type: string
  brand: string
  model: string
  images: string[]
  colors: string[]
  range_km: number
  top_speed_kmph: number
  charging_time_hours: number
  battery_capacity?: string
  motor_power?: string
  features?: any
  specifications?: any
  description?: string
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [model, setModel] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchModel = async () => {
      try {
        const response = await fetch(`/api/vehicles`)
        const vehicles = await response.json()
        const vehicle = vehicles.find((v: Vehicle) => v.slug === resolvedParams.slug)
        setModel(vehicle || null)
      } catch (error) {
        console.error('Error fetching model:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchModel()
  }, [resolvedParams.slug])

  const handleTestRide = () => {
    // Store the redirect info in sessionStorage
    sessionStorage.setItem('testRideRedirect', JSON.stringify({
      from: 'test-ride',
      model: model?.name,
      slug: model?.slug
    }))
    router.push('/signup')
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!model) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-2xl font-bold">Model not found</h1>
        <Link className="text-emerald-700 hover:underline" href="/models">Back to Models</Link>
      </div>
    )
  }

  // Direct access to fields from database
  const batteryCapacity = model.battery_capacity || '—'
  const motorPower = model.motor_power || '—'

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-10">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-600 mb-6">
        <Link href="/" className="hover:text-gray-900 transition-colors">
          Home
        </Link>
        <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
        <Link href="/models" className="hover:text-gray-900 transition-colors">
          Models
        </Link>
        <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
        <span className="text-gray-900 font-medium">{model.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ImageGallery images={model.images} alt={model.name} />

        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{model.name}</h1>
              <p className="text-gray-600">{model.type || model.brand}</p>
            </div>
            {model.type && (
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 text-xs ring-1 ring-emerald-200">
                  <Sparkles className="h-3 w-3" /> {model.type.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>

          <div className="mt-2">
            {model.discounted_price && (
              <span className="text-sm line-through text-gray-400 mr-2">₹{model.price.toLocaleString('en-IN')}</span>
            )}
            <span className="text-emerald-700 text-xl font-semibold">
              ₹{(model.discounted_price || model.price).toLocaleString('en-IN')}
            </span>
          </div>

          {model.colors && model.colors.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-800 mb-2">Available Colors</div>
              <div className="flex gap-2">
                {model.colors.map((color, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 rounded-full text-xs border border-gray-300 bg-gray-50"
                  >
                    {color}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Spec label="Range" value={`${model.range_km || 0} km`} icon={<BatteryCharging className="h-4 w-4 text-emerald-600" />} />
            <Spec label="Top Speed" value={`${model.top_speed_kmph || 0} km/h`} icon={<Gauge className="h-4 w-4 text-emerald-600" />} />
            <Spec label="Charging Time" value={`${model.charging_time_hours || 0} hours`} icon={<Timer className="h-4 w-4 text-emerald-600" />} />
            <Spec label="Motor Power" value={motorPower} icon={<Zap className="h-4 w-4 text-emerald-600" />} />
            <Spec label="Battery Capacity" value={batteryCapacity} icon={<BatteryCharging className="h-4 w-4 text-emerald-600" />} />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <OmniButton 
              variant="primary" 
              onClick={handleTestRide}
              startIcon={<TestTube className="h-4 w-4" />}
            >
              Book Test Ride
            </OmniButton>
            <Link href="/dealers"><OmniButton variant="secondary">Find Dealer</OmniButton></Link>
            <a href="#finance" className="text-emerald-700 hover:underline text-sm self-center">See Savings & EMI</a>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold">Description</h2>
            <p className="mt-2 text-sm text-gray-700">
              {model.description || 'Experience the perfect blend of performance, efficiency, and style with this electric vehicle.'}
            </p>
          </div>
          
          {model.features && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold">Features</h2>
              <div className="mt-2 text-sm text-gray-700">
                {typeof model.features === 'object' && Array.isArray(model.features) ? (
                  <ul className="grid gap-1">
                    {model.features.map((feature: string, index: number) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                ) : typeof model.features === 'object' ? (
                  <ul className="grid gap-1">
                    {Object.entries(model.features).map(([key, value], index) => (
                      <li key={index}>• {key}: {String(value)}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{String(model.features)}</p>
                )}
              </div>
            </div>
          )}
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
