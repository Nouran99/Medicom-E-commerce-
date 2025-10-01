#!/usr/bin/env node

/**
 * Import products directly to Supabase database
 * This script reads the Excel data and inserts it into Supabase
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Load environment variables
require('dotenv').config({ path: '.dev.vars' });

// Supabase configuration from .dev.vars
const SUPABASE_URL = 'https://qxgmnbbbospkemikpjrv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Z21uYmJib3Nwa2VtaWtwanJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg3OTA2NCwiZXhwIjoyMDc0NDU1MDY0fQ.6JfZwPkEfB51DAMh9-ecr9ZfJmdFhwGNjMZiy2u_Jik';

async function importProducts() {
  try {
    console.log('📚 Reading Excel file...');
    
    // Read the Excel file
    const workbook = XLSX.readFile('/home/user/webapp/medicum_products_poc.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const products = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`✅ Found ${products.length} products to import`);
    
    // Transform products for database
    const transformedProducts = products.map(product => {
      // Parse JSON fields
      let productImages = [];
      let specifications = {};
      
      try {
        if (product.product_images) {
          productImages = typeof product.product_images === 'string' 
            ? JSON.parse(product.product_images) 
            : product.product_images;
        }
      } catch (e) {
        console.warn(`Failed to parse product_images for ${product.product_code}`);
      }
      
      try {
        if (product.specifications) {
          specifications = typeof product.specifications === 'string'
            ? JSON.parse(product.specifications)
            : product.specifications;
        }
      } catch (e) {
        console.warn(`Failed to parse specifications for ${product.product_code}`);
      }
      
      return {
        // Basic Info
        product_code: product.product_code,
        sku: product.sku || product.product_code,
        barcode: product.barcode,
        
        // Names and Descriptions
        name_en: product.name_en,
        name_ar: product.name_ar,
        description_en: product.description_en,
        description_ar: product.description_ar,
        
        // Category
        category: product.category,
        subcategory: product.subcategory,
        
        // Brand & Manufacturer
        brand: product.brand,
        manufacturer: product.manufacturer,
        country_of_origin: product.country_of_origin,
        
        // Pricing
        price: parseFloat(product.price_per_unit),
        price_per_unit: parseFloat(product.price_per_unit),
        discount_percentage: parseFloat(product.discount_percentage) || 0,
        tax_percentage: parseFloat(product.tax_percentage) || 14,
        
        // Stock
        stock_quantity: parseInt(product.stock_quantity) || 100,
        min_order_quantity: parseInt(product.min_order_quantity) || 1,
        max_order_quantity: parseInt(product.max_order_quantity) || 10,
        
        // Medical Info
        requires_prescription: product.requires_prescription === true || product.requires_prescription === 'TRUE' || product.requires_prescription === 'True',
        active_ingredient: product.active_ingredient,
        dosage_form: product.dosage_form,
        side_effects: product.side_effects,
        contraindications: product.contraindications,
        storage_conditions: product.storage_conditions,
        
        // Delivery
        delivery_method: product.delivery_method,
        delivery_days_min: parseInt(product.delivery_days_min) || 1,
        delivery_days_max: parseInt(product.delivery_days_max) || 3,
        delivery_fee: parseFloat(product.delivery_fee) || 30,
        
        // Images and Specs
        image_url: productImages[0] || 'https://via.placeholder.com/400x300',
        product_images: productImages,
        specifications: specifications,
        
        // Unit Info
        unit: product.unit || 'piece',
        unit_size: product.unit_size,
        unit_item: product.unit || 'piece',
        
        // SEO
        meta_title: product.meta_title,
        meta_description: product.meta_description,
        tags: product.tags ? product.tags.split(',') : [],
        
        // Status
        is_featured: product.is_featured === true || product.is_featured === 'TRUE',
        is_active: true,
        
        // Dates
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    console.log('🔄 Connecting to Supabase...');
    
    // Insert products using Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(transformedProducts)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to insert products: ${error}`);
    }
    
    const insertedProducts = await response.json();
    console.log(`✅ Successfully imported ${insertedProducts.length} products!`);
    
    // Also try to insert into the enhanced products table if it exists
    console.log('🔄 Attempting to insert into enhanced products table...');
    
    const enhancedProducts = transformedProducts.map(product => ({
      ...product,
      seller_id: 1, // Default seller ID
      seller_name: product.seller_name || 'El-Ezaby Pharmacy',
      seller_code: product.seller_code || 'PHARM-001',
      hsn_code: product.hsn_code,
      batch_number: product.batch_number,
      expiry_date: product.expiry_date,
      return_policy: product.return_policy || '7 days return for unopened items',
      free_delivery_threshold: product.free_delivery_threshold || 200,
      weight_grams: product.weight_grams || 50,
      dimensions_cm: product.dimensions_cm || '10x8x3',
      extra_information: {
        warranty: product.warranty_period || 'N/A',
        usage_instructions: product.usage_instructions || '',
        warnings: product.warnings || ''
      }
    }));
    
    // Try to insert into products_enhanced table
    const enhancedResponse = await fetch(`${SUPABASE_URL}/rest/v1/products_enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(enhancedProducts)
    });
    
    if (enhancedResponse.ok) {
      const insertedEnhanced = await enhancedResponse.json();
      console.log(`✅ Also imported ${insertedEnhanced.length} products to enhanced table!`);
    } else {
      console.log('ℹ️ Enhanced products table not available or insert failed - using basic products table only');
    }
    
    // Fetch and display imported products
    console.log('\n📊 Verifying imported products...');
    
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/products?limit=5`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    
    if (verifyResponse.ok) {
      const verifiedProducts = await verifyResponse.json();
      console.log(`\n✅ Successfully verified! Found ${verifiedProducts.length} products in database.`);
      console.log('\nSample products:');
      verifiedProducts.slice(0, 3).forEach(p => {
        console.log(`  - ${p.name_en} (${p.product_code}): EGP ${p.price}`);
      });
    }
    
    console.log('\n🎉 Import completed successfully!');
    console.log('📱 You can now view the products at: https://3000-ieihaxsgz413f0z2dod5s-6532622b.e2b.dev');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run the import
importProducts();