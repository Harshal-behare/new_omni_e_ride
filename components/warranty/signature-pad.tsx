'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export function SignaturePad({ onChange, className }: { onChange?: (dataUrl: string) => void; className?: string }) {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const [drawing, setDrawing] = React.useState(false)

  React.useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#111827'
  }, [])

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = ref.current!
    const rect = c.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function pointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    setDrawing(true)
    const ctx = ref.current!.getContext('2d')!
    const { x, y } = pos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function pointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing) return
    const ctx = ref.current!.getContext('2d')!
    const { x, y } = pos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function pointerUp() {
    setDrawing(false)
    if (onChange && ref.current) onChange(ref.current.toDataURL('image/png'))
  }

  function clear() {
    const c = ref.current!
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    onChange?.('')
  }

  return (
    <div className={cn('rounded-lg border bg-white p-2', className)}>
      <div className="text-xs text-gray-600 mb-1">Dealer Signature</div>
      <canvas
        ref={ref}
        width={600}
        height={180}
        className="w-full rounded border"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerLeave={pointerUp}
      />
      <button type="button" className="mt-2 text-xs underline" onClick={clear}>Clear</button>
    </div>
  )
}
