'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet'
import { Menu, LogOut } from 'lucide-react'
import { useDemoAuth } from '@/components/auth/demo-auth-provider'

type Item = { href: string; label: string }
export function DashboardShell({ role, children }: { role: 'customer' | 'dealer' | 'admin'; children: React.ReactNode }) {
  const pathname = usePathname()
  const { logout } = useDemoAuth()

  const nav: Record<typeof role, Item[]> = {
    customer: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/dashboard/test-rides', label: 'Test Rides' },
      { href: '/dashboard/orders', label: 'My Orders' },
      { href: '/dashboard/profile', label: 'Profile' },
      { href: '/dashboard/notifications', label: 'Notifications' },
      { href: '/dashboard/support', label: 'Support' },
    ],
    dealer: [
      { href: '/dealer', label: 'Overview' },
      { href: '/dealer/test-rides', label: 'Test Rides' },
      { href: '/dealer/orders', label: 'Orders' },
      { href: '/dealer/customers', label: 'Customers' },
    ],
    admin: [
      { href: '/admin', label: 'Overview' },
      { href: '/admin/users', label: 'Users' },
      { href: '/admin/dealers', label: 'Dealers' },
      { href: '/admin/products', label: 'Products' },
      { href: '/admin/orders', label: 'Orders' },
    ],
  }

  const items = nav[role]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <Sidebar items={items} pathname={pathname || ''} />
              </SheetContent>
            </Sheet>
            <Link href="/" className="font-bold text-emerald-700">OMNI E-RIDE</Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={logout}><LogOut className="mr-1 h-4 w-4" /> Logout</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block">
          <Sidebar items={items} pathname={pathname || ''} />
        </aside>
        <main>{children}</main>
      </div>
    </div>
  )
}

function Sidebar({ items, pathname }: { items: Item[]; pathname: string }) {
  return (
    <nav className="h-full border-r bg-white">
      <div className="p-3">
        <ul className="grid gap-1">
          {items.map((it) => {
            const active = pathname === it.href
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={cn(
                    'block rounded-md px-3 py-2 text-sm transition hover:bg-emerald-50',
                    active ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'
                  )}
                >
                  {it.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
