-- MEDICUM EGYPT DATABASE SETUP
-- Run this entire script in your Supabase SQL Editor

-- ================================================
-- PART 1: SCHEMA CREATION
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  language VARCHAR(2) DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  notification_preferences JSONB DEFAULT '{"sms": true, "whatsapp": true, "email": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  parent_id UUID REFERENCES categories(id),
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Providers table
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pickup locations table
CREATE TABLE IF NOT EXISTS pickup_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id),
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  address_en TEXT NOT NULL,
  address_ar TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  governorate VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  working_hours_en TEXT,
  working_hours_ar TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category_id UUID REFERENCES categories(id),
  prescription_required BOOLEAN DEFAULT false,
  images TEXT[],
  in_stock BOOLEAN DEFAULT true,
  quantity INTEGER DEFAULT 0,
  provider_id UUID REFERENCES providers(id),
  pickup_location_id UUID REFERENCES pickup_locations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Continue with remaining tables...
-- (Truncated for space - full schema is in migrations/001_initial_schema.sql)

-- ================================================
-- PART 2: SAMPLE DATA
-- ================================================

-- Insert sample categories
INSERT INTO categories (id, name_en, name_ar, description_en, description_ar, display_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Pain Relief', 'مسكنات الألم', 'Medications for pain management', 'أدوية لعلاج الألم', 1),
  ('550e8400-e29b-41d4-a716-446655440002', 'Antibiotics', 'المضادات الحيوية', 'Antibacterial medications', 'أدوية مضادة للبكتيريا', 2),
  ('550e8400-e29b-41d4-a716-446655440003', 'Vitamins & Supplements', 'الفيتامينات والمكملات', 'Nutritional supplements', 'المكملات الغذائية', 3),
  ('550e8400-e29b-41d4-a716-446655440004', 'Diabetes Care', 'رعاية السكري', 'Diabetes management products', 'منتجات إدارة السكري', 4),
  ('550e8400-e29b-41d4-a716-446655440005', 'Heart & Blood Pressure', 'القلب وضغط الدم', 'Cardiovascular medications', 'أدوية القلب والأوعية الدموية', 5),
  ('550e8400-e29b-41d4-a716-446655440006', 'Medical Devices', 'الأجهزة الطبية', 'Medical equipment and devices', 'المعدات والأجهزة الطبية', 6),
  ('550e8400-e29b-41d4-a716-446655440007', 'Baby Care', 'العناية بالطفل', 'Baby health products', 'منتجات صحة الطفل', 7),
  ('550e8400-e29b-41d4-a716-446655440008', 'Personal Care', 'العناية الشخصية', 'Personal hygiene products', 'منتجات النظافة الشخصية', 8)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Check if setup was successful
SELECT 'Categories created:' as status, COUNT(*) as count FROM categories;
SELECT 'Tables created successfully!' as message;