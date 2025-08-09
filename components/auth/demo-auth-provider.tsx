'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'

export type UserRole = 'customer' | 'dealer' | 'admin'
export type DemoUser = { name: string; email: string; role: UserRole }

type AuthCtx = {
  user: DemoUser | null
  login: (opts: { email: string; password: string; remember?: boolean }) => Promise<{ ok: boolean; error?: string }>
  loginAs: (role: UserRole) => void
  logout: () => void
}

const AuthContext = React.createContext<AuthCtx | undefined>(undefined)

const DEMO_CREDS: Record<UserRole, { email: string; password: string; name: string }> = {
  customer: { email: 'customer@demo.com', password: 'demo123', name: 'Demo Customer' },
  dealer: { email: 'dealer@demo.com', password: 'demo123', name: 'Demo Dealer' },
  admin: { email: 'admin@demo.com', password: 'demo123', name: 'Demo Admin' },
}

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = React.useState<DemoUser | null>(null)

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('omni_demo_user')
      if (raw) setUser(JSON.parse(raw))
    } catch {}
  }, [])

  const persist = (u: DemoUser | null, remember?: boolean) => {
    setUser(u)
    try {
      if (u && remember) localStorage.setItem('omni_demo_user', JSON.stringify(u))
      else localStorage.removeItem('omni_demo_user')
    } catch {}
  }

  const login = async ({ email, password, remember }: { email: string; password: string; remember?: boolean }) => {
    // demo auth check
    const matched = (Object.keys(DEMO_CREDS) as UserRole[]).find(
      (r) => DEMO_CREDS[r].email === email && DEMO_CREDS[r].password === password
    )
    if (!matched) {
      return { ok: false, error: 'Invalid credentials (demo)' }
    }
    const u: DemoUser = { name: DEMO_CREDS[matched].name, email, role: matched }
    persist(u, remember)
    // Redirect by role
    router.push(matched === 'admin' ? '/admin' : matched === 'dealer' ? '/dealer' : '/dashboard')
    return { ok: true }
  }

  const loginAs = (role: UserRole) => {
    const { email, password, name } = DEMO_CREDS[role]
    const u: DemoUser = { name, email, role }
    persist(u, true)
    router.push(role === 'admin' ? '/admin' : role === 'dealer' ? '/dealer' : '/dashboard')
  }

  const logout = () => {
    persist(null, false)
    router.push('/')
  }

  const value: AuthCtx = { user, login, loginAs, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useDemoAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useDemoAuth must be used within DemoAuthProvider')
  return ctx
}
