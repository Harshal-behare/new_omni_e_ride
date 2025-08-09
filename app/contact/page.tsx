'use client'

import { useForm } from 'react-hook-form'
import { OmniButton } from '@/components/ui/omni-button'
import { Phone, Mail, MapPin, Clock, CheckCircle2 } from 'lucide-react'

type FormVals = {
  name: string
  email: string
  phone: string
  subject: string
  message: string
  priority: 'normal' | 'urgent'
}

export default function ContactPage() {
  const { register, handleSubmit, reset } = useForm<FormVals>({ defaultValues: { priority: 'normal' } })
  function onSubmit(v: FormVals) {
    alert('Message sent (demo). Replace with POST /api/contact')
    reset()
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-8 text-white">
        <h1 className="text-3xl font-extrabold">Get in Touch with OMNI E-RIDE</h1>
        <p className="mt-1 text-emerald-100">We&apos;re here to help you with all your electric scooter needs.</p>
        <div className="mt-4 flex flex-wrap gap-6 text-emerald-50 text-sm">
          <Info icon={<Phone className="h-4 w-4" />} text="+91 98765 43210" />
          <Info icon={<Mail className="h-4 w-4" />} text="support@omnideride.com" />
          <Info icon={<MapPin className="h-4 w-4" />} text="MG Road, Bengaluru 560001" />
          <Info icon={<Clock className="h-4 w-4" />} text="Mon–Sat: 9:00–18:00" />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <aside className="space-y-4">
          <TrustBadge text="Fast responses within 24 hours" />
          <TrustBadge text="Dedicated EV experts" />
          <TrustBadge text="Pan-India service network" />
        </aside>

        <section className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-2xl border bg-white/70 backdrop-blur">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.08),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.08),transparent_35%)]" />
            <form onSubmit={handleSubmit(onSubmit)} className="relative grid gap-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name"><input className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" {...register('name', { required: true })} /></Field>
                <Field label="Email Address"><input type="email" className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" {...register('email', { required: true })} /></Field>
                <Field label="Phone Number"><input className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" {...register('phone', { required: true })} /></Field>
                <Field label="Subject">
                  <select className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" {...register('subject', { required: true })}>
                    <option>General Inquiry</option>
                    <option>Sales Question</option>
                    <option>Service Support</option>
                    <option>Warranty Claim</option>
                    <option>Partnership Inquiry</option>
                    <option>Complaint/Feedback</option>
                    <option>Media Inquiry</option>
                  </select>
                </Field>
              </div>
              <Field label="Message"><textarea rows={6} className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" {...register('message', { required: true })} /></Field>
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm">
                  Priority:
                  <select className="rounded-md border px-2 py-1" {...register('priority')}>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </label>
                <OmniButton type="submit">Send Message</OmniButton>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      <div className="font-medium text-gray-800">{label}</div>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <span className="inline-flex items-center gap-2">{icon}{text}</span>
}

function TrustBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border p-3">
      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      <div className="text-sm font-medium">{text}</div>
    </div>
  )
}
