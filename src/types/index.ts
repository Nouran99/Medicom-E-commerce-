// Core Type Definitions for Medicum Egypt

export interface User {
  id: string;
  phone: string;
  email: string;
  name: string;
  language: 'ar' | 'en';
  role: 'customer' | 'admin';
  notification_preferences: {
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
  };
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: string;
  sku: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price: number;
  category_id: string;
  prescription_required: boolean;
  images: string[];
  in_stock: boolean;
  quantity: number;
  provider_id: string;
  pickup_location_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  parent_id?: string;
  image_url?: string;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface InventoryLot {
  id: string;
  product_id: string;
  lot_number: string;
  batch_number: string;
  expiry_date: Date;
  quantity: number;
  location: string;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  discount: number;
  total: number;
  currency: 'EGP';
  delivery_method: 'courier' | 'pickup';
  delivery_address?: Address;
  pickup_location_id?: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  coupon_id?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'prescription_review'
  | 'prescription_approved'
  | 'prescription_rejected'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 'cod' | 'fawry' | 'card' | 'wallet';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  total: number;
  prescription_required: boolean;
  prescription_id?: string;
}

export interface Prescription {
  id: string;
  order_id: string;
  order_item_id: string;
  file_url: string;
  upload_date: Date;
  review_status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  review_date?: Date;
  rejection_reason?: string;
  refund_eligible_until?: Date;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  street: string;
  building: string;
  floor?: string;
  apartment?: string;
  city: string;
  governorate: string;
  postal_code?: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Coupon {
  id: string;
  code: string;
  description_en: string;
  description_ar: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order: number;
  maximum_discount?: number;
  valid_from: Date;
  valid_until: Date;
  usage_limit?: number;
  usage_count: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Provider {
  id: string;
  name_en: string;
  name_ar: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PickupLocation {
  id: string;
  provider_id: string;
  name_en: string;
  name_ar: string;
  address_en: string;
  address_ar: string;
  city: string;
  governorate: string;
  phone: string;
  working_hours_en: string;
  working_hours_ar: string;
  lat?: number;
  lng?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Cart {
  user_id: string;
  items: CartItem[];
  coupon_code?: string;
  subtotal: number;
  discount: number;
  tax: number;
  delivery_fee: number;
  total: number;
  updated_at: Date;
}

export interface CartItem {
  product_id: string;
  quantity: number;
  price: number;
  prescription_required: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'order_confirmation' | 'status_update' | 'delivery' | 'prescription' | 'promotion';
  channel: 'sms' | 'whatsapp' | 'email';
  recipient: string;
  subject?: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at?: Date;
  error_message?: string;
  created_at: Date;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string;
  rating: number;
  title?: string;
  comment?: string;
  is_verified_purchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  moderated_by?: string;
  moderated_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support';
  permissions: string[];
  two_factor_enabled: boolean;
  last_login: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: any;
  new_values?: any;
  ip_address: string;
  user_agent: string;
  created_at: Date;
}