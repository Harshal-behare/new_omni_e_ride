'use client'

export type Role = 'customer' | 'dealer' | 'admin'
export type DemoUser = { email: string; name: string; role: Role }

const KEY = 'omni_users'
const DEMO: DemoUser[] = [
  { email: 'customer@demo.com', name: 'Demo Customer', role: 'customer' },
  { email: 'dealer@demo.com', name: 'Demo Dealer', role: 'dealer' },
  { email: 'admin@demo.com', name: 'Demo Admin', role: 'admin' },
]

function read(): DemoUser[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as DemoUser[]) : DEMO
  } catch {
    return DEMO
  }
}

function write(data: DemoUser[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {}
}

export function getUsers(): DemoUser[] {
  return read()
}

export function setUserRole(email: string, role: Role) {
  const data = read()
  const idx = data.findIndex((u) => u.email.toLowerCase() === email.toLowerCase())
  if (idx >= 0) {
    data[idx] = { ...data[idx], role }
  } else {
    data.push({ email, name: email.split('@')[0], role })
  }
  write(data)

  // If this is the current session user, sync the stored session role.
  try {
    const raw = localStorage.getItem('omni_demo_user')
    if (raw) {
      const me = JSON.parse(raw) as { email: string; name: string; role: Role }
      if (me.email.toLowerCase() === email.toLowerCase()) {
        localStorage.setItem('omni_demo_user', JSON.stringify({ ...me, role }))
      }
    }
  } catch {}
}
