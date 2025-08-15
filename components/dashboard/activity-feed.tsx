'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { 
  ShoppingBag, 
  Calendar, 
  MapPin, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Star,
  CreditCard,
  Truck
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'order' | 'test_ride' | 'payment' | 'delivery' | 'review' | 'profile'
  title: string
  description: string
  timestamp: string
  status?: 'success' | 'pending' | 'warning' | 'error'
  metadata?: any
}

interface ActivityFeedProps {
  activities?: ActivityItem[]
  limit?: number
  showAll?: boolean
}

export function ActivityFeed({ activities, limit = 5, showAll = false }: ActivityFeedProps) {
  // Demo data - replace with real API data
  const demoActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'order',
      title: 'Order Confirmed',
      description: 'Your order for Omni E-Bike Pro has been confirmed',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'success',
      metadata: { orderId: 'ORD-10041', amount: 89999 }
    },
    {
      id: '2',
      type: 'test_ride',
      title: 'Test Ride Scheduled',
      description: 'Test ride booked for tomorrow at Green Valley Showroom',
      timestamp: '2024-01-14T16:45:00Z',
      status: 'pending',
      metadata: { dealer: 'Green Valley Showroom', date: '2024-01-16' }
    },
    {
      id: '3',
      type: 'payment',
      title: 'Payment Successful',
      description: 'Payment of ₹5,000 processed for booking amount',
      timestamp: '2024-01-14T14:20:00Z',
      status: 'success',
      metadata: { amount: 5000, method: 'UPI' }
    },
    {
      id: '4',
      type: 'profile',
      title: 'Profile Updated',
      description: 'Your profile information has been updated successfully',
      timestamp: '2024-01-13T09:15:00Z',
      status: 'success'
    },
    {
      id: '5',
      type: 'delivery',
      title: 'Delivery Scheduled',
      description: 'Your vehicle delivery has been scheduled for next week',
      timestamp: '2024-01-12T11:30:00Z',
      status: 'pending',
      metadata: { estimatedDate: '2024-01-22' }
    },
    {
      id: '6',
      type: 'review',
      title: 'Review Submitted',
      description: 'Thank you for reviewing your test ride experience',
      timestamp: '2024-01-11T18:00:00Z',
      status: 'success',
      metadata: { rating: 5 }
    }
  ]

  const activityList = activities || demoActivities
  const displayedActivities = showAll ? activityList : activityList.slice(0, limit)

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="h-4 w-4" />
      case 'test_ride':
        return <Calendar className="h-4 w-4" />
      case 'payment':
        return <CreditCard className="h-4 w-4" />
      case 'delivery':
        return <Truck className="h-4 w-4" />
      case 'review':
        return <Star className="h-4 w-4" />
      case 'profile':
        return <FileText className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'warning':
        return 'text-orange-600 bg-orange-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return time.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayedActivities.length === 0 ? (
          <div className="text-center py-6">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity, index) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                  getStatusColor(activity.status)
                )}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </h4>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {getTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {activity.description}
                  </p>
                  
                  {activity.metadata && (
                    <div className="flex items-center gap-2 text-xs">
                      {activity.metadata.orderId && (
                        <Badge variant="outline" className="text-xs">
                          {activity.metadata.orderId}
                        </Badge>
                      )}
                      {activity.metadata.amount && (
                        <span className="text-gray-500">
                          ₹{activity.metadata.amount.toLocaleString('en-IN')}
                        </span>
                      )}
                      {activity.metadata.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-gray-500">{activity.metadata.rating}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!showAll && activityList.length > limit && (
          <div className="mt-4 pt-4 border-t">
            <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              View all activity →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
