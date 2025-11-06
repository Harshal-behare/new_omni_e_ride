'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Leaf, Smartphone, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { OmniButton } from '@/components/ui/omni-button'

interface HeroImage {
  url: string
  name: string
}

export default function Hero() {
  const [images, setImages] = useState<HeroImage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    // Fetch hero images from API
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/hero-images')
        const data = await response.json()
        if (data.images && data.images.length > 0) {
          setImages(data.images)
        }
      } catch (error) {
        console.error('Error fetching hero images:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchImages()
  }, [])

  useEffect(() => {
    // Auto-slide every 5 seconds
    if (images.length <= 1) return

    const interval = setInterval(() => {
      handleNext()
    }, 5000)

    return () => clearInterval(interval)
  }, [currentIndex, images.length])

  const handleNext = () => {
    if (isTransitioning || images.length === 0) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev + 1) % images.length)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const handlePrev = () => {
    if (isTransitioning || images.length === 0) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const goToSlide = (index: number) => {
    if (isTransitioning || images.length === 0) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  return (
    <>
      {/* Image Slideshow Section - Constrained Width */}
      <section id="hero-slider" className="relative h-[60vh] md:h-[70vh] lg:h-[80vh] overflow-hidden bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 h-full">
          <div className="relative h-full">
            {isLoading ? (
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 to-emerald-100 animate-pulse rounded-lg" />
            ) : images.length > 0 ? (
              <>
                {/* Image Slides */}
                {images.map((image, index) => (
                  <div
                    key={image.name}
                    className={`absolute inset-0 transition-opacity duration-1000 bg-white rounded-lg ${
                      index === currentIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`Hero slide ${index + 1}`}
                      className="h-full w-full object-contain rounded-lg"
                    />
                  </div>
                ))}

            {/* Slider Controls */}
            {images.length > 1 && (
              <>
                {/* Previous button */}
                <button
                  onClick={handlePrev}
                  className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm ring-1 ring-white/40 hover:bg-black/40 transition"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>

                {/* Next button */}
                <button
                  onClick={handleNext}
                  className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm ring-1 ring-white/40 hover:bg-black/40 transition"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>

                {/* Slide indicators */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`h-2.5 rounded-full transition-all ${
                        index === currentIndex
                          ? 'bg-white w-10'
                          : 'bg-white/50 w-2.5 hover:bg-white/70'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 to-emerald-100 rounded-lg" />
        )}

            {/* Scroll indicator */}
            <a href="#hero-content" className="group absolute bottom-4 left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 ring-1 ring-gray-300 hover:bg-white transition z-20">
              <ChevronDown className="h-5 w-5 text-emerald-600 group-hover:translate-y-0.5 transition" />
              <span className="sr-only">Scroll to content</span>
            </a>
          </div>
        </div>
      </section>

      {/* Content Section - Text and CTAs */}
      <section id="hero-content" className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              Experience the Future of Urban Mobility
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our range of premium electric scooters designed for modern city life.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Link href="/models">
                <OmniButton size="xl" variant="primary">Explore Models</OmniButton>
              </Link>
              <Link href="/dealers">
                <OmniButton size="xl" variant="outline">Find Dealers</OmniButton>
              </Link>
            </div>

            <div className="flex flex-wrap gap-8 justify-center pt-8">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <Leaf className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                </div>
                <span className="text-base md:text-lg font-semibold">Zero Emissions</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <Smartphone className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                </div>
                <span className="text-base md:text-lg font-semibold">Smart Features</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
