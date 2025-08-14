'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bolt, Menu, User, LogIn, UserPlus, ChevronDown, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/lib/stores'


const navItems = [
  { href: '/models', label: 'Models' },
  { href: '/dealers', label: 'Dealers' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuthStore()
  
  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
              <img src="/Logo.png" className="h-6 w-6 text-emerald-600" aria-hidden="true"/>
              
              <span>OMNI E-RIDE</span>
            </Link>
          </div>

          <nav aria-label="Main" className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const active = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors',
                    active && 'text-emerald-700 border-b-2 border-emerald-600 pb-1'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback>OM</AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="text-sm font-semibold">{user.name || 'User'}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={user.role === 'dealer' ? '/dealer' : user.role === 'admin' ? '/admin' : '/dashboard'}>Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login" className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-emerald-700 hover:bg-emerald-50">
                  <LogIn className="h-4 w-4" />
                  <span className="text-sm font-semibold">Login</span>
                </Link>
                <Link href="/signup" className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700">
                  <UserPlus className="h-4 w-4" />
                  <span className="text-sm font-semibold">Sign Up</span>
                </Link>
              </div>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden rounded-lg">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="grid gap-6 py-6">
                  <div className="flex items-center gap-2">
                    <Bolt className="h-6 w-6 text-emerald-600" />
                    <span className="font-semibold">OMNI E-RIDE</span>
                  </div>
                  <nav className="grid gap-3">
                    {navItems.map((item) => {
                      const active = pathname?.startsWith(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            'rounded-lg px-3 py-2 text-sm font-semibold hover:bg-gray-100',
                            active && 'text-emerald-700 bg-emerald-50'
                          )}
                          aria-current={active ? 'page' : undefined}
                        >
                          {item.label}
                        </Link>
                      )
                    })}
                  </nav>
                  <div className="grid gap-2">
                    {user ? (
                      <>
                        <Link href={user.role === 'dealer' ? '/dealer' : user.role === 'admin' ? '/admin' : '/dashboard'} className="rounded-lg px-3 py-2 hover:bg-gray-100">Dashboard</Link>
                        <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-left hover:bg-gray-100">Log out</button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2">
                          <User className="h-4 w-4" /> Login
                        </Link>
                        <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-white">
                          <UserPlus className="h-4 w-4" /> Sign Up
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/919999999999"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 inline-flex items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg h-12 w-12 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </header>
  )
}
