'use client'

import * as React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SavingsCalculator from './savings-calculator'
import EMICalculator from './emi-calculator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MODELS } from '@/lib/models-data'

type Variant = 'home' | 'models' | 'model-detail'

export default function FinanceTools({ variant, modelSlug }: { variant: Variant; modelSlug?: string }) {
  const defaultModel = React.useMemo(() => {
    if (variant === 'model-detail' && modelSlug) return MODELS.find((m) => m.slug === modelSlug)
    return MODELS[0]
  }, [variant, modelSlug])

  const [slug, setSlug] = React.useState<string>(defaultModel?.slug || MODELS[0].slug)
  const model = React.useMemo(() => MODELS.find((m) => m.slug === slug) || MODELS[0], [slug])

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Plan Your Savings</h2>
        {variant !== 'model-detail' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Model</span>
            <Select value={slug} onValueChange={setSlug}>
              <SelectTrigger className="w-56 rounded-lg">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => <SelectItem key={m.slug} value={m.slug}>{m.name}</SelectItem>)}
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
          <SavingsCalculator model={{ name: model.name, evUnitsPer100Km: model?.evUnitsPer100Km, petrolKmPerL: 50 }} />
        </TabsContent>
        <TabsContent value="emi" className="mt-4">
          <EMICalculator price={model.price} />
        </TabsContent>
      </Tabs>
    </section>
  )
}
