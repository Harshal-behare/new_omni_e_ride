'use client'

import * as React from 'react'
import { MODELS } from '@/lib/models-data'
import { OmniButton } from '@/components/ui/omni-button'
import { SignaturePad } from './signature-pad'
import { submitWarranty } from '@/lib/stores/warranties'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export function WarrantyRegistrationForm({
  dealerName = 'Green Wheels Bengaluru',
  defaultCustomer,
  onSubmitted,
  className,
}: {
  dealerName?: string
  defaultCustomer?: { name: string; email: string; phone?: string }
  onSubmitted?: (id: string) => void
  className?: string
}) {
  const [modelId, setModelId] = React.useState(MODELS[0]?.id ?? '')
  const model = MODELS.find((m) => m.id === modelId)!
  const [periodYears, setPeriodYears] = React.useState<1 | 2 | 3>(2)
  const [invoice, setInvoice] = React.useState<string>('')
  const [sig, setSig] = React.useState<string>('')
  const [agree, setAgree] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setInvoice(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!agree) return alert('Please accept the warranty terms.')
    const fd = new FormData(e.currentTarget)
    const customerName = String(fd.get('customerName') || '')
    const email = String(fd.get('customerEmail') || '')
    const phone = String(fd.get('phone') || '')
    const vin = String(fd.get('vin') || '')
    const purchaseDate = String(fd.get('purchaseDate') || '')
    if (!customerName || !email || !vin || !purchaseDate) return alert('Please fill all required fields.')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 500))
    const rec = submitWarranty({
      customerEmail: email,
      customerName,
      phone,
      modelId,
      modelName: model.name,
      vin,
      purchaseDate,
      periodYears,
      dealerName,
      invoiceImage: invoice,
      signatureDataUrl: sig,
    })
    setLoading(false)
    onSubmitted?.(rec.id)
    alert('Warranty submitted for admin review.')
  }

  return (
    <form onSubmit={onSubmit} className={cn('grid gap-4', className)}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Customer Name" name="customerName" defaultValue={defaultCustomer?.name} required />
        <Field label="Customer Email" name="customerEmail" type="email" defaultValue={defaultCustomer?.email} required />
        <Field label="Phone" name="phone" defaultValue={defaultCustomer?.phone} />
        <div>
          <Label className="text-sm">Model</Label>
          <select className="mt-1 w-full rounded-lg border px-3 py-2" value={modelId} onChange={(e) => setModelId(e.target.value)}>
            {MODELS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <Field label="VIN / Chassis No." name="vin" required />
        <Field label="Purchase Date" name="purchaseDate" type="date" required />
        <div>
          <Label className="text-sm">Warranty Period</Label>
          <select className="mt-1 w-full rounded-lg border px-3 py-2" value={periodYears} onChange={(e) => setPeriodYears(Number(e.target.value) as any)}>
            <option value={1}>1 Year</option>
            <option value={2}>2 Years</option>
            <option value={3}>3 Years</option>
          </select>
        </div>
        <div>
          <Label className="text-sm">Dealer</Label>
          <Input value={dealerName} readOnly />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Purchase Invoice (photo)</Label>
          <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={onFile} />
          {invoice && <img src={invoice || "/placeholder.svg"} alt="Invoice preview" className="mt-2 h-28 w-auto rounded border object-contain" />}
        </div>
        <SignaturePad onChange={setSig} />
      </div>

      <label className="mt-2 inline-flex items-start gap-2 text-sm">
        <Checkbox checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} className="translate-y-0.5" />
        <span>I accept the detailed warranty terms and conditions.</span>
      </label>

      <div className="flex gap-2">
        <OmniButton type="submit" loading={loading}>Submit Warranty</OmniButton>
      </div>
      <p className="text-xs text-gray-600">Automatic warranty period calculation is applied based on selected period and purchase date. Admin will verify documents and approve.</p>
    </form>
  )
}

function Field({ label, name, required, type = 'text', defaultValue }: { label: string; name: string; type?: string; required?: boolean; defaultValue?: string }) {
  return (
    <label className="text-sm">
      <div className="font-medium text-gray-800">{label}</div>
      <Input className="mt-1" name={name} required={required} type={type} defaultValue={defaultValue} />
    </label>
  )
}
