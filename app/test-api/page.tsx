'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAPIPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const testPublicDealersAPI = async () => {
    try {
      const response = await fetch('/api/public/dealers')
      const data = await response.json()
      setResults(prev => ({ ...prev, publicDealers: { status: response.status, data } }))
    } catch (error: any) {
      setResults(prev => ({ ...prev, publicDealers: { error: error.message } }))
    }
  }

  const testAvailableSlots = async () => {
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]
      
      const response = await fetch(`/api/test-rides/slots?date=${dateStr}`)
      const data = await response.json()
      setResults(prev => ({ ...prev, availableSlots: { status: response.status, data } }))
    } catch (error: any) {
      setResults(prev => ({ ...prev, availableSlots: { error: error.message } }))
    }
  }

  const testSimpleBooking = async () => {
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]
      
      const bookingData = {
        vehicleId: 'v1b2c3d4-e5f6-7890-abcd-ef1234567890', // Sample vehicle UUID
        preferredDate: dateStr,
        preferredTime: '10:00',
        dealershipId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // Sample dealer UUID
        contactNumber: '9999999999',
        address: 'Test Address',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        specialRequests: 'Test booking'
      }
      
      const response = await fetch('/api/test-rides/book-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })
      const data = await response.json()
      setResults(prev => ({ ...prev, simpleBooking: { status: response.status, data } }))
    } catch (error: any) {
      setResults(prev => ({ ...prev, simpleBooking: { error: error.message } }))
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    setResults({})
    
    await testPublicDealersAPI()
    await testAvailableSlots()
    await testSimpleBooking()
    
    setLoading(false)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Test Ride API Testing</h1>
        <Button onClick={runAllTests} disabled={loading}>
          {loading ? 'Running Tests...' : 'Run All Tests'}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Public Dealers API</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testPublicDealersAPI} variant="outline" size="sm">
              Test GET /api/public/dealers
            </Button>
            {results.publicDealers && (
              <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto text-xs">
                {JSON.stringify(results.publicDealers, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Slots API</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testAvailableSlots} variant="outline" size="sm">
              Test GET /api/test-rides/slots
            </Button>
            {results.availableSlots && (
              <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto text-xs">
                {JSON.stringify(results.availableSlots, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Simple Booking API</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testSimpleBooking} variant="outline" size="sm">
              Test POST /api/test-rides/book-simple
            </Button>
            {results.simpleBooking && (
              <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto text-xs">
                {JSON.stringify(results.simpleBooking, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
