'use client'

import * as React from 'react'
import { getUsers, setUserRole, type DemoUser } from '@/lib/stores/users'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<DemoUser[]>([])

  React.useEffect(() => {
    setUsers(getUsers())
  }, [])

  function changeRole(email: string, role: DemoUser['role']) {
    setUserRole(email, role)
    setUsers(getUsers())
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <Card className="mt-4">
        <CardHeader><CardTitle>Manage Roles</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="text-left text-gray-600"><th className="py-2">Name</th><th>Email</th><th>Role</th><th /></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email} className="border-t">
                    <td className="py-2">{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select className="rounded-md border px-2 py-1" value={u.role} onChange={(e) => changeRole(u.email, e.target.value as DemoUser['role'])}>
                        <option value="customer">Customer</option>
                        <option value="dealer">Dealer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="text-right text-xs text-gray-500">Session will sync automatically if this is the current user.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-600">Changes are demo-only and stored locally. On a real backend, update the role via admin API and revalidate sessions.</p>
        </CardContent>
      </Card>
    </div>
  )
}
