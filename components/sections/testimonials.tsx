'use client'

import Image from 'next/image'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

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

const testimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Rajesh Kumar',
    location: 'Mumbai, Maharashtra',
    rating: 5,
    text: 'Amazing experience! The scooter is smooth, efficient, and the service team is excellent. Highly recommend OMNI E-RIDE.',
    purchased: 'OMNI Urban Pro',
    photo: '/placeholder.svg?height=120&width=120',
    verified: true,
  },
  {
    id: 't2',
    name: 'Priya Sharma',
    location: 'Delhi, NCR',
    rating: 5,
    text: 'Love my new electric scooter! Great range, stylish design, and zero maintenance hassles.',
    purchased: 'OMNI City Rider',
    photo: '/placeholder.svg?height=120&width=120',
    verified: true,
  },
  {
    id: 't3',
    name: 'Arjun Patel',
    location: 'Ahmedabad, Gujarat',
    rating: 5,
    text: 'Best investment for daily commute. Saves money on fuel and is environmentally friendly.',
    purchased: 'OMNI Smart Series',
    photo: '/placeholder.svg?height=120&width=120',
  },
  {
    id: 't4',
    name: 'Ananya Iyer',
    location: 'Bengaluru, Karnataka',
    rating: 5,
    text: 'Smart features are fantastic and the ride quality is top-notch!',
    purchased: 'OMNI Tourer',
    photo: '/placeholder.svg?height=120&width=120',
  },
]

export default function Testimonials() {
  return (
    <section className="bg-gradient-to-r from-emerald-500 to-emerald-600">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 text-center text-white">
          <h2 className="text-3xl font-bold">What Our Customers Say</h2>
          <p className="text-emerald-100">Real stories from riders across India</p>
        </div>

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
