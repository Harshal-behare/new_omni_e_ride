'use client'

export type DealerApplication = {
  id: string
  applicantEmail: string
  applicantName: string
  phone: string
  city: string
  businessName: string
  yearsExperience?: number
  gst?: string
  message?: string
  status: 'Pending' | 'Approved' | 'Declined'
  createdAt: string
  reviewedAt?: string
  reviewer?: string
}

const KEY = 'omni_dealer_applications'

function read(): DealerApplication[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as DealerApplication[]) : []
  } catch {
    return []
  }
}

function write(data: DealerApplication[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {}
}

export function getApplications(): DealerApplication[] {
  return read()
}

export function getUserApplication(email: string): DealerApplication | undefined {
  return read().find((a) => a.applicantEmail.toLowerCase() === email.toLowerCase())
}

export function submitApplication(input: Omit<DealerApplication, 'id' | 'status' | 'createdAt'>) {
  const data = read()
  const id = `APP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const app: DealerApplication = { ...input, id, status: 'Pending', createdAt: new Date().toISOString() }
  data.unshift(app)
  write(data)
  return app
}

export function setApplicationStatus(id: string, status: DealerApplication['status'], reviewer?: string) {
  const data = read()
  const idx = data.findIndex((a) => a.id === id)
  if (idx >= 0) {
    data[idx].status = status
    data[idx].reviewedAt = new Date().toISOString()
    data[idx].reviewer = reviewer
    write(data)
  }
}
