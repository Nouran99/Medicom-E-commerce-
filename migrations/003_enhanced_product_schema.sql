-- ENHANCED PRODUCT SCHEMA FOR MEDICUM EGYPT
-- Run this after the initial migrations

-- First, let's drop the old products table constraints
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE inventory_lots DROP CONSTRAINT IF EXISTS inventory_lots_product_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_product_id_fkey;

-- Create sellers table (for seller profiles)
CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_code VARCHAR(50) UNIQUE NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  company_name VARCHAR(255),
  bio_en TEXT,
  bio_ar TEXT,
  logo_url TEXT,
  address TEXT,
  city VARCHAR(100),
  governorate VARCHAR(100),
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Platform commission percentage
  bank_account_details JSONB, -- Encrypted in production
  documents JSONB, -- License, certificates, etc.
  is_active BOOLEAN DEFAULT true,
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enhanced products table
CREATE TABLE IF NOT EXISTS products_enhanced (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Information
  product_code VARCHAR(100) UNIQUE NOT NULL, -- SKU/Product code
  name_en VARCHAR(500) NOT NULL,
  name_ar VARCHAR(500) NOT NULL,
  
  -- Pricing
  price_per_unit DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EGP',
  
  -- Images (up to 7)
  product_images JSONB DEFAULT '[]'::jsonb, -- Array of {url, alt_text, is_primary}
  
  -- Specifications
  product_specs JSONB, -- Detailed specifications as JSON
  active_ingredient TEXT, -- NEW: Active pharmaceutical ingredient
  side_effects TEXT, -- NEW: Possible side effects
  
  -- Seller Information
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  
  -- Delivery Information
  delivery_method VARCHAR(50)[], -- Array: ['courier', 'pickup', 'both']
  delivery_days_min INTEGER NOT NULL DEFAULT 1,
  delivery_days_max INTEGER NOT NULL DEFAULT 3,
  delivery_cost DECIMAL(10, 2) DEFAULT 0,
  free_delivery_threshold DECIMAL(10, 2), -- Free delivery if order above this amount
  
  -- Quantity Information
  minimum_quantity INTEGER DEFAULT 1,
  maximum_quantity INTEGER, -- Max per order
  unit_item VARCHAR(50) NOT NULL, -- piece, box, strip, bottle, packet, etc.
  units_per_pack INTEGER DEFAULT 1, -- How many units in one pack
  
  -- Stock Management
  in_stock BOOLEAN DEFAULT true,
  quantity_available INTEGER DEFAULT 0,
  stock_alert_level INTEGER DEFAULT 10, -- NEW: Alert when stock below this
  
  -- Medical Information
  prescription_required BOOLEAN DEFAULT false,
  controlled_substance BOOLEAN DEFAULT false,
  storage_conditions TEXT, -- e.g., "Store below 25°C"
  expiry_date DATE,
  batch_number VARCHAR(100),
  manufacturer VARCHAR(255),
  country_of_origin VARCHAR(100),
  
  -- Extra Information
  extra_information JSONB, -- Any additional data
  usage_instructions_en TEXT,
  usage_instructions_ar TEXT,
  warnings_en TEXT,
  warnings_ar TEXT,
  
  -- Categorization
  category_id UUID REFERENCES categories(id),
  subcategory VARCHAR(255),
  tags TEXT[], -- Array of tags for search
  
  -- SEO & Search
  meta_title_en VARCHAR(255),
  meta_title_ar VARCHAR(255),
  meta_description_en TEXT,
  meta_description_ar TEXT,
  search_keywords TEXT[],
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'out_of_stock')),
  featured BOOLEAN DEFAULT false,
  promotion_text VARCHAR(255), -- e.g., "20% OFF", "Buy 2 Get 1"
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Create delivery methods table
CREATE TABLE IF NOT EXISTS delivery_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  base_cost DECIMAL(10, 2) DEFAULT 0,
  cost_per_km DECIMAL(10, 2) DEFAULT 0,
  min_days INTEGER DEFAULT 1,
  max_days INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create seller reviews table
