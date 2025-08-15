'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Vehicle } from '@/lib/database.types'
import { toast } from 'sonner'

export interface CartItem {
  vehicleId: string
  vehicle: Vehicle
  quantity: number
  color: string
  addedAt: string
}

interface CartState {
  items: CartItem[]
  isLoading: boolean
  error: string | null
  
  // Computed values
  totalItems: () => number
  totalAmount: () => number
  
  // Actions
  addItem: (vehicle: Vehicle, color?: string, quantity?: number) => void
  removeItem: (vehicleId: string) => void
  updateQuantity: (vehicleId: string, quantity: number) => void
  updateColor: (vehicleId: string, color: string) => void
  clearCart: () => void
  getItem: (vehicleId: string) => CartItem | undefined
  syncWithUser: (userId: string) => Promise<void>
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,
      
      totalItems: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.quantity, 0)
      },
      
      totalAmount: () => {
        const { items } = get()
        return items.reduce((total, item) => total + (item.vehicle.price * item.quantity), 0)
      },
      
      addItem: (vehicle, color, quantity = 1) => {
        try {
          const { items } = get()
          const existingItem = items.find(item => item.vehicleId === vehicle.id)
          
          if (existingItem) {
            // Update quantity if item already exists
            set({
              items: items.map(item =>
                item.vehicleId === vehicle.id
                  ? { 
                      ...item, 
                      quantity: item.quantity + quantity,
                      color: color || item.color,
                      addedAt: new Date().toISOString()
                    }
                  : item
              ),
              error: null
            })
            toast.success(`Updated ${vehicle.name} quantity in cart`)
          } else {
            // Add new item
            const newItem: CartItem = {
              vehicleId: vehicle.id,
              vehicle,
              quantity,
              color: color || vehicle.colors[0] || 'default',
              addedAt: new Date().toISOString()
            }
            
            set({
              items: [...items, newItem],
              error: null
            })
            toast.success(`Added ${vehicle.name} to cart`)
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to add item to cart'
          set({ error: message })
          toast.error(message)
        }
      },
      
      removeItem: (vehicleId) => {
        try {
          const { items } = get()
          const item = items.find(i => i.vehicleId === vehicleId)
          
          if (!item) {
            throw new Error('Item not found in cart')
          }
          
          set({
            items: items.filter(item => item.vehicleId !== vehicleId),
            error: null
          })
          
          toast.success(`Removed ${item.vehicle.name} from cart`)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to remove item from cart'
          set({ error: message })
          toast.error(message)
        }
      },
      
      updateQuantity: (vehicleId, quantity) => {
        try {
          if (quantity < 1) {
            get().removeItem(vehicleId)
            return
          }
          
          const { items } = get()
          const item = items.find(i => i.vehicleId === vehicleId)
          
          if (!item) {
            throw new Error('Item not found in cart')
          }
          
          // Check stock availability
          if (quantity > item.vehicle.stock_quantity) {
            throw new Error(`Only ${item.vehicle.stock_quantity} units available in stock`)
          }
          
          set({
            items: items.map(item =>
              item.vehicleId === vehicleId
                ? { ...item, quantity }
                : item
            ),
            error: null
          })
          
          toast.success('Cart updated')
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update quantity'
          set({ error: message })
          toast.error(message)
        }
      },
      
      updateColor: (vehicleId, color) => {
        try {
          const { items } = get()
          const item = items.find(i => i.vehicleId === vehicleId)
          
          if (!item) {
            throw new Error('Item not found in cart')
          }
          
          // Check if color is available
          if (!item.vehicle.colors.includes(color)) {
            throw new Error('Selected color is not available')
          }
          
          set({
            items: items.map(item =>
              item.vehicleId === vehicleId
                ? { ...item, color }
                : item
            ),
            error: null
          })
          
          toast.success('Color updated')
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update color'
          set({ error: message })
          toast.error(message)
        }
      },
      
      clearCart: () => {
        set({ items: [], error: null })
        toast.success('Cart cleared')
      },
      
      getItem: (vehicleId) => {
        const { items } = get()
        return items.find(item => item.vehicleId === vehicleId)
      },
      
      syncWithUser: async (userId) => {
        try {
          set({ isLoading: true, error: null })
          
          // In a real implementation, you would sync with a database
          // For now, we'll just use local storage with user-specific key
          const userCartKey = `cart_${userId}`
          const storedCart = localStorage.getItem(userCartKey)
          
          if (storedCart) {
            const parsedCart = JSON.parse(storedCart)
            set({ items: parsedCart.items || [], isLoading: false })
          } else {
            // Save current cart to user-specific storage
            const { items } = get()
            localStorage.setItem(userCartKey, JSON.stringify({ items }))
            set({ isLoading: false })
          }
          
        } catch (error) {
          console.error('Cart sync error:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to sync cart',
            isLoading: false 
          })
        }
      }
    }),
    {
      name: 'omni-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        items: state.items 
      }),
    }
  )
)
