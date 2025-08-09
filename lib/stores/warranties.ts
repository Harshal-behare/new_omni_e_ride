'use client'

import { getWarrantyCoreStatus, getWarrantyDaysRemaining, getWarrantyPercentRemaining, type WarrantyStatus } from '@/lib/warranty-utils'

export type WarrantyRecord = {
  id: string
  customerEmail: string
  customerName: string
  phone?: string
  modelId: string
  modelName: string
  vin: string
  purchaseDate: string // ISO
  periodYears: 1 | 2 | 3
  dealerName: string
  invoiceImage?: string // data URL
  signatureDataUrl?: string // data URL
  reviewStatus: 'PendingReview' | 'Approved' | 'Declined'
  createdAt: string
  reviewedAt?: string
  reviewer?: string
}

const KEY = 'omni_warranties'

function read(): WarrantyRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as WarrantyRecord[]) : []
  } catch {
    return []
  }
}

function write(data: WarrantyRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {}
}

export function submitWarranty(input: Omit<WarrantyRecord, 'id' | 'reviewStatus' | 'createdAt'>) {
  const data = read()
  const id = `WAR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const rec: WarrantyRecord = { ...input, id, reviewStatus: 'PendingReview', createdAt: new Date().toISOString() }
  data.unshift(rec)
  write(data)
  return rec
}

export function listWarranties(): WarrantyRecord[] {
  return read()
}

export function listWarrantiesByEmail(email: string): WarrantyRecord[] {
  return read().filter((w) => w.customerEmail.toLowerCase() === email.toLowerCase())
}

export function listWarrantiesByDealer(dealerName: string): WarrantyRecord[] {
  return read().filter((w) => w.dealerName === dealerName)
}

export function setWarrantyReview(id: string, status: WarrantyRecord['reviewStatus'], reviewer?: string) {
  const data = read()
  const idx = data.findIndex((w) => w.id === id)
  if (idx >= 0) {
    data[idx].reviewStatus = status
    data[idx].reviewedAt = new Date().toISOString()
    data[idx].reviewer = reviewer
    write(data)
  }
}

export function computeDisplayStatus(w: WarrantyRecord, now = new Date()): { core: 'Active' | 'ExpiringSoon' | 'Expired'; daysRemaining: number; percent: number; label: WarrantyStatus } {
  const core = getWarrantyCoreStatus(w.purchaseDate, w.periodYears, now)
  const daysRemaining = getWarrantyDaysRemaining(w.purchaseDate, w.periodYears, now)
  const percent = getWarrantyPercentRemaining(w.purchaseDate, w.periodYears, now)
  let label: WarrantyStatus = core
  if (w.reviewStatus !== 'Approved') label = w.reviewStatus
  return { core, daysRemaining, percent, label }
}
