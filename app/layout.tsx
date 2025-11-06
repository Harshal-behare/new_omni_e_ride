import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { DemoAuthProvider } from '@/components/auth/demo-auth-provider'
import PublicLayoutWrapper from '@/components/public-layout-wrapper'
import type { Metadata } from 'next'

// Viewport configuration (separate export required by Next.js 15)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#10b981',
}

// SEO Metadata - Server-side for proper search engine indexing
export const metadata: Metadata = {
  title: 'OMNI E-RIDE - Premium Electric Scooters for Urban Mobility | Buy EV Scooters Online',
  description: 'Discover OMNI E-RIDE\'s range of premium electric scooters designed for modern city life. Zero emissions, smart features, and sustainable transportation. Book test rides, explore models, and find dealers near you.',
  keywords: 'electric scooter, EV scooter, electric vehicle, e-scooter, urban mobility, zero emission vehicle, eco-friendly transport, electric two-wheeler, buy electric scooter, test ride booking, OMNI E-RIDE',
  authors: [{ name: 'OMNI E-RIDE' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://omnieride.com',
    title: 'OMNI E-RIDE - Premium Electric Scooters for Urban Mobility',
    description: 'Experience the future of urban mobility with OMNI E-RIDE\'s premium electric scooters. Zero emissions, smart features, and sustainable transportation for modern city life.',
    siteName: 'OMNI E-RIDE',
    images: [
      {
        url: 'https://omnieride.com/Logo.png',
        width: 1200,
        height: 630,
        alt: 'OMNI E-RIDE Logo',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OMNI E-RIDE - Premium Electric Scooters for Urban Mobility',
    description: 'Experience the future of urban mobility with OMNI E-RIDE\'s premium electric scooters. Zero emissions, smart features, and sustainable transportation.',
    images: ['https://omnieride.com/Logo.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://omnieride.com',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'OMNI E-RIDE',
              url: 'https://omnieride.com',
              logo: 'https://omnieride.com/Logo.png',
              description: 'Premium electric scooter manufacturer and dealer network providing sustainable urban mobility solutions',
              sameAs: [
                'https://facebook.com/omnieride',
                'https://twitter.com/omnieride',
                'https://instagram.com/omnieride',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Service',
                availableLanguage: 'English',
              },
            }),
          }}
        />
        {/* Structured Data - Product */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: 'OMNI E-RIDE Electric Scooter',
              description: 'Premium electric scooters designed for modern city life with zero emissions and smart features',
              brand: {
                '@type': 'Brand',
                name: 'OMNI E-RIDE',
              },
              category: 'Electric Scooter',
              offers: {
                '@type': 'AggregateOffer',
                availability: 'https://schema.org/InStock',
                priceCurrency: 'INR',
              },
            }),
          }}
        />
      </head>
      <body>
        <DemoAuthProvider>
          <PublicLayoutWrapper>
            {children}
          </PublicLayoutWrapper>
        </DemoAuthProvider>
      </body>
    </html>
  )
}
