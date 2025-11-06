'use client'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { DemoAuthProvider } from '@/components/auth/demo-auth-provider'
import PublicLayoutWrapper from '@/components/public-layout-wrapper'


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Primary Meta Tags */}
        <title>OMNI E-RIDE - Premium Electric Scooters for Urban Mobility | Buy EV Scooters Online</title>
        <meta name="title" content="OMNI E-RIDE - Premium Electric Scooters for Urban Mobility | Buy EV Scooters Online" />
        <meta name="description" content="Discover OMNI E-RIDE's range of premium electric scooters designed for modern city life. Zero emissions, smart features, and sustainable transportation. Book test rides, explore models, and find dealers near you." />
        <meta name="keywords" content="electric scooter, EV scooter, electric vehicle, e-scooter, urban mobility, zero emission vehicle, eco-friendly transport, electric two-wheeler, buy electric scooter, test ride booking, OMNI E-RIDE" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="author" content="OMNI E-RIDE" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#10b981" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://omnieride.com/" />
        <meta property="og:title" content="OMNI E-RIDE - Premium Electric Scooters for Urban Mobility" />
        <meta property="og:description" content="Experience the future of urban mobility with OMNI E-RIDE's premium electric scooters. Zero emissions, smart features, and sustainable transportation for modern city life." />
        <meta property="og:image" content="https://omnieride.com/Logo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="OMNI E-RIDE" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://omnieride.com/" />
        <meta property="twitter:title" content="OMNI E-RIDE - Premium Electric Scooters for Urban Mobility" />
        <meta property="twitter:description" content="Experience the future of urban mobility with OMNI E-RIDE's premium electric scooters. Zero emissions, smart features, and sustainable transportation." />
        <meta property="twitter:image" content="https://omnieride.com/Logo.png" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://omnieride.com/" />
        
        {/* Structured Data - Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "OMNI E-RIDE",
            "url": "https://omnieride.com",
            "logo": "https://omnieride.com/Logo.png",
            "description": "Premium electric scooter manufacturer and dealer network providing sustainable urban mobility solutions",
            "sameAs": [
              "https://facebook.com/omnieride",
              "https://twitter.com/omnieride",
              "https://instagram.com/omnieride"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "Customer Service",
              "availableLanguage": "English"
            }
          })}
        </script>
        
        {/* Structured Data - Product */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "OMNI E-RIDE Electric Scooter",
            "description": "Premium electric scooters designed for modern city life with zero emissions and smart features",
            "brand": {
              "@type": "Brand",
              "name": "OMNI E-RIDE"
            },
            "category": "Electric Scooter",
            "offers": {
              "@type": "AggregateOffer",
              "availability": "https://schema.org/InStock",
              "priceCurrency": "INR"
            }
          })}
        </script>
        
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
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
