'use client'

import Link from 'next/link'
import { ChevronRight, FileText, AlertCircle, CreditCard, Truck, Shield, Gavel } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-4xl px-4 py-10 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
          <span className="text-gray-900 font-medium">Terms & Conditions</span>
        </nav>

        <header>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Omni E-Ride Terms & Conditions</h1>
          <p className="text-gray-600">
            These Terms & Conditions govern all vehicle purchases and services from Omni E-Ride. 
            By booking or purchasing a scooter, you accept the following terms:
          </p>
        </header>

        {/* Pricing & Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              Pricing & Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>All prices are exclusive of GST, insurance, and additional charges unless specified</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Prices may change due to raw material costs, government regulations, or other factors</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Full payment must be made before delivery unless financed through an approved partner</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Delivery */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-emerald-600" />
              Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Delivery timelines are indicative only and depend on stock availability</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Omni E-Ride is not liable for delays due to transportation, strikes, or government restrictions</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Warranty */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Warranty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Warranty coverage will follow the Omni E-Ride Warranty Policy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Battery warranty: NMC - 2 years + 1 year service (32,000 km) | LFP - 3 years + 1 year service (42,000 km)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Warranty becomes void if the scooter is serviced at unauthorized workshops</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Service & Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Service & Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Customers must follow the service schedule provided in the booklet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Failure to follow service schedule may result in warranty cancellation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>After the warranty period, all service charges are to be borne by the customer</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Returns & Refunds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Returns & Refunds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>Once delivered, vehicles are non-returnable and non-refundable</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>Refunds will be considered only in exceptional cases approved by the company</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Liability */}
        <section className="rounded-xl border bg-red-50 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Liability
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Omni E-Ride is not liable for accidents, injuries, or damages arising from misuse, negligence, or overloading</li>
            <li>• Customers must follow all traffic and safety regulations</li>
          </ul>
        </section>

        {/* Modifications */}
        <Card>
          <CardHeader>
            <CardTitle>Modifications</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Any unauthorized modifications or changes to the scooter will void warranty and liability</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Only Omni-approved accessories are recommended</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <section className="rounded-xl border bg-gray-50 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Governing Law
          </h2>
          <p className="text-sm text-gray-700">
            All disputes are subject to the jurisdiction of courts in Patna, Bihar only.
          </p>
        </section>

        {/* Contact Information */}
        <section className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-3">Contact Us</h2>
          <div className="space-y-1 text-sm text-gray-700">
            <p><strong>Email:</strong> support@omnideride.com</p>
            <p><strong>Phone:</strong> 011-6926-8712</p>
            <p><strong>Address:</strong> Baijnathpur Rd, Yadav Chowk, Hatiya Gachhi, Saharsa, Bihar 852202</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
