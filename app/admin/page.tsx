'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useEffect, useState } from 'react'

interface DashboardStats {
  totalUsers: number
  activeDealers: number
  totalVehicles: number
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/dashboard-stats')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics')
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonKPI />
          <SkeletonKPI />
          <SkeletonKPI />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="mt-6 text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPI label="Total Users" value={stats?.totalUsers.toLocaleString() || '0'} />
        <KPI label="Active Dealers" value={stats?.activeDealers.toLocaleString() || '0'} />
        <KPI label="Total Vehicles/Models" value={stats?.totalVehicles.toLocaleString() || '0'} />
      </div>
    </div>
  )
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <Card className="hover:shadow-sm transition">
      <CardContent className="p-5">
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function SkeletonKPI() {
  return (
    <Card className="hover:shadow-sm transition">
      <CardContent className="p-5">
        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
      </CardContent>
    </Card>
  )
}
