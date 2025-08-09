'use client'

import Image from 'next/image'
import WarrantyInfo from '@/components/warranty/warranty-info'

export default function WarrantyPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Warranty</h1>
        <p className="text-gray-600">
          Read about coverage, how to claim, and what to keep handy for a smooth experience.
        </p>
      </header>

      <WarrantyInfo />

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 md:p-6">
          <h2 className="font-semibold text-gray-900">Warranty Card Sample</h2>
          <p className="text-sm text-gray-600">
            Keep the warranty card and invoice safe. You&apos;ll need them during claims.
          </p>
          <div className="relative mt-4 aspect-[16/10] w-full overflow-hidden rounded-xl ring-1 ring-gray-200">
            <Image
              src="/images/warranty-card.jpg"
              alt="OMNI E-RIDE Warranty Card sample"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 md:p-6">
          <h2 className="font-semibold text-gray-900">FAQs</h2>
          <ul className="mt-3 space-y-3 text-sm text-gray-700">
            <li><strong>Do I get battery replacement?</strong> Yes, one-time if found defective within 2 years or 32,000 km (whichever earlier).</li>
            <li><strong>Can I service anywhere?</strong> Use only authorized centers to keep warranty valid.</li>
            <li><strong>What if I miss the 72-hour window?</strong> Please report as early as possible; delays may affect eligibility.</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
