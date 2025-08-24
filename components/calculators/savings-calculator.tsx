'use client'

import * as React from 'react'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const DEFAULTS = { evUnitsPer100Km: 1.7, petrolKmPerL: 50, electricityRate: 8.0, petrolPrice: 108 }

export type SavingsCalculatorProps = {
  className?: string
  model?: {
    evUnitsPer100Km?: number
    petrolKmPerL?: number
    name?: string
  }
}

export default function SavingsCalculator({ className, model }: SavingsCalculatorProps) {
  const [dailyKm, setDailyKm] = React.useState(75)
  const [electricityRate, setElectricityRate] = React.useState(DEFAULTS.electricityRate)

  const evUnitsPer100 = model?.evUnitsPer100Km ?? DEFAULTS.evUnitsPer100Km
  const petrolKmPerL = model?.petrolKmPerL ?? DEFAULTS.petrolKmPerL
  const petrolPrice = DEFAULTS.petrolPrice
  const modelLabel = model?.name || 'OMNI E‑Ride'

  const { monthlySavings, annualSavings, petrolTotal, evTotal } = React.useMemo(() => {
    const monthlyKm = dailyKm * 30
    const evUnits = (evUnitsPer100 / 100) * monthlyKm
    const evRunning = evUnits * electricityRate
    const petrolLiters = monthlyKm / petrolKmPerL
    const petrolRunning = petrolLiters * petrolPrice
    const petrolMaint = 800
    const evMaint = 320
    const evTotal = Math.round(evRunning + evMaint)
    const petrolTotal = Math.round(petrolRunning + petrolMaint)
    const monthly = Math.max(0, petrolTotal - evTotal)
    return { monthlySavings: Math.round(monthly), annualSavings: Math.round(monthly * 12), petrolTotal, evTotal }
  }, [dailyKm, evUnitsPer100, electricityRate, petrolKmPerL, petrolPrice])

  const max = Math.max(petrolTotal, evTotal, 1)

  return (
    <Card className={cn('w-full rounded-2xl p-6 md:p-8', className)}>
      <h3 className="text-2xl md:text-3xl font-bold text-center">Buying an EV is money in the bank.</h3>
      <p className="text-center text-sm text-gray-600">Calculate for yourself.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <KPI label="Annual Savings" value={annualSavings} />
        <KPI label="Monthly Savings" value={monthlySavings} />
      </div>

      <div className="mt-6 grid gap-4">
        <div>
          <label className="text-sm font-medium">Daily distance: {dailyKm} km</label>
          <Slider value={[dailyKm]} min={15} max={100} step={1} onValueChange={(v) => setDailyKm(v[0])} className="mt-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Electricity rate (₹/unit)</label>
          <input
            type="number"
            min={3}
            step={0.1}
            value={electricityRate}
            onChange={(e) => setElectricityRate(parseFloat(e.target.value || '0'))}
            className="rounded-md border px-3 py-2 mt-2 w-full max-w-xs"
          />
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Monthly Cost Comparison</h4>
        <div className="space-y-4">
          <Bar label="Petrol Scooter" amount={petrolTotal} color="bg-rose-500" widthPct={100} />
          <Bar label={modelLabel} amount={evTotal} color="bg-emerald-500" widthPct={(evTotal / petrolTotal) * 100} />
        </div>
      </div>
    </Card>
  )
}

function KPI({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-200">
      <div className="text-3xl font-extrabold text-emerald-700">₹{value.toLocaleString('en-IN')}</div>
      <div className="text-xs text-emerald-700/80">{label}</div>
    </div>
  )
}

function Bar({ label, amount, color, widthPct }: { label: string; amount: number; color: string; widthPct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <div className="text-gray-700">{label}</div>
        <div className="font-semibold text-gray-900">₹{amount.toLocaleString('en-IN')}</div>
      </div>
      <div className="relative">
        <div className="h-10 w-full rounded-md bg-gray-100">
          <div className={cn('h-10 rounded-md text-white text-sm font-medium flex items-center justify-end pr-3 transition-all duration-500', color)} style={{ width: `${Math.max(15, widthPct)}%` }}>
            ₹{amount.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </div>
  )
}
