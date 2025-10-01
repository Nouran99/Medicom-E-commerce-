/**
 * Import API Routes for Medicum Egypt
 * Handles Excel file upload and product import
 */

import { Hono } from 'hono';
import { ExcelImporter, ImportResult } from '../utils/excel-import';

const importRoutes = new Hono();

// Store import jobs in memory (in production, use a database or queue)
const importJobs = new Map<string, {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filename: string;
  startedAt: string;
  completedAt?: string;
  result?: ImportResult;
  progress?: number;
}>();

/**
 * Parse Excel file and validate data
 */
importRoutes.post('/api/admin/import/validate', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'] as File;
    
    if (!file) {
      return c.json({ error: 'No file uploaded' }, 400);
    }
    
    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type)) {
      return c.json({ 
        error: 'Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.' 
      }, 400);
    }
    
    // For Cloudflare Workers, we'll process the file as JSON
    // In a real implementation, you'd use a library like xlsx to parse Excel
    const fileContent = await file.text();
    let data: any[];
    
    try {
      // If it's CSV, parse it
      if (file.type === 'text/csv') {
        data = parseCSV(fileContent);
      } else {
        // For Excel files, we expect the client to convert to JSON first
        // This is a limitation of Cloudflare Workers
        return c.json({ 
          error: 'Excel file parsing requires client-side conversion to JSON. Please use the import tool in the admin interface.' 
        }, 400);
      }
    } catch (parseError: any) {
      return c.json({ 
        error: `Failed to parse file: ${parseError.message}` 
      }, 400);
    }
    
    // Initialize importer
    const env = c.env as any;
    const importer = new ExcelImporter(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    
    // Parse and validate products
    const products = await importer.parseExcelData(data);
    const errors = await importer.validateProducts(products);
    
    // Return validation results
    return c.json({
      success: errors.length === 0,
      totalRows: products.length,
      validRows: products.length - errors.length,
      errors: errors,
      preview: products.slice(0, 5) // Return first 5 products as preview
    });
    
  } catch (error: any) {
    console.error('Import validation error:', error);
    return c.json({ 
      error: 'Failed to validate import file',
      message: error.message 
    }, 500);
  }
});

/**
 * Process import job
 */
importRoutes.post('/api/admin/import/process', async (c) => {
  try {
    const body = await c.req.json();
    const { data, jobId } = body;
    
    if (!data || !Array.isArray(data)) {
      return c.json({ error: 'Invalid data format' }, 400);
    }
    
    // Create import job
    const job = {
      id: jobId || crypto.randomUUID(),
      status: 'processing' as const,
      filename: body.filename || 'import.xlsx',
      startedAt: new Date().toISOString(),
      progress: 0
    };
    
    importJobs.set(job.id, job);
    
    // Initialize importer
    const env = c.env as any;
    const importer = new ExcelImporter(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    
    // Parse and import products
    const products = await importer.parseExcelData(data);
    
    // Update progress
    job.progress = 50;
    importJobs.set(job.id, job);
    
    // Import to database
    const result = await importer.importProducts(products);
    
    // Update job with results
    job.status = result.success ? 'completed' : 'failed';
    job.completedAt = new Date().toISOString();
    job.result = result;
    job.progress = 100;
    importJobs.set(job.id, job);
    
    // Generate report
    const report = importer.generateReport(result);
    
    return c.json({
      success: result.success,
      jobId: job.id,
      result: result,
      report: report
    });
    
  } catch (error: any) {
    console.error('Import processing error:', error);
    return c.json({ 
      error: 'Failed to process import',
      message: error.message 
    }, 500);
  }
});

/**
 * Get import job status
 */
importRoutes.get('/api/admin/import/job/:jobId', async (c) => {
  const jobId = c.req.param('jobId');
  const job = importJobs.get(jobId);
  
  if (!job) {
    return c.json({ error: 'Job not found' }, 404);
  }
  
  return c.json(job);
});

/**
 * List all import jobs
 */
importRoutes.get('/api/admin/import/jobs', async (c) => {
  const jobs = Array.from(importJobs.values())
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 20); // Return last 20 jobs
  
  return c.json(jobs);
});

