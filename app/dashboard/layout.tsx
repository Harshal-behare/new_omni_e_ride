'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { RoleGate } from '@/components/auth/role-gate'
import { OmniButton } from '@/components/ui/omni-button'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Home, Calendar, ShoppingBag, User, Bell, LifeBuoy, Menu, ChevronLeft, ChevronRight, Shield, LogOut, Car, Briefcase } from 'lucide-react'
import { useDemoAuth } from '@/components/auth/demo-auth-provider'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useDemoAuth()
  const [collapsed, setCollapsed] = React.useState(false)
  const [profile, setProfile] = React.useState<{name?: string, email?: string} | null>(null)

  React.useEffect(() => {
    if (user?.email) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const displayName = profile?.name || user?.name || 'User'
  const displayEmail = profile?.email || user?.email || 'user@example.com'
  const firstName = displayName.split(' ')[0]

  const items = [
    { href: '/dashboard', icon: <Home className="h-5 w-5" />, label: 'Overview' },
    { href: '/dashboard/vehicles', icon: <Car className="h-5 w-5" />, label: 'Browse Vehicles' },
    { href: '/dashboard/orders', icon: <ShoppingBag className="h-5 w-5" />, label: 'My Orders' },
    { href: '/dashboard/test-rides', icon: <Calendar className="h-5 w-5" />, label: 'Test Rides' },
    { href: '/dashboard/dealer-application', icon: <Briefcase className="h-5 w-5" />, label: 'Become Dealer' },
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
            <span className="ml-2 font-bold text-emerald-700">OMNI E-RIDE</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1.5 transition-colors">
                <UserAvatar 
                  name={displayName}
                  email={displayEmail}
                  size="sm"
                  showOnline
                />
                <span className="hidden sm:block text-sm font-medium text-gray-700">{firstName}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2">
                  <UserAvatar 
                    name={displayName}
                    email={displayEmail}
                    size="sm"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{displayName}</span>
                    <span className="text-xs text-gray-500">{displayEmail}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
