'use client'

import * as React from 'react'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'

export type EMICalculatorProps = {
  price: number
  annualRatePct?: number // default 10%
  className?: string
}

const TENURES = [6, 12, 18, 24, 36]

export default function EMICalculator({ price, annualRatePct = 12, className }: EMICalculatorProps) {
  const [down, setDown] = React.useState(Math.min(50000, Math.round(price * 0.15)))
  const [tenure, setTenure] = React.useState<number>(12)

  const principal = Math.max(0, price - down)
  const r = (annualRatePct / 100) / 12
  const n = tenure
  const emi = n > 0 && r > 0 ? principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : principal / Math.max(1, n)
  const total = emi * n
  const interest = total - principal

  return (
    <Card className={className ? className : 'rounded-2xl p-6 md:p-8'}>
      <h3 className="text-xl md:text-2xl font-bold">Plan Your Electric Vehicle Purchase</h3>
      <p className="text-sm text-gray-600">Fixed interest 12% p.a. Adjust down payment and tenure.</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-sm text-gray-600">Vehicle Price</div>
          <div className="text-lg font-semibold text-gray-900">₹{price.toLocaleString('en-IN')}</div>
        </div>
        <div>
          <label className="text-sm font-medium">Down payment: ₹{down.toLocaleString('en-IN')}</label>
          <Slider value={[down]} min={0} max={Math.min(100000, price - 1000)} step={1000} onValueChange={(v) => setDown(v[0])} className="mt-2" />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Loan tenure</label>
          <Select value={String(tenure)} onValueChange={(v) => setTenure(parseInt(v))}>
            <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TENURES.map((m) => <SelectItem key={m} value={String(m)}>{m} months</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
          <div className="text-xs text-emerald-700/80">Your Monthly EMI</div>
          <div className="text-2xl font-extrabold text-emerald-700">₹{Math.round(emi).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Principal" value={principal} />
        <Stat label="Total Payable" value={Math.round(total)} />
        <Stat label="Total Interest" value={Math.round(interest)} />
      </div>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-base font-semibold">₹{value.toLocaleString('en-IN')}</div>
    </div>
  )
}
