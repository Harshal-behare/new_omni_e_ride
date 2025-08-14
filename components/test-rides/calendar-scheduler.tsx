'use client'

import React, { useState, useEffect } from 'react'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TimeSlot {
  time: string
  available: boolean
}

interface CalendarSchedulerProps {
  onSelectDateTime: (date: string, time: string) => void
  selectedDate?: string
  selectedTime?: string
  vehicleId?: string
  dealerId?: string
}

export function CalendarScheduler({
  onSelectDateTime,
  selectedDate,
  selectedTime,
  vehicleId,
  dealerId
}: CalendarSchedulerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  // Get days for the current month view
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Fetch available time slots when a date is selected
  useEffect(() => {
    if (selectedDay) {
      fetchTimeSlots(format(selectedDay, 'yyyy-MM-dd'))
    }
  }, [selectedDay, dealerId])

  const fetchTimeSlots = async (date: string) => {
    setIsLoadingSlots(true)
    try {
      const params = new URLSearchParams({ date })
      if (dealerId) params.append('dealer_id', dealerId)
      
      const response = await fetch(`/api/test-rides/slots?${params}`)
      if (response.ok) {
        const slots = await response.json()
        setTimeSlots(slots)
      } else {
        console.error('Failed to fetch time slots')
        setTimeSlots([])
      }
    } catch (error) {
      console.error('Error fetching time slots:', error)
      setTimeSlots([])
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const handleDayClick = (day: Date) => {
    // Don't allow selecting past dates
    if (isBefore(day, startOfDay(new Date()))) return
    
    setSelectedDay(day)
    const dateStr = format(day, 'yyyy-MM-dd')
    if (selectedDate !== dateStr) {
      onSelectDateTime(dateStr, '')
    }
  }

  const handleTimeClick = (time: string) => {
    if (selectedDay) {
      const dateStr = format(selectedDay, 'yyyy-MM-dd')
      onSelectDateTime(dateStr, time)
    }
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => addDays(startOfMonth(prev), -1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => addDays(endOfMonth(prev), 1))
  }

  const getDayClassName = (day: Date) => {
    const isPast = isBefore(day, startOfDay(new Date()))
    const isSelected = selectedDay && format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd')
    const isCurrentMonth = isSameMonth(day, currentMonth)
    
    return cn(
      'w-full p-2 text-sm rounded-lg transition-colors',
      'hover:bg-gray-100 dark:hover:bg-gray-800',
      {
        'bg-blue-500 text-white hover:bg-blue-600': isSelected,
        'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400': isToday(day) && !isSelected,
        'text-gray-400 cursor-not-allowed': isPast || !isCurrentMonth,
        'cursor-pointer': !isPast && isCurrentMonth,
      }
    )
  }

  // Get week day headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Pad the beginning of the month if needed
  const firstDayOfMonth = days[0].getDay()
  const paddedDays = Array(firstDayOfMonth).fill(null)

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Date
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 p-2"
              >
                {day}
              </div>
            ))}
            
            {/* Empty cells for padding */}
            {paddedDays.map((_, index) => (
              <div key={`pad-${index}`} className="p-2" />
            ))}
            
            {/* Calendar days */}
            {days.map(day => (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                disabled={isBefore(day, startOfDay(new Date()))}
                className={getDayClassName(day)}
              >
                {format(day, 'd')}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Slots */}
      {selectedDay && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Available Time Slots - {format(selectedDay, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSlots ? (
              <div className="text-center py-4 text-gray-500">
                Loading available slots...
              </div>
            ) : timeSlots.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {timeSlots.map(slot => (
                  <Button
                    key={slot.time}
                    variant={selectedTime === slot.time ? 'default' : 'outline'}
                    size="sm"
                    disabled={!slot.available}
                    onClick={() => handleTimeClick(slot.time)}
                    className={cn(
                      'relative',
                      !slot.available && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {slot.time}
                    {!slot.available && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-red-500">Booked</span>
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No time slots available for this date.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected DateTime Summary */}
      {selectedDate && selectedTime && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Selected Date & Time</p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')} at {selectedTime}
                </p>
              </div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">Ready to book</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
