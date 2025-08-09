'use client'

import * as React from 'react'
import { ChevronsUpDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldWrapper, type FieldWrapperProps } from './field-wrapper'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'

export interface SearchSelectOption {
  label: string
  value: string
}

export interface SearchSelectProps
  extends Pick<FieldWrapperProps, 'label' | 'helperText' | 'error' | 'success' | 'className'> {
  name: string
  placeholder?: string
  options: SearchSelectOption[]
  disabled?: boolean
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export function SearchSelect({
  name,
  label,
  helperText,
  error,
  success,
  className,
  placeholder = 'Select',
  options,
  disabled,
  defaultValue,
  onValueChange,
}: SearchSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(defaultValue ?? '')

  function handleSelect(val: string) {
    const v = val === value ? '' : val
    setValue(v)
    onValueChange?.(v)
    setOpen(false)
  }

  const selected = options.find((o) => o.value === value)

  return (
    <FieldWrapper name={name} label={label} helperText={helperText} error={error} success={success} className={className}>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            disabled={disabled}
            className={cn(
              'w-full justify-between rounded-lg',
              error && 'border-red-500',
              success && !error && 'border-emerald-500'
            )}
          >
            <span className={cn(!selected && 'text-gray-500')}>
              {selected ? selected.label : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No results.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={handleSelect}
                    role="option"
                    aria-selected={value === opt.value}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === opt.value ? 'opacity-100' : 'opacity-0')} />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  )
}
