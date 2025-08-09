'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export default function ColorSwatches({
  colors,
  onChange,
}: {
  colors: string[]
  onChange?: (hex: string) => void
}) {
  const [selected, setSelected] = React.useState(colors?.[0])

  React.useEffect(() => {
    if (selected) onChange?.(selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((hex) => (
        <button
          key={hex}
          aria-label={`Select color ${hex}`}
          className={cn(
            'h-8 w-8 rounded-full ring-2 ring-offset-2 transition-shadow',
            selected === hex ? 'ring-emerald-600 ring-offset-white' : 'ring-gray-300 hover:ring-emerald-400'
          )}
          style={{ backgroundColor: hex }}
          onClick={() => setSelected(hex)}
        />
      ))}
    </div>
  )
}
