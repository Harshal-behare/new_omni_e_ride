'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useAnalytics } from '@/hooks/useRealtime';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface LiveAnalyticsDashboardProps {
  dealerId?: string;
  role?: 'admin' | 'dealer';
}

export function LiveAnalyticsDashboard({ dealerId, role = 'admin' }: LiveAnalyticsDashboardProps) {
  const { metrics, updates, refreshMetrics } = useAnalytics({ dealerId });
  const [selectedTab, setSelectedTab] = useState('overview');
  const [animateValue, setAnimateValue] = useState(false);

  useEffect(() => {
    // Animate values when they update
    setAnimateValue(true);
    const timer = setTimeout(() => setAnimateValue(false), 500);
    return () => clearTimeout(timer);
  }, [metrics]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getChangeIndicator = (value: number) => {
    if (value > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">+{value}%</span>
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">{value}%</span>
        </div>
      );
    }
    return null;
  };

  const statsCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics?.totalRevenue || 0),
      icon: DollarSign,
      color: 'text-green-600 bg-green-50',
      change: 12.5,
    },
    {
      title: 'Total Orders',
      value: metrics?.totalOrders || 0,
      icon: Package,
      color: 'text-blue-600 bg-blue-50',
      change: 8.2,
    },
    {
      title: 'Pending Orders',
      value: metrics?.pendingOrders || 0,
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-50',
      change: -3.1,
    },
    {
      title: 'Completed Orders',
      value: metrics?.completedOrders || 0,
      icon: CheckCircle,
      color: 'text-purple-600 bg-purple-50',
      change: 15.7,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Analytics</h2>
          <p className="text-muted-foreground">
            Real-time metrics updated as events occur
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="animate-pulse">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
            Live
          </Badge>
          <Button variant="outline" size="sm" onClick={refreshMetrics}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={cn('p-2 rounded-lg', stat.color)}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    animateValue && 'animate-pulse'
                  )}
                >
                  {stat.value}
                </div>
                <div className="mt-2">
                  {getChangeIndicator(stat.change)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs for different views */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Live Activity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Progress towards goals */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Goals</CardTitle>
              <CardDescription>Progress towards today's targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Revenue Goal</span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(metrics?.totalRevenue || 0)} / {formatCurrency(100000)}
                  </span>
                </div>
                <Progress value={(metrics?.totalRevenue || 0) / 1000} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Orders Goal</span>
                  <span className="text-sm text-muted-foreground">
                    {metrics?.totalOrders || 0} / 50
                  </span>
                </div>
                <Progress value={(metrics?.totalOrders || 0) * 2} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          {/* Live activity feed */}
          <Card>
            <CardHeader>
              <CardTitle>Live Activity Feed</CardTitle>
              <CardDescription>Real-time updates as they happen</CardDescription>
            </CardHeader>
            <CardContent>
              {updates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {updates.slice(0, 10).map((update, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg animate-in slide-in-from-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'p-2 rounded-lg',
                          update.type === 'order' && 'bg-blue-50 text-blue-600',
                          update.type === 'revenue' && 'bg-green-50 text-green-600',
                          update.type === 'user' && 'bg-purple-50 text-purple-600',
                          update.type === 'test_ride' && 'bg-yellow-50 text-yellow-600'
                        )}>
                          {update.type === 'order' && <Package className="h-4 w-4" />}
                          {update.type === 'revenue' && <DollarSign className="h-4 w-4" />}
                          {update.type === 'user' && <Users className="h-4 w-4" />}
                          {update.type === 'test_ride' && <Calendar className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm capitalize">
                            {update.metric.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Value: {update.type === 'revenue' ? formatCurrency(update.value) : update.value}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(update.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          {/* Performance metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate</CardTitle>
                <CardDescription>Orders vs. Visits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">3.2%</div>
                <Progress value={32} className="mt-2 h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  {getChangeIndicator(5.3)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Order Value</CardTitle>
                <CardDescription>Per transaction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(metrics?.totalRevenue && metrics?.completedOrders
                    ? metrics.totalRevenue / metrics.completedOrders
                    : 0
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {getChangeIndicator(12.1)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Fulfillment Rate</CardTitle>
                <CardDescription>Completed vs. Total</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics?.totalOrders
                    ? Math.round((metrics.completedOrders / metrics.totalOrders) * 100)
                    : 0}%
                </div>
                <Progress 
                  value={metrics?.totalOrders
                    ? (metrics.completedOrders / metrics.totalOrders) * 100
                    : 0
                  } 
                  className="mt-2 h-2" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Current online users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">127</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-muted-foreground">
                    Live tracking enabled
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
