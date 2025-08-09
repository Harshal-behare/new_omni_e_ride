'use client'

import { ShieldCheck, Leaf, Smartphone, MapPinned } from 'lucide-react'

const features = [
  {
    icon: ShieldCheck,
    title: 'Premium Quality',
    desc: 'Built with highest quality materials and cutting-edge technology for durability and performance.',
  },
  {
    icon: Leaf,
    title: '100% Eco-Friendly',
    desc: 'Zero emissions, reduced carbon footprint, contributing to a cleaner and greener future.',
  },
  {
    icon: Smartphone,
    title: 'Smart Technology',
    desc: 'IoT connectivity, mobile app integration, GPS tracking, and intelligent battery management.',
  },
  {
    icon: MapPinned,
    title: 'Wide Service Network',
    desc: '50+ authorized dealers and service centers across India for sales and after-sales support.',
  },
]

export default function WhyChooseUs() {
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Why Choose OMNI E-RIDE?</h2>
          <p className="mt-2 text-gray-600">Leading the electric revolution with innovation and quality</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-lg bg-white p-6 shadow-md ring-1 ring-gray-200 transition-transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                <f.icon className="h-6 w-6 text-emerald-500" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
