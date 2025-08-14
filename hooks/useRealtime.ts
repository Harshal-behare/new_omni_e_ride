'use client'

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/hooks/useUser';

// TODO: Implement realtime subscriptions
// Temporary types until realtime module is implemented
type OrderStatusUpdate = any;
type NotificationEvent = any;
type AnalyticsUpdate = any;
type TestRideSlotUpdate = any;

// Hook for order status updates
export function useOrderStatusUpdates(
  options?: {
    subscribeToAll?: boolean;
    dealerId?: string;
  }
) {
  const { user } = useUser();
  const [updates, setUpdates] = useState<OrderStatusUpdate[]>([]);
  const [latestUpdate, setLatestUpdate] = useState<OrderStatusUpdate | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) return;
    // TODO: Implement realtime subscription when backend is ready
    // Placeholder implementation
  }, [user, options?.subscribeToAll, options?.dealerId]);

  return { updates, latestUpdate, error };
}

// Hook for notifications
export function useNotifications() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) return;
    // TODO: Implement notification subscription when backend is ready
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // TODO: Implement when backend is ready
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    // TODO: Implement when backend is ready
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    error,
    markAsRead,
    markAllAsRead,
  };
}

// Hook for analytics updates
export function useAnalytics(filters?: { dealerId?: string; type?: string }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [updates, setUpdates] = useState<AnalyticsUpdate[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<AnalyticsSubscription | null>(null);

  // Load initial metrics
  useEffect(() => {
    const loadMetrics = async () => {
      const subscription = createRealtimeSubscription('analytics') as AnalyticsSubscription;
      subscriptionRef.current = subscription;
      
      const initialMetrics = await subscription.getRealtimeMetrics(filters?.dealerId);
      if (initialMetrics) {
        setMetrics(initialMetrics);
      }
    };

    loadMetrics();
  }, [filters?.dealerId]);

  useEffect(() => {
    const subscription = createRealtimeSubscription('analytics') as AnalyticsSubscription;
    subscriptionRef.current = subscription;

    const handleUpdate = (update: AnalyticsUpdate) => {
      setUpdates((prev) => [update, ...prev].slice(0, 100)); // Keep last 100 updates

      // Update metrics based on the update type
      setMetrics((prev: any) => {
        if (!prev) return prev;

        switch (update.type) {
          case 'order':
            return {
              ...prev,
              totalOrders: prev.totalOrders + (update.metric === 'new_order' ? 1 : 0),
              pendingOrders: prev.pendingOrders + (update.metric === 'new_order' ? 1 : 0),
            };
          case 'revenue':
            return {
              ...prev,
              totalRevenue: prev.totalRevenue + update.value,
              completedOrders: prev.completedOrders + (update.metric === 'order_completed' ? 1 : 0),
              pendingOrders: prev.pendingOrders - (update.metric === 'order_completed' ? 1 : 0),
            };
          default:
            return prev;
        }
      });
    };

    const handleError = (err: Error) => {
      console.error('Analytics subscription error:', err);
      setError(err);
    };

    subscription.subscribe(handleUpdate, filters, handleError);
    realtimeManager.addSubscription('analytics', subscription);

    return () => {
      realtimeManager.removeSubscription('analytics');
      subscriptionRef.current = null;
    };
  }, [filters?.dealerId, filters?.type]);

  const refreshMetrics = useCallback(async () => {
    if (!subscriptionRef.current) return;

    const newMetrics = await subscriptionRef.current.getRealtimeMetrics(filters?.dealerId);
    if (newMetrics) {
      setMetrics(newMetrics);
    }
  }, [filters?.dealerId]);

  return {
    metrics,
    updates,
    error,
    refreshMetrics,
  };
}

// Hook for test ride slot updates
export function useTestRideSlots(filters?: { dealerId?: string; date?: string }) {
  const [slots, setSlots] = useState<TestRideSlotUpdate[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<TestRideSlotSubscription | null>(null);

  useEffect(() => {
    const subscription = createRealtimeSubscription('testRides') as TestRideSlotSubscription;
    subscriptionRef.current = subscription;

    const handleUpdate = (slot: TestRideSlotUpdate) => {
      setSlots((prev) => {
        const index = prev.findIndex((s) => s.id === slot.id);
        if (index >= 0) {
          // Update existing slot
          const updated = [...prev];
          updated[index] = slot;
          return updated;
        } else {
          // Add new slot
          return [...prev, slot];
        }
      });
    };

    const handleError = (err: Error) => {
      console.error('Test ride slot subscription error:', err);
      setError(err);
    };

    subscription.subscribe(handleUpdate, filters, handleError);
    realtimeManager.addSubscription('test-ride-slots', subscription);

    return () => {
      realtimeManager.removeSubscription('test-ride-slots');
      subscriptionRef.current = null;
    };
  }, [filters?.dealerId, filters?.date]);

  const checkAvailability = useCallback(
    async (dealerId: string, date: string, time: string) => {
      if (!subscriptionRef.current) return false;

      return await subscriptionRef.current.checkAvailability(dealerId, date, time);
    },
    []
  );

  const updateAvailability = useCallback(
    async (slotId: string, available: boolean) => {
      if (!subscriptionRef.current) return;

      await subscriptionRef.current.updateAvailability(slotId, available);
    },
    []
  );

  return {
    slots,
    error,
    checkAvailability,
    updateAvailability,
  };
}

// Hook for presence (online users)
export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const subscription = createRealtimeSubscription('presence') as PresenceSubscription;

    const handleSync = (users: any[]) => {
      setOnlineUsers(users);
    };

    const handleJoin = (user: any) => {
      console.log('User joined:', user);
    };

    const handleLeave = (user: any) => {
      console.log('User left:', user);
    };

    const handleError = (err: Error) => {
      console.error('Presence subscription error:', err);
      setError(err);
    };

    subscription.subscribeToPresence(handleSync, handleJoin, handleLeave, handleError);
    realtimeManager.addSubscription('presence', subscription);

    return () => {
      realtimeManager.removeSubscription('presence');
    };
  }, []);

  return {
    onlineUsers,
    error,
  };
}

// Hook to clean up all subscriptions on unmount
export function useRealtimeCleanup() {
  useEffect(() => {
    return () => {
      realtimeManager.unsubscribeAll();
    };
  }, []);
}
