'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type Testimonial = {
  id: string
  name: string
  location: string
  rating: number
  text: string
  purchased: string
  photo: string
  verified?: boolean
}

// Fallback demo data in case database fetch fails
const demoTestimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Amit Singh',
    location: 'Saharsa, Bihar',
    rating: 5,
    text: 'Excellent electric scooter! The battery life is amazing and the charging time is very quick. Best purchase for my daily commute to office.',
    purchased: 'OMNI Urban Pro',
    photo: '/placeholder.svg?height=120&width=120',
    verified: true,
  },
  {
    id: 't2',
    name: 'Sunita Devi',
    location: 'Madhepura, Bihar',
    rating: 5,
    text: 'Very happy with my purchase from Omni E-Ride showroom. The staff explained everything clearly and the scooter performance is outstanding.',
    purchased: 'OMNI City Rider',
    photo: '/placeholder.svg?height=120&width=120',
    verified: true,
  },
  {
    id: 't3',
    name: 'Ravi Prakash',
    location: 'Supaul, Bihar',
    rating: 5,
    text: 'Saving so much money on petrol! The electric scooter is smooth, silent and perfect for city rides. Highly recommend Omni E-Ride.',
    purchased: 'OMNI Smart Series',
    photo: '/placeholder.svg?height=120&width=120',
    verified: true,
  },
  {
    id: 't4',
    name: 'Neha Kumari',
    location: 'Darbhanga, Bihar',
    rating: 5,
    text: 'Best decision to switch to electric! The service at Omni showroom is excellent and the scooter quality is top-notch.',
    purchased: 'OMNI Urban Pro',
    photo: '/placeholder.svg?height=120&width=120',
    verified: true,
  },
  {
    id: 't5',
    name: 'Vijay Kumar',
    location: 'Purnia, Bihar',
    rating: 5,
    text: 'Amazing range and comfort! I can travel 100+ km on a single charge. The build quality is solid and maintenance is minimal.',
    purchased: 'OMNI City Rider',
    photo: '/placeholder.svg?height=120&width=120',
    verified: true,
  },
  {
    id: 't6',
    name: 'Anjali Verma',
    location: 'Bhagalpur, Bihar',
    rating: 5,
    text: 'Love my new electric scooter! It\'s eco-friendly, economical and the smart features make it very convenient to use daily.',
    purchased: 'OMNI Smart Series',
    photo: '/placeholder.svg?height=120&width=120',
    verified: true,
  },
]

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(demoTestimonials)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('customer_feedback')
          .select('id, name, location, rating, feedback_text, vehicle_purchased, photo_url, verified')
          .eq('status', 'approved')
          .eq('display_on_homepage', true)
          .order('created_at', { ascending: false })
          .limit(12)

        if (error) {
          console.error('Error fetching testimonials:', error)
          // Keep demo data on error
          return
        }

        if (data && data.length > 0) {
          // Map database data to Testimonial type
          const fetchedTestimonials: Testimonial[] = data.map((item) => ({
            id: item.id,
            name: item.name,
            location: item.location,
            rating: item.rating,
            text: item.feedback_text,
            purchased: item.vehicle_purchased || 'OMNI Vehicle',
            photo: item.photo_url || '/placeholder.svg?height=120&width=120',
            verified: item.verified || false,
          }))
          setTestimonials(fetchedTestimonials)
        }
        // If no data, keep demo testimonials
      } catch (err) {
        console.error('Failed to fetch testimonials:', err)
        // Keep demo data on error
      } finally {
        setLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  return (
    <section className="bg-gradient-to-r from-emerald-500 to-emerald-600">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 text-center text-white">
          <h2 className="text-3xl font-bold">What Our Customers Say</h2>
          <p className="text-emerald-100">Real stories from riders across India</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          </div>
        ) : (
          <Carousel
            opts={{ align: 'start', loop: true }}
            plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
            className="w-full"
          >
            <CarouselContent>
              {testimonials.map((t) => (
                <CarouselItem key={t.id} className="basis-full sm:basis-1/2 lg:basis-1/3">
                  <TestimonialCard t={t} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 bg-white text-emerald-700 hover:bg-emerald-50" />
            <CarouselNext className="right-0 bg-white text-emerald-700 hover:bg-emerald-50" />
          </Carousel>
        )}
      </div>
    </section>
  )
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="h-full rounded-xl bg-white p-6 shadow-md">
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-emerald-200">
          <Image src={t.photo || "/placeholder.svg"} alt={`${t.name} photo`} fill className="object-cover" />
        </div>
        <div>
          <div className="font-semibold text-gray-900">{t.name}</div>
          <div className="text-sm text-gray-600">{t.location}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={cn('h-4 w-4', i < t.rating ? 'text-emerald-500 fill-emerald-500' : 'text-gray-300')} />
        ))}
      </div>
      <blockquote className="mt-3 italic text-gray-700">&ldquo;{t.text}&rdquo;</blockquote>
      <div className="mt-4 text-xs text-gray-500">Purchased: {t.purchased} {t.verified && <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-emerald-700">Verified</span>}</div>
    </div>
  )
}
