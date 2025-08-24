'use client'

import Link from 'next/link'
import { Leaf, Smartphone, ChevronDown } from 'lucide-react'
import { OmniButton } from '@/components/ui/omni-button'

export default function Hero() {

  return (
    <section id="hero" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 to-emerald-100" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
              Experience the Future of Urban Mobility
            </h1>
            <p className="text-lg md:text-xl text-gray-600">
              Discover our range of premium electric scooters designed for modern city life.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/models">
                <OmniButton size="xl" variant="primary">Explore Models</OmniButton>
              </Link>
              <Link href="/dealers">
                <OmniButton size="xl" variant="outline">Find Dealers</OmniButton>
              </Link>
            </div>

            {/* Removed subscribe form and schedule callback dialog as requested */}

            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Leaf className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                <span className="text-sm md:text-base">Zero Emissions</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Smartphone className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                <span className="text-sm md:text-base">Smart Features</span>
              </div>
            </div>
          </div>

          {/* Hero image */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/3] w-full rounded-2xl bg-white shadow-md ring-1 ring-gray-200 overflow-hidden">
              <img
                src="/placeholder.svg?height=800&width=1000"
                alt="Modern electric scooter in emerald accents"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.08),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.08),transparent_40%)]" />
            </div>
          </div>
        </div>
      </div>

      <a href="#featured" className="group absolute inset-x-0 bottom-6 mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/80 ring-1 ring-gray-200 hover:bg-white transition">
        <ChevronDown className="h-5 w-5 text-emerald-600 group-hover:translate-y-0.5 transition" />
        <span className="sr-only">Scroll to featured models</span>
      </a>
    </section>
  )
}
