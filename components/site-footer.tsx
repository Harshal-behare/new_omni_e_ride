'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Facebook, Youtube, Shield, CreditCard, Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { OmniButton } from '@/components/ui/omni-button'

export default function SiteFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <div>
              <img src="/Logo.png" className="h-10 w-auto mb-3" alt="OMNI E-RIDE Logo" />
              <div className="font-semibold text-white">OMNI E-RIDE</div>
              <div className="text-sm text-emerald-400">Powering Green Mobility</div>
            </div>
            <p className="text-sm text-gray-400">
              OMNI E-RIDE is committed to building a sustainable future with innovative electric scooters designed for modern city life.
            </p>
            <div className="text-sm">
              <div className="text-gray-400">Head Office</div>
              <address className="not-italic">
                Baijnathpur Rd, Yadav Chowk,<br /> Hatiya Gachhi, Saharsa, Bihar 852202
              </address>
              <div>Phone: <a href="tel:01169268712" className="text-emerald-400 hover:underline">011-6926-8712</a></div>
              <div>Email: <a href="mailto:support@omnideride.com" className="text-emerald-400 hover:underline">support@omnideride.com</a></div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Quick Links</h3>
            <ul className="grid gap-2 text-sm">
              {[
                ['Models', '/models'],
                ['Find Dealers', '/dealers'],
                ['About Us', '/about'],
                ['Contact', '/contact'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-emerald-400 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Support</h3>
            <ul className="grid gap-2 text-sm">
              {[
                ['Warranty', '/warranty'],
                ['Privacy Policy', '/privacy'],
                ['Terms & Conditions', '/terms'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-emerald-400 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect & Subscribe */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Connect & Subscribe</h3>
            <div className="mb-4 flex gap-3">
              <a aria-label="Instagram" href="https://www.instagram.com/omni_eride/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400"><Instagram className="h-5 w-5" /></a>
              <a aria-label="Facebook" href="https://www.facebook.com/profile.php?id=61570865410071" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400"><Facebook className="h-5 w-5" /></a>
              <a aria-label="YouTube" href="https://www.youtube.com/@Omnieride" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400"><Youtube className="h-5 w-5" /></a>
            </div>
            <form className="mb-4 flex gap-2">
              <Input type="email" placeholder="Your email" className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500" aria-label="Email for newsletter" />
              <OmniButton type="submit" variant="primary">Subscribe</OmniButton>
            </form>
            <p className="text-sm text-gray-400">
              Stay updated with our latest electric vehicles and exclusive offers.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 text-sm text-gray-400">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span>© {new Date().getFullYear()} OMNI E-RIDE. All rights reserved.</span>
              <span className="hidden md:inline text-gray-600">|</span>
              <Link href="/privacy" className="hover:text-emerald-400">Privacy Policy</Link>
              <span className="hidden md:inline text-gray-600">•</span>
              <Link href="/terms" className="hover:text-emerald-400">Terms</Link>
              <span className="hidden md:inline text-gray-600">•</span>
              <Link href="/warranty" className="hover:text-emerald-400 inline-flex items-center gap-1"><Shield className="h-4 w-4" /> Warranty</Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1"><Shield className="h-4 w-4" /> Secure</span>
              <span className="inline-flex items-center gap-1"><Lock className="h-4 w-4" /> Encrypted</span>
              <span className="inline-flex items-center gap-1"><CreditCard className="h-4 w-4" /> Trusted Payments</span>
            </div>
            <div>Made with {'\u2661'} in India</div>
          </div>
        </div>
      </div>
    </footer>
  )
}
