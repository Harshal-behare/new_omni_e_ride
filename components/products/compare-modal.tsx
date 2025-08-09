'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { OmniButton } from '@/components/ui/omni-button'
import { MODELS, type Model } from '@/lib/models-data'

export function CompareModal({ selected }: { selected: string[] }) {
  const items: Model[] = MODELS.filter((m) => selected.includes(m.id))
  if (items.length === 0) return null
  return (
    <Dialog>
      <DialogTrigger asChild>
        <OmniButton variant="primary">Compare ({items.length})</OmniButton>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader><DialogTitle>Compare Models</DialogTitle></DialogHeader>
        <div className="grid md:grid-cols-3 gap-4">
          {items.map((m) => (
            <div key={m.id} className="rounded-lg border p-3">
              <div className="font-semibold">{m.name}</div>
              <div className="text-sm text-gray-600">{m.tagline}</div>
              <ul className="mt-3 text-sm">
                <li>Price: ₹{m.price.toLocaleString('en-IN')}</li>
                <li>Range: {m.specs.rangeKm} KM</li>
                <li>Top Speed: {m.specs.topSpeed} KM/H</li>
                <li>Charging: {m.specs.chargeHours} Hours</li>
                <li>Motor: {m.specs.motorPowerW} W</li>
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
