'use client'

export type TestRide = {
  id: string
  customerEmail: string
  customerName?: string
  modelId: string
  modelName: string
  dealerName: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'
  payment: { amount: number; currency: 'INR'; status: 'Pending' | 'Paid'; ref?: string }
  createdAt: string
}

const KEY = 'omni_test_rides'

function read(): TestRide[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as TestRide[]) : []
  } catch {
    return []
  }
}

function write(data: TestRide[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {}
}

export function getAllTestRides(): TestRide[] {
  return read()
}

export function getUserTestRides(email: string): TestRide[] {
  return read().filter((r) => r.customerEmail.toLowerCase() === email.toLowerCase())
}

export function addTestRide(input: Omit<TestRide, 'id' | 'createdAt'>): TestRide {
  const data = read()
  const id = `TR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const item: TestRide = { ...input, id, createdAt: new Date().toISOString() }
  data.unshift(item)
  write(data)
  return item
}

export function updateTestRide(id: string, patch: Partial<TestRide>) {
  const data = read()
  const idx = data.findIndex((r) => r.id === id)
  if (idx >= 0) {
    data[idx] = { ...data[idx], ...patch }
    write(data)
  }
}

export function payForTestRide(id: string, ref?: string) {
  const data = read()
  const idx = data.findIndex((r) => r.id === id)
  if (idx >= 0) {
    data[idx].payment.status = 'Paid'
    data[idx].payment.ref = ref || `PAY-${Date.now()}`
    write(data)
  }
}
