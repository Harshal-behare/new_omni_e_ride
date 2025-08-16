'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { Calendar, Clock, Loader2 } from 'lucide-react'
import { format, addDays } from 'date-fns'

interface TimeSlot {
  start: string
  end: string
  enabled: boolean
}

interface WorkingHours {
  [day: string]: {
    isOpen: boolean
    openTime: string
    closeTime: string
    slots: number
  }
}

interface AvailabilitySettings {
  workingHours: WorkingHours
  holidays: string[]
  slotDuration: number
}

interface AvailabilitySettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const DEFAULT_SETTINGS: AvailabilitySettings = {
  workingHours: {
    monday: { isOpen: true, openTime: '09:00', closeTime: '18:00', slots: 2 },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00', slots: 2 },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00', slots: 2 },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00', slots: 2 },
    friday: { isOpen: true, openTime: '09:00', closeTime: '18:00', slots: 2 },
    saturday: { isOpen: true, openTime: '09:00', closeTime: '13:00', slots: 2 },
    sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00', slots: 0 }
  },
  holidays: [],
  slotDuration: 30
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

export function AvailabilitySettingsModal({ isOpen, onClose }: AvailabilitySettingsModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<AvailabilitySettings>(DEFAULT_SETTINGS)
  const [blockedDateInput, setBlockedDateInput] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchSettings()
    }
  }, [isOpen])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dealer/availability')
      if (response.ok) {
        const data = await response.json()
        // API returns data directly, not nested in 'settings'
        if (data.workingHours) {
          setSettings(data)
        }
      }
    } catch (error) {
      console.error('Error fetching availability settings:', error)
      toast.error('Failed to load availability settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/dealer/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workingHours: settings.workingHours, 
          holidays: settings.holidays, 
          slotDuration: settings.slotDuration 
        })
      })

      if (response.ok) {
        toast.success('Availability settings updated successfully')
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateWorkingHours = (day: typeof DAYS[number], field: 'openTime' | 'closeTime' | 'isOpen' | 'slots', value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }))
  }

  const addBlockedDate = () => {
    if (!blockedDateInput) return

    const date = new Date(blockedDateInput)
    const dateStr = format(date, 'yyyy-MM-dd')

    if (!settings.holidays.includes(dateStr)) {
      setSettings(prev => ({
        ...prev,
        holidays: [...prev.holidays, dateStr].sort()
      }))
      setBlockedDateInput('')
    }
  }

  const removeBlockedDate = (date: string) => {
    setSettings(prev => ({
      ...prev,
      holidays: prev.holidays.filter(d => d !== date)
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test Ride Availability Settings</DialogTitle>
          <DialogDescription>
            Configure your availability for test rides
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Business Hours */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <h3 className="font-semibold">Business Hours</h3>
                </div>
                <div className="space-y-4">
                  {DAYS.map(day => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-24">
                        <Switch
                          id={`${day}-isOpen`}
                          checked={settings.workingHours[day].isOpen}
                          onCheckedChange={(checked) => updateWorkingHours(day, 'isOpen', checked)}
                        />
                        <Label
                          htmlFor={`${day}-isOpen`}
                          className="ml-2 capitalize text-sm"
                        >
                          {day}
                        </Label>
                      </div>
                      {settings.workingHours[day].isOpen && (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={settings.workingHours[day].openTime || '09:00'}
                            onChange={(e) => updateWorkingHours(day, 'openTime', e.target.value)}
                            className="w-32"
                          />
                          <span className="text-gray-500">to</span>
                          <Input
                            type="time"
                            value={settings.workingHours[day].closeTime || '18:00'}
                            onChange={(e) => updateWorkingHours(day, 'closeTime', e.target.value)}
                            className="w-32"
                          />
                          <span className="text-gray-500">Slots:</span>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={settings.workingHours[day].slots || 2}
                            onChange={(e) => updateWorkingHours(day, 'slots', parseInt(e.target.value) || 0)}
                            className="w-16"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Blocked Dates */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <h3 className="font-semibold">Holidays</h3>
                </div>
                <div className="flex gap-2 mb-4">
                  <Input
                    type="date"
                    value={blockedDateInput}
                    onChange={(e) => setBlockedDateInput(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    max={format(addDays(new Date(), 365), 'yyyy-MM-dd')}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={addBlockedDate}
                    disabled={!blockedDateInput}
                  >
                    Add Holiday
                  </Button>
                </div>
                {settings.holidays.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {settings.holidays.map(date => (
                      <div
                        key={date}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                      >
                        <span>{format(new Date(date), 'MMM dd, yyyy')}</span>
                        <button
                          onClick={() => removeBlockedDate(date)}
                          className="ml-1 text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No holidays added</p>
                )}
              </CardContent>
            </Card>

            {/* Other Settings */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Additional Settings</h3>
                <div>
                  <Label htmlFor="slot-duration">Slot duration (minutes)</Label>
                  <Input
                    id="slot-duration"
                    type="number"
                    min="15"
                    max="120"
                    step="15"
                    value={settings.slotDuration}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      slotDuration: parseInt(e.target.value) || 30
                    }))}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
