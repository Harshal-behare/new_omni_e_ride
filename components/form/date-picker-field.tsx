'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldWrapper, type FieldWrapperProps } from './field-wrapper'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

export interface DatePickerFieldProps
  extends Pick<FieldWrapperProps, 'label' | 'helperText' | 'error' | 'success' | 'className'> {
  name: string
  placeholder?: string
  disabled?: boolean
  defaultValue?: Date
  onValueChange?: (date: Date | undefined) => void
}

export function DatePickerField({
  name,
  label,
  helperText,
  error,
  success,
  className,
  placeholder = 'Pick a date',
  disabled,
  defaultValue,
  onValueChange,
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(defaultValue)

  function handleSelect(day?: Date) {
    setDate(day)
    onValueChange?.(day)
  }

  return (
    <FieldWrapper name={name} label={label} helperText={helperText} error={error} success={success} className={className}>
      <input type="hidden" name={name} value={date ? date.toISOString() : ''} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal rounded-lg',
              !date && 'text-muted-foreground',
              error && 'border-red-500',
              success && !error && 'border-emerald-500'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP') : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  )
}
