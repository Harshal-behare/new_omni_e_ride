'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: 'customer' | 'dealer' | 'admin'
  city?: string
  state?: string
  pincode?: string
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)

  const fetchUsers = React.useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function changeRole(userId: string, newRole: string) {
    setUpdatingId(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!response.ok) {
        throw new Error('Failed to update role')
      }
      await fetchUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Failed to update user role')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Users Management</h1>
      <Card className="mt-4">
        <CardHeader><CardTitle>All System Users</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 px-2">Name</th>
                  <th className="px-2">Email</th>
                  <th className="px-2">Phone</th>
                  <th className="px-2">Location</th>
                  <th className="px-2">Role</th>
                  <th className="px-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-6 text-center text-gray-600">Loading users...</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-2">{u.name || 'N/A'}</td>
                    <td className="px-2">{u.email}</td>
                    <td className="px-2">{u.phone || 'N/A'}</td>
                    <td className="px-2">
                      {u.city || u.state || u.pincode ? (
                        <span className="text-xs">
                          {[u.city, u.state, u.pincode].filter(Boolean).join(', ')}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-2">
                      <select 
                        className="rounded-md border px-2 py-1 text-sm"
                        value={u.role} 
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        disabled={updatingId === u.id}
                      >
                        <option value="customer">Customer</option>
                        <option value="dealer">Dealer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-2 text-xs text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {!loading && users.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-gray-600">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-600">Role changes take effect immediately. Users may need to re-login to see updated permissions.</p>
        </CardContent>
      </Card>
    </div>
  )
}
