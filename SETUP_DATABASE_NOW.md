# 🚨 URGENT: Database Setup Required

The products data is ready but the database tables don't exist in Supabase yet. Please follow these steps:

## ✅ Quick Setup Steps:

### 1. Open Supabase Dashboard
Go to: https://app.supabase.com
- Your project ID: `qxgmnbbbospkemikpjrv`

### 2. Click on "SQL Editor" (left sidebar)

### 3. Copy and paste this SQL code:

```sql
-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code VARCHAR(100) UNIQUE,
  sku VARCHAR(100),
  barcode VARCHAR(100),
  name_en VARCHAR(500) NOT NULL,
  name_ar VARCHAR(500),
  description_en TEXT,
  description_ar TEXT,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  brand VARCHAR(255),
  manufacturer VARCHAR(255),
  country_of_origin VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  price_per_unit DECIMAL(10, 2),
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  tax_percentage DECIMAL(5, 2) DEFAULT 14,
  stock_quantity INTEGER DEFAULT 0,
  min_order_quantity INTEGER DEFAULT 1,
  max_order_quantity INTEGER DEFAULT 10,
  requires_prescription BOOLEAN DEFAULT false,
  active_ingredient TEXT,
  dosage_form VARCHAR(100),
  side_effects TEXT,
  contraindications TEXT,
  storage_conditions TEXT,
  delivery_method VARCHAR(50),
  delivery_days_min INTEGER DEFAULT 1,
  delivery_days_max INTEGER DEFAULT 3,
  delivery_fee DECIMAL(10, 2) DEFAULT 30,
  image_url TEXT,
  product_images JSONB,
  specifications JSONB,
  unit VARCHAR(50),
  unit_size VARCHAR(100),
  unit_item VARCHAR(50),
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description_en TEXT,
  description_ar TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_prescription ON products(requires_prescription);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Enable Row Level Security (optional)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on products" 
  ON products FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access on categories" 
  ON categories FOR SELECT 
  USING (true);

-- Verify tables were created
SELECT 'Tables created successfully!' as message;
```

### 4. Click "Run" button

### 5. After tables are created, run this command:

Come back here and I'll run the data import script again:
```bash
node load_data_to_supabase.js
```

## Alternative: Use the Complete SQL File

If you prefer, you can use the complete SQL file that includes both table creation AND data:
- File: `CREATE_TABLES_AND_IMPORT.sql`
- This file has everything - tables + 20 products ready to go

## Why This Is Happening:

- The Supabase database is empty (no tables)
- We need to create the schema first
- Once tables exist, the data loads automatically

## After Tables Are Created:

I have a script ready (`load_data_to_supabase.js`) that will:
- Insert all 20 products
- Set up categories
- Verify the import

Just let me know when you've created the tables and I'll load the data!