/**
 * Download import template
 */
importRoutes.get('/api/admin/import/template', async (c) => {
  const template = {
    headers: [
      'product_code', 'name_en', 'name_ar', 'description_en', 'description_ar',
      'category', 'subcategory', 'brand', 'manufacturer', 'country_of_origin',
      'price_per_unit', 'currency', 'unit', 'unit_size', 'stock_quantity',
      'min_order_quantity', 'max_order_quantity', 'sku', 'barcode', 'hsn_code',
      'requires_prescription', 'is_controlled', 'active_ingredient', 'dosage_form',
      'side_effects', 'contraindications', 'storage_conditions', 'expiry_date',
      'batch_number', 'seller_code', 'delivery_method', 'delivery_days_min',
      'delivery_days_max', 'delivery_fee', 'free_delivery_threshold',
      'return_policy', 'warranty_period', 'discount_percentage', 'tax_percentage',
      'product_images', 'specifications', 'tags', 'meta_title', 'meta_description',
      'is_featured', 'is_active', 'weight_grams', 'dimensions_cm'
    ],
    sampleRow: {
      product_code: 'MED-001-SAMPLE',
      name_en: 'Sample Product',
      name_ar: 'منتج عينة',
      description_en: 'This is a sample product description',
      description_ar: 'هذا وصف منتج عينة',
      category: 'pain-relief',
      subcategory: 'oral-medications',
      brand: 'SampleBrand',
      manufacturer: 'Sample Manufacturer',
      country_of_origin: 'Egypt',
      price_per_unit: 25.50,
      currency: 'EGP',
      unit: 'box',
      unit_size: '20 tablets',
      stock_quantity: 100,
      min_order_quantity: 1,
      max_order_quantity: 10,
      sku: 'SKU-001',
      barcode: '1234567890123',
      hsn_code: '30049099',
      requires_prescription: false,
      is_controlled: false,
      active_ingredient: 'Sample Active Ingredient 500mg',
      dosage_form: 'Tablet',
      side_effects: 'May cause drowsiness',
      contraindications: 'Do not use if allergic',
      storage_conditions: 'Store below 30°C',
      expiry_date: '2026-12-31',
      batch_number: 'BATCH-001',
      seller_code: 'SELLER-001',
      delivery_method: 'standard',
      delivery_days_min: 1,
      delivery_days_max: 3,
      delivery_fee: 30,
      free_delivery_threshold: 200,
      return_policy: '7 days return policy',
      warranty_period: 'N/A',
      discount_percentage: 10,
      tax_percentage: 14,
      product_images: '["https://example.com/image1.jpg", "https://example.com/image2.jpg"]',
      specifications: '{"form": "Round tablet", "color": "White"}',
      tags: 'sample,test,medication',
      meta_title: 'Sample Product | Buy Online',
      meta_description: 'Buy Sample Product online with fast delivery',
      is_featured: false,
      is_active: true,
      weight_grams: 50,
      dimensions_cm: '10x8x3'
    },
    validValues: {
      categories: [
        'pain-relief', 'antibiotics', 'vitamins', 'diabetes-care',
        'digestive-health', 'allergy-relief', 'respiratory',
        'mental-health', 'first-aid', 'personal-care'
      ],
      delivery_methods: ['standard', 'express', 'special'],
      currencies: ['EGP', 'USD'],
      dosage_forms: [
        'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream',
        'Ointment', 'Inhaler', 'Drops', 'Gel', 'Spray'
      ]
    }
  };
  
  return c.json(template);
});

/**
 * Helper function to parse CSV
 */
function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must have headers and at least one data row');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      let value = values[index];
      
      // Try to parse numbers
      if (value && !isNaN(Number(value))) {
        value = Number(value) as any;
      }
      // Parse booleans
      else if (value === 'true' || value === 'TRUE') {
        value = true as any;
      }
      else if (value === 'false' || value === 'FALSE') {
        value = false as any;
      }
      
      row[header] = value;
    });
    
    data.push(row);
  }
  
  return data;
}

export default importRoutes;