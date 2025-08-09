'use client'

export type Order = {
  id: string
  customerEmail: string
  customerName?: string
  modelName: string
  value: number
  status: 'Confirmed' | 'In Production' | 'Shipped' | 'Delivered'
  createdAt: string
}

const KEY = 'omni_orders'

function read(): Order[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Order[]) : []
  } catch {
    return []
  }
}

function write(data: Order[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {}
}

export function getUserOrders(email: string): Order[] {
  return read().filter((o) => o.customerEmail.toLowerCase() === email.toLowerCase())
}

export function addOrder(input: Omit<Order, 'id' | 'createdAt'>): Order {
  const data = read()
  const id = `ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const item: Order = { ...input, id, createdAt: new Date().toISOString() }
  data.unshift(item)
  write(data)
  return item
}

export function updateOrder(id: string, patch: Partial<Order>) {
  const data = read()
  const idx = data.findIndex((o) => o.id === id)
  if (idx >= 0) {
    data[idx] = { ...data[idx], ...patch }
    write(data)
  }
}
