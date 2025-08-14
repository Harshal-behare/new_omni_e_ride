'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useTestRideSlots } from '@/hooks/useRealtime';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';

interface TestRideAvailabilityProps {
  dealerId?: string;
  onSlotSelect?: (slot: any) => void;
  selectedDate?: Date;
}

export function TestRideAvailability({ 
  dealerId, 
  onSlotSelect,
  selectedDate = new Date()
}: TestRideAvailabilityProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  const { slots, checkAvailability, updateAvailability } = useTestRideSlots({
    dealerId,
    date: format(currentDate, 'yyyy-MM-dd'),
  });

  // Group slots by time
  const timeSlots = [
    { time: '09:00', label: '9:00 AM' },
    { time: '10:00', label: '10:00 AM' },
    { time: '11:00', label: '11:00 AM' },
    { time: '12:00', label: '12:00 PM' },
    { time: '14:00', label: '2:00 PM' },
    { time: '15:00', label: '3:00 PM' },
    { time: '16:00', label: '4:00 PM' },
    { time: '17:00', label: '5:00 PM' },
  ];

  // Get next 7 days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i));

  const getSlotStatus = (time: string) => {
    const slot = slots.find((s) => s.time === time);
    return slot?.available ?? true;
  };

  const handleSlotClick = async (time: string, label: string) => {
    const isAvailable = getSlotStatus(time);
    
    if (!isAvailable) {
      return;
    }

    setSelectedSlot({ time, label, date: currentDate });
    
    if (onSlotSelect) {
      onSlotSelect({
        date: format(currentDate, 'yyyy-MM-dd'),
        time,
        label,
        dealerId,
      });
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot) return;

    setBookingInProgress(true);
    
    try {
      // Check real-time availability before booking
      const isStillAvailable = await checkAvailability(
        dealerId || '',
        format(currentDate, 'yyyy-MM-dd'),
        selectedSlot.time
      );

      if (!isStillAvailable) {
        alert('This slot was just booked by someone else. Please select another time.');
        setSelectedSlot(null);
        return;
      }

      // Proceed with booking
      // This would typically call an API to create the booking
      console.log('Booking slot:', selectedSlot);
      
      // Update availability after successful booking
      const slot = slots.find((s) => s.time === selectedSlot.time);
      if (slot) {
        await updateAvailability(slot.id, false);
      }

      alert('Test ride booked successfully!');
      setSelectedSlot(null);
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to book test ride. Please try again.');
    } finally {
      setBookingInProgress(false);
    }
  };

  const getAvailableCount = () => {
    return timeSlots.filter((slot) => getSlotStatus(slot.time)).length;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Test Ride Availability</CardTitle>
            <CardDescription>
              Real-time slot availability updates
            </CardDescription>
          </div>
          <Badge variant="outline" className="animate-pulse">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
            Live Updates
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date selector */}
        <div>
          <h4 className="text-sm font-medium mb-3">Select Date</h4>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <Button
                key={day.toISOString()}
                variant={isSameDay(day, currentDate) ? 'default' : 'outline'}
                size="sm"
                className="flex flex-col h-auto py-2"
                onClick={() => setCurrentDate(day)}
              >
                <span className="text-xs">{format(day, 'EEE')}</span>
                <span className="text-lg font-bold">{format(day, 'd')}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Available slots count */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{getAvailableCount()}</strong> slots available for{' '}
            <strong>{format(currentDate, 'MMMM d, yyyy')}</strong>
          </AlertDescription>
        </Alert>

        {/* Time slots grid */}
        <div>
          <h4 className="text-sm font-medium mb-3">Select Time</h4>
          <div className="grid grid-cols-4 gap-3">
            {timeSlots.map((slot) => {
              const isAvailable = getSlotStatus(slot.time);
              const isSelected = selectedSlot?.time === slot.time;

              return (
                <Button
                  key={slot.time}
                  variant={isSelected ? 'default' : isAvailable ? 'outline' : 'ghost'}
                  className={cn(
                    'relative',
                    !isAvailable && 'opacity-50 cursor-not-allowed'
                  )}
                  disabled={!isAvailable}
                  onClick={() => handleSlotClick(slot.time, slot.label)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {slot.label}
                  {!isAvailable && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0"
                    >
                      <XCircle className="h-3 w-3" />
                    </Badge>
                  )}
                  {isAvailable && slots.find((s) => s.time === slot.time) && (
                    <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Selected slot details */}
        {selectedSlot && (
          <Alert className="border-primary">
            <CheckCircle className="h-4 w-4 text-primary" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Selected Slot:</p>
                  <p className="text-sm text-muted-foreground">
                    {format(currentDate, 'MMMM d, yyyy')} at {selectedSlot.label}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleBooking}
                  disabled={bookingInProgress}
                >
                  {bookingInProgress ? 'Booking...' : 'Confirm Booking'}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border rounded" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 rounded" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span>Just updated</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
