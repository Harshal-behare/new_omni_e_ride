import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-600 mb-8">
        <Link href="/" className="hover:text-gray-900 transition-colors">
          Home
        </Link>
        <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
        <span className="text-gray-900 font-medium">About</span>
      </nav>

      <section className="grid gap-8 lg:grid-cols-2 items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">About OMNI E-RIDE</h1>
          <p className="mt-4 text-gray-700">
            We build premium electric scooters for the modern Indian commute. Our mission is to power green mobility with
            reliable performance, smart features, and nationwide support.
          </p>
          <ul className="mt-6 grid gap-2 text-gray-800">
            <li>• 100+ KM real-world range</li>
            <li>• 50+ dealer and service network</li>
            <li>• Smart app with GPS, anti‑theft, ride stats</li>
          </ul>
        </div>
        <div className="rounded-xl overflow-hidden ring-1 ring-gray-200">
          <img
            src="/placeholder.svg?height=800&width=1200"
            alt="OMNI E-RIDE team at work"
            className="w-full h-auto object-cover"
          />
        </div>
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-3">
        <Stat label="Happy Customers" value="5,000+" />
        <Stat label="Dealers Nationwide" value="50+" />
        <Stat label="Avg. Satisfaction" value="99%" />
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-6 text-center">
      <div className="text-3xl font-bold text-emerald-700">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}
