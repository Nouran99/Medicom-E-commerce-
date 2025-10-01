// Enhanced Type Definitions for Medicum Egypt

export interface Seller {
  id: string;
  seller_code: string;
  name_en: string;
  name_ar: string;
  email: string;
  phone: string;
  whatsapp?: string;
  company_name?: string;
  bio_en?: string;
  bio_ar?: string;
  logo_url?: string;
  address?: string;
  city?: string;
  governorate?: string;
  rating: number;
  total_reviews: number;
  total_sales: number;
  verified: boolean;
  commission_rate: number;
  is_active: boolean;
  joined_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ProductImage {
  url: string;
  alt_text: string;
  is_primary: boolean;
}

export interface ProductSpecs {
  dosage?: string;
  form?: string;
  package_size?: string;
  manufacturer?: string;
  [key: string]: any;
}

export interface ProductEnhanced {
  id: string;
  
  // Basic Information
  product_code: string;
  name_en: string;
  name_ar: string;
  
  // Pricing
  price_per_unit: number;
  currency: string;
  
  // Images
  product_images: ProductImage[];
  
  // Specifications
  product_specs: ProductSpecs;
  active_ingredient?: string;
  side_effects?: string;
  
  // Seller
  seller_id: string;
  seller?: Seller;
  
  // Delivery
  delivery_method: ('courier' | 'pickup')[];
  delivery_days_min: number;
  delivery_days_max: number;
  delivery_cost: number;
  free_delivery_threshold?: number;
  
  // Quantity
  minimum_quantity: number;
  maximum_quantity?: number;
  unit_item: string; // piece, box, strip, bottle, packet
  units_per_pack: number;
  
  // Stock
  in_stock: boolean;
  quantity_available: number;
  stock_alert_level: number;
  
  // Medical Information
  prescription_required: boolean;
  controlled_substance: boolean;
  storage_conditions?: string;
  expiry_date?: Date;
  batch_number?: string;
  manufacturer?: string;
  country_of_origin?: string;
  
  // Extra Information
  extra_information?: any;
  usage_instructions_en?: string;
  usage_instructions_ar?: string;
  warnings_en?: string;
  warnings_ar?: string;
  
  // Categorization
  category_id: string;
  subcategory?: string;
  tags?: string[];
  
  // SEO
  meta_title_en?: string;
  meta_title_ar?: string;
  meta_description_en?: string;
  meta_description_ar?: string;
  search_keywords?: string[];
  
  // Analytics
  view_count: number;
  purchase_count: number;
  
  // Status
  status: 'active' | 'inactive' | 'draft' | 'out_of_stock';
  featured: boolean;
  promotion_text?: string;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
}

export interface ProductQuestion {
  id: string;
  product_id: string;
  user_id: string;
  question: string;
  answer?: string;
  answered_by?: string;
  answered_at?: Date;
  is_public: boolean;
  created_at: Date;
}

export interface SellerReview {
  id: string;
  seller_id: string;
  user_id: string;
  order_id: string;
  rating: number;
  comment?: string;
  is_verified_purchase: boolean;
  created_at: Date;
}

export interface DeliveryMethod {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  base_cost: number;
  cost_per_km: number;
  min_days: number;
  max_days: number;
  is_active: boolean;
  created_at: Date;
}