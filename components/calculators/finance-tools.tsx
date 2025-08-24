'use client'

import * as React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SavingsCalculator from './savings-calculator'
import EMICalculator from './emi-calculator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

type Variant = 'home' | 'models' | 'model-detail'

type Vehicle = {
  id: string
  name: string
  slug: string
  price: number
  discounted_price?: number
  range_km: number
  top_speed_kmph: number
  charging_time_hours: number
  colors: string[]
  type: string
  status: string
}

export default function FinanceTools({ variant, modelSlug }: { variant: Variant; modelSlug?: string }) {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedSlug, setSelectedSlug] = React.useState<string>('')

  React.useEffect(() => {
    fetchVehicles()
  }, [])

  async function fetchVehicles() {
    try {
      const response = await fetch('/api/vehicles')
      if (response.ok) {
        const data = await response.json()
        setVehicles(data)
        // Set initial slug
        if (variant === 'model-detail' && modelSlug) {
          setSelectedSlug(modelSlug)
        } else if (data.length > 0) {
          setSelectedSlug(data[0].slug)
        }
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const model = React.useMemo(() => vehicles.find((v) => v.slug === selectedSlug), [selectedSlug, vehicles])

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-4">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </section>
    )
  }

  if (!model || vehicles.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="text-center py-12">
          <p className="text-gray-500">No vehicles available for calculation.</p>
        </div>
      </section>
    )
  }

  const displayPrice = model.discounted_price || model.price

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Plan Your Savings</h2>
        {variant !== 'model-detail' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Model</span>
            <Select value={selectedSlug} onValueChange={setSelectedSlug}>
              <SelectTrigger className="w-56 rounded-lg">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => <SelectItem key={v.slug} value={v.slug}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Tabs defaultValue="savings" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="savings">Cost Savings</TabsTrigger>
          <TabsTrigger value="emi">EMI</TabsTrigger>
        </TabsList>
        <TabsContent value="savings" className="mt-4">
          <SavingsCalculator model={{ name: model.name, evUnitsPer100Km: 1.5, petrolKmPerL: 50 }} />
        </TabsContent>
        <TabsContent value="emi" className="mt-4">
          <EMICalculator price={displayPrice} annualRatePct={12} />
        </TabsContent>
      </Tabs>
    </section>
  )
}
