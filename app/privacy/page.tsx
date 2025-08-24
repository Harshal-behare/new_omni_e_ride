'use client'

import Link from 'next/link'
import { ChevronRight, Shield, Lock, Eye, UserCheck } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PrivacyPage() {
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
          <span className="text-gray-900 font-medium">Privacy Policy</span>
        </nav>

        <header>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Omni E-Ride Privacy Policy</h1>
          <p className="text-gray-600">
            Your privacy is important to us. Omni E-Ride respects your trust and is committed to 
            safeguarding the personal information you share with us.
          </p>
        </header>

        {/* Information We Collect */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-emerald-600" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 mb-3">
              We may collect the following details during booking, inquiry, or service:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Name, email, phone number, and address</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Vehicle purchase and service history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Payment details (securely processed via third-party providers)</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* How We Use Your Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-600" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>To process bookings, service requests, and warranty claims</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>To send important updates, service reminders, and promotional offers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>To improve our vehicles, services, and customer experience</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Protection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-600" />
              Data Protection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>All customer information is stored securely and payment data is encrypted</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Omni E-Ride does not sell, rent, or trade customer details to third parties</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Data may only be shared with authorized dealers or service partners to serve you better</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Your Rights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>You may request access, correction, or deletion of your data at any time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>For privacy concerns, contact us at: <a href="mailto:omnielectraride@gmail.com" className="text-emerald-600 hover:underline">omnielectraride@gmail.com</a></span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Agreement */}
        <section className="bg-gray-50 rounded-xl p-6">
          <p className="text-sm text-gray-700">
            By using our website, purchasing a scooter, or availing our services, you agree to this Privacy Policy.
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
