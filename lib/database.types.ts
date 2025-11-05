export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'customer' | 'dealer' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: 'customer' | 'dealer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'customer' | 'dealer' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          slug: string
          name: string
          tagline: string | null
          price: number
          images: string[]
          colors: string[]
          badges: string[]
          range_km: number
          top_speed: number
          charge_hours: number
          motor_power_w: number | null
          battery_wh: number | null
          ev_units_per_100km: number | null
          petrol_km_per_l: number | null
          rating: number
          reviews_count: number
          is_active: boolean
          stock_quantity: number
          created_at: string
          updated_at: string
          released_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          name: string
          tagline?: string | null
          price: number
          images?: string[]
          colors?: string[]
          badges?: string[]
          range_km: number
          top_speed: number
          charge_hours: number
          motor_power_w?: number | null
          battery_wh?: number | null
          ev_units_per_100km?: number | null
          petrol_km_per_l?: number | null
          rating?: number
          reviews_count?: number
          is_active?: boolean
          stock_quantity?: number
          created_at?: string
          updated_at?: string
          released_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          tagline?: string | null
          price?: number
          images?: string[]
          colors?: string[]
          badges?: string[]
          range_km?: number
          top_speed?: number
          charge_hours?: number
          motor_power_w?: number | null
          battery_wh?: number | null
          ev_units_per_100km?: number | null
          petrol_km_per_l?: number | null
          rating?: number
          reviews_count?: number
          is_active?: boolean
          stock_quantity?: number
          created_at?: string
          updated_at?: string
          released_at?: string | null
        }
      }
      test_rides: {
        Row: {
          id: string
          user_id: string
          vehicle_id: string
          dealer_id: string | null
          scheduled_date: string
          scheduled_time: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          payment_status: 'pending' | 'paid' | 'refunded'
          payment_amount: number
          payment_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vehicle_id: string
          dealer_id?: string | null
          scheduled_date: string
          scheduled_time: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          payment_status?: 'pending' | 'paid' | 'refunded'
          payment_amount: number
          payment_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vehicle_id?: string
          dealer_id?: string | null
          scheduled_date?: string
          scheduled_time?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          payment_status?: 'pending' | 'paid' | 'refunded'
          payment_amount?: number
          payment_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      dealers: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          address: string
          city: string
          state: string
          pincode: string
          google_maps_link: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          address: string
          city: string
          state: string
          pincode: string
          google_maps_link?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          city?: string
          state?: string
          pincode?: string
          google_maps_link?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          subject: string
          message: string
          priority: 'normal' | 'urgent'
          source: 'contact' | 'inquiry' | 'warranty' | 'test_ride'
          status: 'new' | 'assigned' | 'contacted' | 'qualified' | 'converted' | 'closed'
          assigned_to: string | null
          vehicle_id: string | null
          dealer_id: string | null
          notes: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          subject: string
          message: string
          priority?: 'normal' | 'urgent'
          source?: 'contact' | 'inquiry' | 'warranty' | 'test_ride'
          status?: 'new' | 'assigned' | 'contacted' | 'qualified' | 'converted' | 'closed'
          assigned_to?: string | null
          vehicle_id?: string | null
          dealer_id?: string | null
          notes?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          subject?: string
          message?: string
          priority?: 'normal' | 'urgent'
          source?: 'contact' | 'inquiry' | 'warranty' | 'test_ride'
          status?: 'new' | 'assigned' | 'contacted' | 'qualified' | 'converted' | 'closed'
          assigned_to?: string | null
          vehicle_id?: string | null
          dealer_id?: string | null
          notes?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          vehicle_id: string
          dealer_id: string | null
          quantity: number
          unit_price: number
          total_amount: number
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method: 'card' | 'upi' | 'netbanking' | 'wallet'
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          shipping_address: Json
          billing_address: Json
          tracking_number: string | null
          delivered_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vehicle_id: string
          dealer_id?: string | null
          quantity?: number
          unit_price: number
          total_amount: number
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method?: 'card' | 'upi' | 'netbanking' | 'wallet'
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          shipping_address: Json
          billing_address: Json
          tracking_number?: string | null
          delivered_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vehicle_id?: string
          dealer_id?: string | null
          quantity?: number
          unit_price?: number
          total_amount?: number
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method?: 'card' | 'upi' | 'netbanking' | 'wallet'
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          shipping_address?: Json
          billing_address?: Json
          tracking_number?: string | null
          delivered_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']
export type TestRide = Database['public']['Tables']['test_rides']['Row']
export type TestRideInsert = Database['public']['Tables']['test_rides']['Insert']
export type TestRideUpdate = Database['public']['Tables']['test_rides']['Update']
export type Dealer = Database['public']['Tables']['dealers']['Row']
export type DealerInsert = Database['public']['Tables']['dealers']['Insert']
export type DealerUpdate = Database['public']['Tables']['dealers']['Update']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']
export type Lead = Database['public']['Tables']['leads']['Row']
export type LeadInsert = Database['public']['Tables']['leads']['Insert']
export type LeadUpdate = Database['public']['Tables']['leads']['Update']

// Type for query filters
export interface VehicleFilters {
  minPrice?: number
  maxPrice?: number
  minRange?: number
  maxRange?: number
  badges?: string[]
  sortBy?: 'price' | 'range' | 'rating' | 'name'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// Order related types
export interface Address {
  full_name: string
  phone: string
  email: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  pincode: string
  country: string
}

export interface OrderFilters {
  user_id?: string
  dealer_id?: string
  status?: Order['status'][]
  payment_status?: Order['payment_status'][]
  from_date?: string
  to_date?: string
  sortBy?: 'created_at' | 'total_amount' | 'status'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface OrderAnalytics {
  total_orders: number
  total_revenue: number
  average_order_value: number
  orders_by_status: Record<string, number>
  orders_by_month: Array<{ month: string; count: number; revenue: number }>
  top_selling_vehicles: Array<{ vehicle_id: string; name: string; count: number; revenue: number }>
  revenue_by_dealer: Array<{ dealer_id: string; name: string; revenue: number }>
}
