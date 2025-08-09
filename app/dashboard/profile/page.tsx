'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OmniButton } from '@/components/ui/omni-button'

export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Profile Settings</h1>
      <Card className="mt-4">
        <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name"><input defaultValue="Demo Customer" className="w-full rounded-lg border px-3 py-2" /></Field>
          <Field label="Email"><input defaultValue="customer@demo.com" className="w-full rounded-lg border px-3 py-2" /></Field>
          <Field label="Phone"><input defaultValue="98765 43210" className="w-full rounded-lg border px-3 py-2" /></Field>
          <Field label="City"><input defaultValue="Bengaluru" className="w-full rounded-lg border px-3 py-2" /></Field>
          <div className="sm:col-span-2"><OmniButton>Save Changes</OmniButton></div>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      <div className="font-medium text-gray-800">{label}</div>
      <div className="mt-1">{children}</div>
    </label>
  )
}