CREATE TABLE IF NOT EXISTS seller_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product questions table
CREATE TABLE IF NOT EXISTS product_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products_enhanced(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  question TEXT NOT NULL,
  answer TEXT,
  answered_by UUID REFERENCES sellers(id),
  answered_at TIMESTAMP WITH TIME ZONE,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_enhanced_seller ON products_enhanced(seller_id);
CREATE INDEX idx_products_enhanced_category ON products_enhanced(category_id);
CREATE INDEX idx_products_enhanced_code ON products_enhanced(product_code);
CREATE INDEX idx_products_enhanced_status ON products_enhanced(status);
CREATE INDEX idx_products_enhanced_featured ON products_enhanced(featured);
CREATE INDEX idx_products_enhanced_search ON products_enhanced USING gin(search_keywords);
CREATE INDEX idx_products_enhanced_tags ON products_enhanced USING gin(tags);
CREATE INDEX idx_sellers_code ON sellers(seller_code);
CREATE INDEX idx_sellers_email ON sellers(email);

-- Create full-text search index
CREATE INDEX idx_products_enhanced_fulltext ON products_enhanced 
USING gin(to_tsvector('english', name_en || ' ' || COALESCE(usage_instructions_en, '') || ' ' || COALESCE(active_ingredient, '')));

CREATE INDEX idx_products_enhanced_fulltext_ar ON products_enhanced 
USING gin(to_tsvector('arabic', name_ar || ' ' || COALESCE(usage_instructions_ar, '')));

-- Add triggers for updated_at
CREATE TRIGGER update_products_enhanced_updated_at 
BEFORE UPDATE ON products_enhanced 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sellers_updated_at 
BEFORE UPDATE ON sellers 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample sellers
INSERT INTO sellers (id, seller_code, name_en, name_ar, email, phone, company_name, verified, rating) VALUES
  ('750e8400-e29b-41d4-a716-446655440101', 'SELLER001', 'Ahmed Hassan', 'أحمد حسن', 'ahmed@medicumegypt.com', '01001234567', 'Cairo Pharma Co.', true, 4.8),
  ('750e8400-e29b-41d4-a716-446655440102', 'SELLER002', 'Fatima Ali', 'فاطمة علي', 'fatima@medicumegypt.com', '01009876543', 'Nile Medical Supplies', true, 4.6),
  ('750e8400-e29b-41d4-a716-446655440103', 'SELLER003', 'Mohamed Saeed', 'محمد سعيد', 'mohamed@medicumegypt.com', '01005551234', 'Giza Health Store', true, 4.9)
ON CONFLICT (id) DO NOTHING;

-- Insert sample enhanced products
INSERT INTO products_enhanced (
  product_code, name_en, name_ar, price_per_unit, 
  product_images, product_specs, active_ingredient, side_effects,
  seller_id, delivery_method, delivery_days_min, delivery_days_max,
  minimum_quantity, unit_item, stock_alert_level, quantity_available,
  category_id, prescription_required, extra_information
) VALUES
(
  'MED-PAR-500', 
  'Paracetamol 500mg - Extra Strength Pain Relief', 
  'باراسيتامول 500 ملجم - مسكن قوي للألم',
  35.50,
  '[{"url": "/images/products/paracetamol-1.jpg", "alt_text": "Paracetamol Box", "is_primary": true},
    {"url": "/images/products/paracetamol-2.jpg", "alt_text": "Paracetamol Strips", "is_primary": false}]'::jsonb,
  '{"dosage": "500mg", "form": "Tablets", "package_size": "20 tablets", "manufacturer": "EgyPharma"}'::jsonb,
  'Paracetamol 500mg',
  'Rare: Allergic reactions, skin rash. Overdose can cause liver damage.',
  '750e8400-e29b-41d4-a716-446655440101',
  ARRAY['courier', 'pickup'],
  1, 2,
  1, 'strip', 20, 500,
  '550e8400-e29b-41d4-a716-446655440001',
  false,
  '{"indication": "Fever and mild to moderate pain", "contraindication": "Liver disease"}'::jsonb
),
(
  'MED-AMOX-500',
  'Amoxicillin 500mg - Broad Spectrum Antibiotic',
  'أموكسيسيلين 500 ملجم - مضاد حيوي واسع المجال',
  125.00,
  '[{"url": "/images/products/amoxicillin-1.jpg", "alt_text": "Amoxicillin Box", "is_primary": true}]'::jsonb,
  '{"dosage": "500mg", "form": "Capsules", "package_size": "14 capsules", "manufacturer": "Pharco"}'::jsonb,
  'Amoxicillin 500mg',
  'Common: Nausea, diarrhea, skin rash. Rare: Allergic reactions.',
  '750e8400-e29b-41d4-a716-446655440102',
  ARRAY['courier'],
  1, 3,
  1, 'box', 15, 200,
  '550e8400-e29b-41d4-a716-446655440002',
  true,
  '{"indication": "Bacterial infections", "duration": "7-14 days course"}'::jsonb
),
(
  'MED-VITD-1000',
  'Vitamin D3 1000 IU - Bone & Immune Support',
  'فيتامين د3 1000 وحدة دولية - لصحة العظام والمناعة',
  89.99,
  '[{"url": "/images/products/vitamind-1.jpg", "alt_text": "Vitamin D3 Bottle", "is_primary": true}]'::jsonb,
  '{"dosage": "1000 IU", "form": "Soft Gels", "package_size": "60 capsules", "manufacturer": "Vitabiotics"}'::jsonb,
  'Cholecalciferol (Vitamin D3) 1000 IU',
  'Rare: Hypercalcemia with excessive doses.',
  '750e8400-e29b-41d4-a716-446655440103',
  ARRAY['courier', 'pickup'],
  2, 4,
  1, 'bottle', 25, 300,
  '550e8400-e29b-41d4-a716-446655440003',
  false,
  '{"benefits": "Bone health, immune support, muscle function"}'::jsonb
)
ON CONFLICT (product_code) DO NOTHING;

-- Create view for backward compatibility
CREATE OR REPLACE VIEW products AS
SELECT 
  id,
  product_code as sku,
  name_en,
  name_ar,
  product_specs->>'manufacturer' as description_en,
  product_specs->>'manufacturer' as description_ar,
  price_per_unit as price,
  category_id,
  prescription_required,
  ARRAY[product_images->0->>'url'] as images,
  in_stock,
  quantity_available as quantity,
  seller_id as provider_id,
  null as pickup_location_id,
  created_at,
  updated_at
FROM products_enhanced;

-- Grant permissions
GRANT SELECT ON products_enhanced TO anon;
GRANT SELECT ON sellers TO anon;
GRANT SELECT ON products TO anon;
GRANT ALL ON products_enhanced TO authenticated;
GRANT ALL ON sellers TO authenticated;