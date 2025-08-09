'use client'

import { customers } from '@/lib/demo'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function DealerCustomersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Customers</h1>
      <Card className="mt-4">
        <CardHeader><CardTitle>CRM</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-600"><th>Name</th><th>Phone</th><th>City</th><th>Last Contact</th><th>Status</th></tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.phone} className="border-t">
                  <td className="py-2">{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.city}</td>
                  <td>{c.last}</td>
                  <td>{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
