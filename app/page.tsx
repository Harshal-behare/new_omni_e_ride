'use client'

import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import Hero from '@/components/sections/hero'
import FeaturedModelsCarousel from '@/components/sections/featured-models-carousel'
import WhyChooseUs from '@/components/sections/why-choose-us'
import DealerLocations from '@/components/sections/dealer-locations'
import Testimonials from '@/components/sections/testimonials'
import FinanceTools from '@/components/calculators/finance-tools'

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <SiteHeader />
      <main>
        <Hero />
        <FeaturedModelsCarousel />
        <WhyChooseUs />
        {/* Savings + EMI calculators for public landing */}
        <FinanceTools variant="home" />
        <DealerLocations />
        <Testimonials />
      </main>
      <SiteFooter />
    </div>
  )
}
