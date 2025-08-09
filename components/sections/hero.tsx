'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { BatteryCharging, Leaf, Smartphone, ChevronDown } from 'lucide-react'
import { OmniButton } from '@/components/ui/omni-button'
import { Input } from '@/components/ui/input'

function useCountUp(target: number, duration = 1200) {
  const ref = useRef<HTMLSpanElement | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const val = Math.floor(p * target)
      el.textContent = `${val.toLocaleString()}`
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return ref
}

export default function Hero() {
  const customersRef = useCountUp(5000)
  const dealersRef = useCountUp(50)
  const satisfactionRef = useCountUp(99)

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
                <BatteryCharging className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                <span className="text-sm md:text-base">100+ KM Range</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Leaf className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                <span className="text-sm md:text-base">Zero Emissions</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Smartphone className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                <span className="text-sm md:text-base">Smart Features</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 max-w-xl">
              <Stat label="Happy Customers" valueRef={customersRef} suffix="+" />
              <Stat label="Dealer Network" valueRef={dealersRef} suffix="+" />
              <Stat label="Satisfaction" valueRef={satisfactionRef} suffix="%" />
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

function Stat({ label, valueRef, suffix }: { label: string; valueRef: React.MutableRefObject<HTMLSpanElement | null>; suffix?: string }) {
  return (
    <div className="rounded-lg bg-white/70 ring-1 ring-gray-200 p-4 text-center">
      <div className="text-2xl font-bold text-gray-900"><span ref={valueRef} />{suffix}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}
