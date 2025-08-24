'use client'

import { usePathname } from 'next/navigation'
import WhatsAppFloat from './whatsapp-float'

export default function PublicLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Show WhatsApp button only on public pages
  const publicPaths = ['/', '/models', '/dealers', '/about', '/contact', '/warranty', '/privacy', '/terms']
  const isPublicPage = publicPaths.includes(pathname) || pathname.startsWith('/models/')
  
  return (
    <>
      {children}
      {isPublicPage && <WhatsAppFloat />}
    </>
  )
}
