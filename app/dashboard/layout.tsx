'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { RoleGate } from '@/components/auth/role-gate'
import { OmniButton } from '@/components/ui/omni-button'
import { Home, Calendar, ShoppingBag, User, Bell, LifeBuoy, Menu, ChevronLeft, ChevronRight, Shield } from 'lucide-react'
import { useDemoAuth } from '@/components/auth/demo-auth-provider'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { logout } = useDemoAuth()
  const [collapsed, setCollapsed] = React.useState(false)

  const items = [
    { href: '/dashboard', icon: <Home className="h-5 w-5" />, label: 'Overview' },
    { href: '/dashboard/orders', icon: <ShoppingBag className="h-5 w-5" />, label: 'My Orders' },
    { href: '/dashboard/test-rides', icon: <Calendar className="h-5 w-5" />, label: 'Test Rides' },
    { href: '/dashboard/warranty', icon: <Shield className="h-5 w-5" />, label: 'Warranty' },
    { href: '/dashboard/profile', icon: <User className="h-5 w-5" />, label: 'Profile' },
    { href: '/dashboard/notifications', icon: <Bell className="h-5 w-5" />, label: 'Notifications' },
    { href: '/dashboard/support', icon: <LifeBuoy className="h-5 w-5" />, label: 'Support' },
  ]

  return (
    <RoleGate allow={['customer']}>
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <button className="md:hidden rounded-lg border px-2 py-1.5"><Menu className="h-5 w-5" /></button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <Sidebar items={items} pathname={pathname || ''} collapsed={false} />
              </SheetContent>
            </Sheet>
            <button onClick={() => setCollapsed((c) => !c)} className="hidden md:inline-flex items-center rounded-lg border px-2 py-1.5">
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />} Menu
            </button>
            <Link href="/" className="ml-2 font-bold text-emerald-700">OMNI E-RIDE</Link>
          </div>
          <OmniButton variant="outline" size="sm" onClick={logout}>Logout</OmniButton>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[auto_1fr]">
        <aside className={cn('hidden md:block transition-all', collapsed ? 'w-16' : 'w-60')}>
          <Sidebar items={items} pathname={pathname || ''} collapsed={collapsed} />
        </aside>
        <section>{children}</section>
      </div>
    </RoleGate>
  )
}

function Sidebar({ items, pathname, collapsed }: { items: { href: string; icon: React.ReactNode; label: string }[]; pathname: string; collapsed: boolean }) {
  return (
    <nav className={cn('h-full rounded-xl border bg-white py-3', collapsed ? 'px-2' : 'px-3')}>
      <ul className="grid gap-1">
        {items.map((it) => {
          const active = pathname === it.href
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-50',
                  active && 'bg-emerald-50 text-emerald-700 font-medium',
                  collapsed && 'justify-center'
                )}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? it.label : undefined}
              >
                <span className="shrink-0">{it.icon}</span>
                {!collapsed && <span className="truncate">{it.label}</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
