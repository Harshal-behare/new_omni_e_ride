'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Shield, AlertCircle, CheckCircle2, FileText } from 'lucide-react'
import WarrantyInfo from '@/components/warranty/warranty-info'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function WarrantyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-7xl px-4 py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-600">
        <Link href="/" className="hover:text-gray-900 transition-colors">
          Home
        </Link>
        <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
        <span className="text-gray-900 font-medium">Warranty Policy</span>
      </nav>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Omni E-Ride Warranty Policy</h1>
        <p className="text-gray-600">
          Complete peace of mind with comprehensive warranty coverage on every scooter
        </p>
      </header>

      {/* Warranty Coverage Cards */}
      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Battery Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                <span><strong>Lithium-ion:</strong> 2 years or 32,000 km</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                <span><strong>Lead-acid:</strong> 1 year standard warranty</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Motor & Electronics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                <span><strong>Motor:</strong> 1-year warranty</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                <span><strong>Controller & Charger:</strong> 1-year warranty</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Body & Frame
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                <span><strong>Frame:</strong> 1-year warranty</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <span>Excludes paint, scratches, cosmetic damage</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Charger Warranty Policy */}
      <section className="rounded-xl border bg-amber-50 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Charger Warranty Policy
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold mb-2">Coverage</h3>
            <ul className="space-y-1 text-sm">
              <li>• 1-year warranty from purchase date</li>
              <li>• Covers manufacturing defects only</li>
              <li>• One-time replacement if found faulty</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Important Notes</h3>
            <ul className="space-y-1 text-sm">
              <li>• Use only supplied charger to maintain warranty</li>
              <li>• Unauthorized repairs void warranty</li>
              <li>• Prices include 5% GST</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Warranty Exclusions */}
      <section className="rounded-xl border bg-red-50 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          Warranty Exclusions
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold mb-2">Not Covered</h3>
            <ul className="space-y-1 text-sm">
              <li>• Normal wear and tear (tyres, brake pads, bulbs)</li>
              <li>• Accidental damage, fire, waterlogging</li>
              <li>• Overloading beyond recommended capacity</li>
              <li>• Unauthorized modifications or parts</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Voids Warranty</h3>
            <ul className="space-y-1 text-sm">
              <li>• Physical damage, water damage, tampering</li>
              <li>• Voltage fluctuations, power surges</li>
              <li>• Service at non-authorized centers</li>
              <li>• Use of non-compatible batteries</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Claim Process */}
      <section className="rounded-xl border bg-emerald-50 p-6">
        <h2 className="text-xl font-bold mb-4">Warranty Claim Process</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">1</div>
            <h3 className="font-semibold">Document Ready</h3>
            <p className="text-sm mt-1">Keep original bill/invoice and warranty card</p>
          </div>
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">2</div>
            <h3 className="font-semibold">Visit Service Center</h3>
            <p className="text-sm mt-1">Take scooter/charger to authorized center</p>
          </div>
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">3</div>
            <h3 className="font-semibold">Repair/Replace</h3>
            <p className="text-sm mt-1">Get repair or replacement as applicable</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4 text-center">
          <strong>Note:</strong> Transportation charges to/from service center are customer&apos;s responsibility
        </p>
      </section>

      {/* Additional Information */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Important Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Warranty is limited to repair/replacement only</li>
              <li>• No cash refund applicable</li>
              <li>• Follow service schedule to maintain warranty</li>
              <li>• After warranty, service charges apply</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact for Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Helpline:</strong> 011-6926-8712</p>
              <p><strong>Email:</strong> support@omnideride.com</p>
              <p><strong>Service Center:</strong> NH-107, Yadav Chowk, Saharsa, Bihar</p>
              <p className="text-gray-600 mt-2">Sunday–Friday: 10:00 am – 7:00 pm (Saturday closed)</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
    <SiteFooter />
    </div>
  )
}
