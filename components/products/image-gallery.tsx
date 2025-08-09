'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export default function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const safe = images?.length ? images : ['/placeholder.svg?height=900&width=1200']
  const [active, setActive] = React.useState(0)
  const main = safe[Math.min(active, safe.length - 1)]

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-gray-200">
        <Image src={main || "/placeholder.svg"} alt={alt} fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
      </div>

      {/* Thumbs: horizontal scroll on small screens, grid on md+ */}
      <div className="md:grid md:grid-cols-6 md:gap-2 flex gap-2 overflow-x-auto">
        {safe.slice(0, 6).map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src + i}
            src={src || "/placeholder.svg"}
            alt={`${alt} thumbnail ${i + 1}`}
            className={cn(
              'h-20 w-32 md:w-full flex-none md:flex-initial cursor-pointer rounded-md object-cover ring-1 ring-gray-200',
              active === i && 'ring-2 ring-emerald-500'
            )}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </div>
  )
}
