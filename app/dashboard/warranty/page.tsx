'use client'

import * as React from 'react'
import { useDemoAuth } from '@/components/auth/demo-auth-provider'
import { listWarrantiesByEmail } from '@/lib/stores/warranties'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WarrantyOverviewCard } from '@/components/warranty/warranty-cards'
import { WarrantyTimeline } from '@/components/warranty/warranty-timeline'
import { WarrantyButton } from '@/components/warranty/warranty-button'

export default function CustomerWarrantyPage() {
  const { user } = useDemoAuth()
  const [recs, setRecs] = React.useState(() => (user?.email ? listWarrantiesByEmail(user.email) : []))

  React.useEffect(() => {
    if (user?.email) setRecs(listWarrantiesByEmail(user.email))
  }, [user])

  return (
    <div>
      <h1 className="text-2xl font-bold">Warranty</h1>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {recs.map((r) => (
          <WarrantyOverviewCard key={r.id} record={r} />
        ))}
        {recs.length === 0 && (
          <Card>
            <CardHeader><CardTitle>No Warranties Yet</CardTitle></CardHeader>
            <CardContent className="text-sm text-gray-700">
              When your dealer submits a warranty and admin approves it, it will appear here with live status and reminders.
            </CardContent>
          </Card>
        )}
      </div>

      {recs[0] && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
          <CardContent>
            <WarrantyTimeline purchaseDate={recs[0].purchaseDate} years={recs[0].periodYears} />
            <div className="mt-4 flex flex-wrap gap-2">
              <WarrantyButton
                purchaseDate={recs[0].purchaseDate}
                periodYears={recs[0].periodYears}
                showProgress
                tooltip="Download your certificate"
                confirm={{ title: 'Download Certificate', message: 'Generate a print-ready certificate?' }}
                onClick={() => alert('Certificate downloaded (demo)')}
              >
                Warranty Certificate
              </WarrantyButton>
              <WarrantyButton variant="renew" tooltip="Renew your warranty" onClick={() => alert('Renewal flow (demo)')}>
                Renew Warranty
              </WarrantyButton>
              <WarrantyButton variant="warranty" tooltip="Submit a warranty claim" onClick={() => alert('Claim submission flow (demo)')}>
                Submit Claim
              </WarrantyButton>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
