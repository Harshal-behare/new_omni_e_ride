'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-7xl px-4 py-12">
      {/* Main Hero Section */}
      <section className="rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 p-8 md:p-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Driving India Towards a Greener Tomorrow
        </h1>
        <p className="text-lg text-gray-700 max-w-3xl">
          At Omni E-Ride, we believe the future of mobility is electric. Based in Saharsa, Bihar, 
          Omni E-Ride is more than just an electric vehicle showroom—it&apos;s a movement dedicated to 
          making eco-friendly, affordable, and reliable electric mobility accessible to everyone.
        </p>
      </section>

      {/* Company Story */}
      <section className="grid gap-8 lg:grid-cols-2 items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Story</h2>
          <p className="text-gray-700 mb-4">
            Founded with a mission to revolutionize urban and rural transportation, Omni E-Ride offers 
            a wide range of electric scooters designed for performance, comfort, and sustainability.
          </p>
          <p className="text-gray-700">
            Our vehicles are built to reduce running costs, minimize pollution, and give riders the 
            freedom of clean mobility without compromise.
          </p>
        </div>
        <div className="rounded-xl overflow-hidden ring-1 ring-gray-200">
          <img
            src="/placeholder.svg?height=800&width=1200"
            alt="Omni E-Ride Showroom"
            className="w-full h-auto object-cover"
          />
        </div>
      </section>

      {/* Why Choose Omni E-Ride */}
      <section className="bg-gray-50 rounded-2xl p-8 md:p-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose Omni E-Ride?</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard 
            title="High-Performance Models"
            description="Wide range of EVs with long battery life and powerful performance"
            icon="🚀"
          />
          <FeatureCard 
            title="Affordable & Low Running Cost"
            description="Save up to 90% compared to petrol scooters"
            icon="💰"
          />
          <FeatureCard 
            title="Advanced Battery Technology"
            description="Durable lithium and LFP batteries with up to 3 years warranty"
            icon="🔋"
          />
          <FeatureCard 
            title="After-Sales Support"
            description="Dedicated service, genuine spare parts, and hassle-free warranty"
            icon="🛠️"
          />
          <FeatureCard 
            title="Eco-Friendly Commitment"
            description="Every ride helps build a cleaner, greener future for India"
            icon="🌱"
          />
          <FeatureCard 
            title="Smart Features"
            description="Connected technology for modern riders"
            icon="📱"
          />
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="grid gap-8 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 md:p-8">
          <h3 className="text-2xl font-bold text-emerald-700 mb-4">Our Vision</h3>
          <p className="text-gray-700">
            To become India&apos;s most trusted EV brand, creating opportunities for individuals and 
            dealers while contributing to a sustainable tomorrow.
          </p>
        </div>
        <div className="rounded-xl border bg-white p-6 md:p-8">
          <h3 className="text-2xl font-bold text-emerald-700 mb-4">Our Mission</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• To empower customers with affordable and reliable electric mobility</li>
            <li>• To create profitable dealership opportunities across India</li>
            <li>• To spread awareness and adoption of zero-emission vehicles in Tier-2 & Tier-3 cities</li>
          </ul>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-emerald-600 text-white rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Join the Movement</h2>
        <p className="text-lg mb-6 max-w-3xl mx-auto">
          Whether you&apos;re a student, professional, delivery partner, or a family commuter, 
          Omni E-Ride has an EV designed for your lifestyle. With every scooter sold, we are 
          not just delivering a vehicle—we are delivering trust, savings, and sustainability.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/models">
            <button className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
              Explore Models
            </button>
          </Link>
          <Link href="/contact">
            <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition">
              Contact Us
            </button>
          </Link>
        </div>
      </section>

      {/* Contact Info */}
      <section className="text-center">
        <h3 className="text-xl font-bold mb-2">Visit Our Showroom</h3>
        <p className="text-gray-600 mb-1">NH-107, Yadav Chowk, Saharsa, Bihar - 852201</p>
        <p className="text-gray-600">Helpline: 011-6926-8712</p>
        <p className="text-2xl font-bold text-emerald-600 mt-4">Omni E-Ride — Trusted. Affordable. Electric.</p>
      </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}
