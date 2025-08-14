'use client';

import { useEffect, useState } from 'react';
import { Package, Truck, CheckCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { useOrderStatusUpdates } from '@/hooks/useRealtime';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface OrderStatusTrackerProps {
  orderId?: string;
  showAll?: boolean;
  dealerId?: string;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'processing':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'shipped':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'delivered':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'cancelled':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getProgressValue = (status: string) => {
  switch (status) {
    case 'pending':
      return 25;
    case 'processing':
      return 50;
    case 'shipped':
      return 75;
    case 'delivered':
      return 100;
    default:
      return 0;
  }
};

export function OrderStatusTracker({ orderId, showAll = false, dealerId }: OrderStatusTrackerProps) {
  const { updates, latestUpdate } = useOrderStatusUpdates({
    subscribeToAll: showAll,
    dealerId,
  });
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);

  useEffect(() => {
    if (latestUpdate && (!orderId || latestUpdate.order_id === orderId)) {
      // Show toast or notification for new update
      console.log('New order status update:', latestUpdate);
    }
  }, [latestUpdate, orderId]);

  const filteredUpdates = orderId
    ? updates.filter((u) => u.order_id === orderId)
    : updates;

  if (!showAll && orderId) {
    // Single order tracking view
    const currentStatus = filteredUpdates[0]?.status || 'pending';
    const currentStepIndex = statusSteps.findIndex((s) => s.key === currentStatus);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Order Status</span>
            <Badge className={cn('capitalize', getStatusColor(currentStatus))}>
              {currentStatus}
            </Badge>
          </CardTitle>
          <CardDescription>
            Track your order in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress bar */}
          <div className="relative">
            <Progress value={getProgressValue(currentStatus)} className="h-2" />
            <div className="absolute top-0 left-0 w-full flex justify-between -mt-1">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div
                    key={step.key}
                    className={cn(
                      'flex flex-col items-center',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-full p-2 bg-background border-2',
                        isActive ? 'border-primary bg-primary/10' : 'border-muted',
                        isCurrent && 'ring-4 ring-primary/20'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs mt-2 text-center">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent updates */}
          {filteredUpdates.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Recent Updates</h4>
              <div className="space-y-2">
                {filteredUpdates.slice(0, 3).map((update) => (
                  <Alert key={update.id} className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{update.message}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(update.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Multiple orders tracking view (for admin/dealer)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Order Updates</CardTitle>
        <CardDescription>
          Real-time order status changes across all orders
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filteredUpdates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No recent order updates</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUpdates.slice(0, 10).map((update) => (
              <div
                key={update.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedUpdate(update)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', getStatusColor(update.status))}>
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      Order #{update.order_id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-muted-foreground">{update.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {update.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(update.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredUpdates.length > 10 && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/dashboard/orders'}
            >
              View all orders
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
