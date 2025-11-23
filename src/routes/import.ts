import { Hono } from 'hono';
import { getSupabaseAdmin, type Env } from '../lib/supabase';
import { adminAuth } from '../middleware/auth';
import * as XLSX from 'xlsx';

export const importRoutes = new Hono<{ Bindings: Env }>();

// Apply admin auth to all import routes - only for /api/import/* paths
importRoutes.use('/api/import/*', adminAuth);

// Import products from Excel/CSV
importRoutes.post('/api/import/products', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    // Read file content
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    const supabase = getSupabaseAdmin(c);
    const products = [];
    
    // Process each row
    for (const row of data) {
      const product = {
        sku: row['SKU'] || row['sku'],
        name_en: row['Name EN'] || row['name_en'],
        name_ar: row['Name AR'] || row['name_ar'] || row['Name EN'],
        description_en: row['Description EN'] || row['description_en'] || '',
        description_ar: row['Description AR'] || row['description_ar'] || '',
        price: parseFloat(row['Price'] || row['price'] || '0'),
        category_id: row['Category ID'] || row['category_id'] || null,
        prescription_required: row['Prescription'] === 'Yes' || row['prescription_required'] === true,
        in_stock: row['In Stock'] !== 'No',
        quantity: parseInt(row['Quantity'] || row['quantity'] || '0'),
        provider_id: row['Provider ID'] || row['provider_id'] || null,
        pickup_location_id: row['Pickup Location ID'] || row['pickup_location_id'] || null,
      };
      
      products.push(product);
    }
    
    // Batch insert products
    const { data: insertedProducts, error } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'sku' })
      .select();
    
    if (error) throw error;
    
    return c.json({
      success: true,
      imported: insertedProducts?.length || 0,
      products: insertedProducts
    });
  } catch (error) {
    console.error('Import error:', error);
    return c.json({ error: 'Failed to import products' }, 500);
  }
});

// Get import template
importRoutes.get('/api/import/template', (c) => {
  const templateData = [
    {
      'SKU': 'MED001',
      'Name EN': 'Product Name English',
      'Name AR': 'اسم المنتج بالعربية',
      'Description EN': 'Product description in English',
      'Description AR': 'وصف المنتج بالعربية',
      'Price': 100,
      'Category ID': '',
      'Prescription': 'No',
      'In Stock': 'Yes',
      'Quantity': 50,
      'Provider ID': '',
      'Pickup Location ID': ''
    }
  ];
  
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  
  return c.body(buffer, 200, {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="products_template.xlsx"'
  });
});

// Manual product import
importRoutes.post('/api/import/product', async (c) => {
  try {
    const body = await c.req.json();
    const supabase = getSupabaseAdmin(c);
    
    const { data, error } = await supabase
      .from('products')
      .insert(body)
      .select()
      .single();
    
    if (error) throw error;
    
    return c.json({ success: true, product: data });
  } catch (error) {
    return c.json({ error: 'Failed to add product' }, 500);
  }
});