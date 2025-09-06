import React from 'react'
import { Badge } from '@/components/ui/badge'
import { IndianRupee, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'

interface PaymentStatusBadgeProps {
  status: string
  amount?: number
}

export function PaymentStatusBadge({ status, amount = 2000 }: PaymentStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'paid':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          text: 'Paid',
          className: 'bg-green-500 hover:bg-green-600'
        }
      case 'pending':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          text: 'Payment Pending',
          className: 'bg-yellow-500 hover:bg-yellow-600 text-white'
        }
      case 'failed':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          text: 'Failed',
          className: ''
        }
      case 'refunded':
        return {
          variant: 'outline' as const,
          icon: RefreshCw,
          text: 'Refunded',
          className: ''
        }
      default:
        return {
          variant: 'outline' as const,
          icon: IndianRupee,
          text: status,
          className: ''
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      <span>{config.text}</span>
      {status === 'paid' && amount && (
        <span className="ml-1">(₹{amount})</span>
      )}
    </Badge>
  )
}
