export type WarrantyCoreStatus = 'Active' | 'ExpiringSoon' | 'Expired'
export type ReviewStatus = 'PendingReview' | 'Approved' | 'Declined'
export type WarrantyStatus = WarrantyCoreStatus | ReviewStatus

export function addYears(date: Date, years: number) {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + years)
  return d
}

export function daysBetween(a: Date, b: Date) {
  const ms = Math.max(0, b.getTime() - a.getTime())
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export function diffDays(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export function getWarrantyEnd(purchaseDate: string, years: number) {
  const start = new Date(purchaseDate)
  return addYears(start, years)
}

export function getWarrantyCoreStatus(purchaseDate: string, years: number, today = new Date()): WarrantyCoreStatus {
  const end = getWarrantyEnd(purchaseDate, years)
  if (today > end) return 'Expired'
  const remaining = diffDays(today, end)
  if (remaining <= 30) return 'ExpiringSoon'
  return 'Active'
}

export function getWarrantyPercentRemaining(purchaseDate: string, years: number, today = new Date()) {
  const start = new Date(purchaseDate)
  const end = getWarrantyEnd(purchaseDate, years)
  const total = Math.max(1, end.getTime() - start.getTime())
  const left = Math.max(0, end.getTime() - today.getTime())
  return Math.min(100, Math.max(0, Math.round((left / total) * 100)))
}

export function getWarrantyDaysRemaining(purchaseDate: string, years: number, today = new Date()) {
  const end = getWarrantyEnd(purchaseDate, years)
  return Math.max(0, daysBetween(today, end))
}

export function formatKwh(batteryWh?: number) {
  return batteryWh ? `${(batteryWh / 1000).toFixed(1)} kWh` : '—'
}
