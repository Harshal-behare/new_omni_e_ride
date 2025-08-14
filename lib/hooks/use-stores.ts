'use client'

import { useEffect } from 'react'
import { 
  useAuthStore, 
  useCartStore, 
  useVehiclesStore, 
  useOrdersStore, 
  useNotificationsStore 
} from '@/lib/stores'

/**
 * Hook to initialize auth and sync cart with user
 * Use this in your root layout or app component
 */
export function useInitializeStores() {
  const { initialize: initAuth, user } = useAuthStore()
  const { syncWithUser } = useCartStore()
  const { initialize: initNotifications, cleanup: cleanupNotifications } = useNotificationsStore()

  useEffect(() => {
    // Initialize auth on mount
    initAuth()
  }, [initAuth])

  useEffect(() => {
    // Sync cart and notifications when user changes
    if (user) {
      syncWithUser(user.id)
      initNotifications(user.id)
    }

    // Cleanup notifications on unmount or user change
    return () => {
      cleanupNotifications()
    }
  }, [user, syncWithUser, initNotifications, cleanupNotifications])
}

/**
 * Hook to fetch vehicles on mount
 * Use this in pages that display vehicles
 */
export function useVehicles(filters?: Parameters<typeof useVehiclesStore.getState>['fetchVehicles'][0]) {
  const { fetchVehicles, vehicles, isLoading, error } = useVehiclesStore()

  useEffect(() => {
    fetchVehicles(filters)
  }, []) // Only run on mount, filters handled by setFilters action

  return { vehicles, isLoading, error }
}

/**
 * Hook to fetch user orders
 * Use this in user dashboard or order history pages
 */
export function useUserOrders() {
  const { user } = useAuthStore()
  const { fetchUserOrders, userOrders, isLoading, error } = useOrdersStore()

  useEffect(() => {
    if (user) {
      fetchUserOrders(user.id)
    }
  }, [user, fetchUserOrders])

  return { orders: userOrders, isLoading, error }
}

/**
 * Hook to manage cart with computed values
 * Use this in cart components
 */
export function useCart() {
  const cart = useCartStore()
  const totalItems = cart.totalItems()
  const totalAmount = cart.totalAmount()

  return {
    ...cart,
    totalItems,
    totalAmount,
  }
}

/**
 * Hook to handle authenticated actions
 * Wraps actions that require authentication
 */
export function useAuthenticatedAction<T extends any[], R>(
  action: (...args: T) => R | Promise<R>,
  options?: {
    requireAuth?: boolean
    onUnauthenticated?: () => void
  }
) {
  const { user } = useAuthStore()
  const { requireAuth = true, onUnauthenticated } = options || {}

  return async (...args: T): Promise<R | undefined> => {
    if (requireAuth && !user) {
      if (onUnauthenticated) {
        onUnauthenticated()
      } else {
        // Default behavior - you might want to redirect to login
        console.warn('User must be authenticated to perform this action')
      }
      return undefined
    }

    return action(...args)
  }
}

/**
 * Hook for real-time notification badge
 * Use this in your header/navbar component
 */
export function useNotificationBadge() {
  const { unreadCount } = useNotificationsStore()
  return unreadCount
}

/**
 * Example usage in a component:
 * 
 * function MyComponent() {
 *   const { vehicles, isLoading } = useVehicles({ minPrice: 50000 })
 *   const { addItem } = useCart()
 *   const authenticatedAddToCart = useAuthenticatedAction(addItem)
 *   
 *   if (isLoading) return <div>Loading...</div>
 *   
 *   return (
 *     <div>
 *       {vehicles.map(vehicle => (
 *         <button onClick={() => authenticatedAddToCart(vehicle)}>
 *           Add to Cart
 *         </button>
 *       ))}
 *     </div>
 *   )
 * }
 */
