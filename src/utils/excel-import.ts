/**
 * Excel Import Utility for Medicum Egypt
 * Processes Excel files and validates product data before database import
 */

import { createClient } from '@supabase/supabase-js';

export interface ProductImportData {
  product_code: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  manufacturer?: string;
  country_of_origin?: string;
  price_per_unit: number;
  currency: string;
  unit: string;
  unit_size?: string;
  stock_quantity: number;
  min_order_quantity?: number;
  max_order_quantity?: number;
  sku?: string;
  barcode?: string;
  hsn_code?: string;
  requires_prescription: boolean;
  is_controlled: boolean;
  active_ingredient?: string;
  dosage_form?: string;
  side_effects?: string;
  contraindications?: string;
  storage_conditions?: string;
  expiry_date?: string;
  batch_number?: string;
  seller_code: string;
  delivery_method: string;
  delivery_days_min: number;
  delivery_days_max: number;
  delivery_fee?: number;
  free_delivery_threshold?: number;
  return_policy?: string;
  warranty_period?: string;
  discount_percentage?: number;
  tax_percentage?: number;
  product_images?: string;
  specifications?: string;
  tags?: string;
  meta_title?: string;
  meta_description?: string;
  is_featured: boolean;
  is_active: boolean;
  weight_grams?: number;
  dimensions_cm?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ValidationError[];
  importedProducts?: ProductImportData[];
}

export class ExcelImporter {
  private supabase: any;
  private validCategories = [
    'pain-relief', 'antibiotics', 'vitamins', 'diabetes-care', 
    'digestive-health', 'allergy-relief', 'respiratory', 
    'mental-health', 'first-aid', 'personal-care'
  ];
  
  private validDeliveryMethods = ['standard', 'express', 'special'];
  private validCurrencies = ['EGP', 'USD'];

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Parse Excel data from JSON array
   */
  async parseExcelData(data: any[]): Promise<ProductImportData[]> {
    const products: ProductImportData[] = [];
    
    for (const row of data) {
      const product: ProductImportData = {
        product_code: row.product_code || '',
        name_en: row.name_en || '',
        name_ar: row.name_ar || '',
        description_en: row.description_en || null,
        description_ar: row.description_ar || null,
        category: row.category || '',
        subcategory: row.subcategory || null,
        brand: row.brand || null,
        manufacturer: row.manufacturer || null,
        country_of_origin: row.country_of_origin || 'Egypt',
        price_per_unit: parseFloat(row.price_per_unit) || 0,
        currency: row.currency || 'EGP',
        unit: row.unit || 'box',
        unit_size: row.unit_size || null,
        stock_quantity: parseInt(row.stock_quantity) || 0,
        min_order_quantity: parseInt(row.min_order_quantity) || 1,
        max_order_quantity: parseInt(row.max_order_quantity) || 10,
        sku: row.sku || null,
        barcode: row.barcode || null,
        hsn_code: row.hsn_code || null,
        requires_prescription: this.parseBoolean(row.requires_prescription),
        is_controlled: this.parseBoolean(row.is_controlled),
        active_ingredient: row.active_ingredient || null,
        dosage_form: row.dosage_form || null,
        side_effects: row.side_effects || null,
        contraindications: row.contraindications || null,
        storage_conditions: row.storage_conditions || null,
        expiry_date: this.parseDate(row.expiry_date),
        batch_number: row.batch_number || null,
        seller_code: row.seller_code || '',
        delivery_method: row.delivery_method || 'standard',
        delivery_days_min: parseInt(row.delivery_days_min) || 1,
        delivery_days_max: parseInt(row.delivery_days_max) || 3,
        delivery_fee: parseFloat(row.delivery_fee) || 0,
        free_delivery_threshold: parseFloat(row.free_delivery_threshold) || 0,
        return_policy: row.return_policy || null,
        warranty_period: row.warranty_period || null,
        discount_percentage: parseFloat(row.discount_percentage) || 0,
        tax_percentage: parseFloat(row.tax_percentage) || 14,
        product_images: row.product_images || '[]',
        specifications: row.specifications || '{}',
        tags: row.tags || null,
        meta_title: row.meta_title || null,
        meta_description: row.meta_description || null,
        is_featured: this.parseBoolean(row.is_featured),
        is_active: this.parseBoolean(row.is_active),
        weight_grams: parseInt(row.weight_grams) || null,
        dimensions_cm: row.dimensions_cm || null
      };
      
      products.push(product);
    }
    
    return products;
  }

  /**
   * Validate all products before import
   */
  async validateProducts(products: ProductImportData[]): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const productCodes = new Set<string>();
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const rowNum = i + 2; // Excel row number (accounting for header)
      
      // Required field validation
      if (!product.product_code) {
        errors.push({
          row: rowNum,
          field: 'product_code',
          value: product.product_code,
          message: 'Product code is required'
        });
      }
      
      // Check for duplicate product codes
      if (product.product_code && productCodes.has(product.product_code)) {
        errors.push({
          row: rowNum,
          field: 'product_code',
          value: product.product_code,
          message: 'Duplicate product code found'
        });
      }
      productCodes.add(product.product_code);
      
      // Required fields
      if (!product.name_en) {
        errors.push({
          row: rowNum,
          field: 'name_en',
          value: product.name_en,
          message: 'English name is required'
        });
      }
      
      if (!product.name_ar) {
        errors.push({
          row: rowNum,
          field: 'name_ar',
          value: product.name_ar,
          message: 'Arabic name is required'
        });
      }
      
      if (!product.price_per_unit || product.price_per_unit <= 0) {
        errors.push({
          row: rowNum,
          field: 'price_per_unit',
          value: product.price_per_unit,
          message: 'Price must be greater than 0'
        });
      }
      
      if (!product.seller_code) {
        errors.push({
          row: rowNum,
          field: 'seller_code',
          value: product.seller_code,
          message: 'Seller code is required'
        });
      }
      
      // Category validation
      if (product.category && !this.validCategories.includes(product.category)) {
        errors.push({
          row: rowNum,
          field: 'category',
          value: product.category,
          message: `Invalid category. Must be one of: ${this.validCategories.join(', ')}`
        });
      }
      
      // Delivery method validation
      if (product.delivery_method && !this.validDeliveryMethods.includes(product.delivery_method)) {
        errors.push({
          row: rowNum,
          field: 'delivery_method',
          value: product.delivery_method,
          message: `Invalid delivery method. Must be one of: ${this.validDeliveryMethods.join(', ')}`
        });
      }
      
      // Currency validation
      if (product.currency && !this.validCurrencies.includes(product.currency)) {
        errors.push({
          row: rowNum,
          field: 'currency',
          value: product.currency,
          message: `Invalid currency. Must be one of: ${this.validCurrencies.join(', ')}`
        });
      }
      
      // Stock validation
      if (product.stock_quantity < 0) {
        errors.push({
          row: rowNum,
          field: 'stock_quantity',
          value: product.stock_quantity,
          message: 'Stock quantity cannot be negative'
        });
      }
      
      // Order quantity validation
      if (product.min_order_quantity && product.max_order_quantity && 
          product.min_order_quantity > product.max_order_quantity) {
        errors.push({
          row: rowNum,
          field: 'min_order_quantity',
          value: product.min_order_quantity,
          message: 'Minimum order quantity cannot be greater than maximum'
        });
      }
      
      // Delivery days validation
      if (product.delivery_days_min > product.delivery_days_max) {
        errors.push({
          row: rowNum,
          field: 'delivery_days_min',
          value: product.delivery_days_min,
          message: 'Minimum delivery days cannot be greater than maximum'
        });
      }
      
      // Percentage validation
      if (product.discount_percentage && (product.discount_percentage < 0 || product.discount_percentage > 100)) {
        errors.push({
          row: rowNum,
          field: 'discount_percentage',
          value: product.discount_percentage,
          message: 'Discount percentage must be between 0 and 100'
        });
      }
      
      if (product.tax_percentage && (product.tax_percentage < 0 || product.tax_percentage > 100)) {
        errors.push({
          row: rowNum,
          field: 'tax_percentage',
          value: product.tax_percentage,
          message: 'Tax percentage must be between 0 and 100'
        });
      }
      
      // JSON validation
      try {
        if (product.product_images) {
          JSON.parse(product.product_images);
        }
      } catch (e) {
        errors.push({
          row: rowNum,
          field: 'product_images',
          value: product.product_images,
          message: 'Invalid JSON format for product images'
        });
      }
      
      try {
        if (product.specifications) {
          JSON.parse(product.specifications);
        }
      } catch (e) {
        errors.push({
          row: rowNum,
          field: 'specifications',
          value: product.specifications,
          message: 'Invalid JSON format for specifications'
        });
      }
      
      // Date validation
      if (product.expiry_date && !this.isValidDate(product.expiry_date)) {
        errors.push({
          row: rowNum,
          field: 'expiry_date',
          value: product.expiry_date,
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }
    }
    
    // Check seller codes exist
    const uniqueSellerCodes = [...new Set(products.map(p => p.seller_code).filter(Boolean))];
    if (uniqueSellerCodes.length > 0) {
      const { data: sellers, error } = await this.supabase
        .from('sellers')
        .select('seller_code')
        .in('seller_code', uniqueSellerCodes);
      
      if (error) {
        console.error('Error checking sellers:', error);
      } else {
        const existingSellerCodes = new Set(sellers?.map((s: any) => s.seller_code) || []);
        
        products.forEach((product, index) => {
          if (product.seller_code && !existingSellerCodes.has(product.seller_code)) {
            errors.push({
              row: index + 2,
              field: 'seller_code',
              value: product.seller_code,
              message: `Seller code '${product.seller_code}' does not exist in the system`
            });
          }
        });
      }
    }
    
    // Check for existing product codes in database
    const productCodesList = products.map(p => p.product_code).filter(Boolean);
    if (productCodesList.length > 0) {
      const { data: existingProducts, error } = await this.supabase
        .from('products_enhanced')
        .select('product_code')
        .in('product_code', productCodesList);
      
      if (!error && existingProducts && existingProducts.length > 0) {
        const existingCodes = new Set(existingProducts.map((p: any) => p.product_code));
        
        products.forEach((product, index) => {
          if (product.product_code && existingCodes.has(product.product_code)) {
            errors.push({
              row: index + 2,
              field: 'product_code',
              value: product.product_code,
              message: `Product code '${product.product_code}' already exists in the database`
            });
          }
        });
      }
    }
    
    return errors;
  }

  /**
   * Import validated products to database
   */
  async importProducts(products: ProductImportData[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalRows: products.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
      importedProducts: []
    };
    
    // Validate first
    const validationErrors = await this.validateProducts(products);
    
    if (validationErrors.length > 0) {
      result.errors = validationErrors;
      result.errorCount = validationErrors.length;
      return result;
    }
    
    // Process imports in batches
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < products.length; i += batchSize) {
      batches.push(products.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      try {
        // Get seller IDs
        const sellerCodes = [...new Set(batch.map(p => p.seller_code))];
        const { data: sellers } = await this.supabase
          .from('sellers')
          .select('id, seller_code')
          .in('seller_code', sellerCodes);
        
        const sellerMap = new Map(sellers?.map((s: any) => [s.seller_code, s.id]) || []);
        
        // Prepare data for insertion
        const insertData = batch.map(product => ({
          product_code: product.product_code,
          name_en: product.name_en,
          name_ar: product.name_ar,
          description_en: product.description_en,
          description_ar: product.description_ar,
          category: product.category,
          subcategory: product.subcategory,
          brand: product.brand,
          manufacturer: product.manufacturer,
          country_of_origin: product.country_of_origin,
          price_per_unit: product.price_per_unit,
          currency: product.currency,
          unit_item: product.unit,
          unit_size: product.unit_size,
          stock_quantity: product.stock_quantity,
          minimum_quantity: product.min_order_quantity,
          maximum_quantity: product.max_order_quantity,
          sku: product.sku,
          barcode: product.barcode,
          hsn_code: product.hsn_code,
          requires_prescription: product.requires_prescription,
          is_controlled: product.is_controlled,
          active_ingredient: product.active_ingredient,
          dosage_form: product.dosage_form,
          side_effects: product.side_effects,
          contraindications: product.contraindications,
          storage_conditions: product.storage_conditions,
          expiry_date: product.expiry_date,
          batch_number: product.batch_number,
          seller_id: sellerMap.get(product.seller_code),
          delivery_method: product.delivery_method,
          delivery_days_min: product.delivery_days_min,
          delivery_days_max: product.delivery_days_max,
          delivery_fee: product.delivery_fee,
          free_delivery_threshold: product.free_delivery_threshold,
          return_policy: product.return_policy,
          warranty_period: product.warranty_period,
          discount_percentage: product.discount_percentage,
          tax_percentage: product.tax_percentage,
          product_images: product.product_images ? JSON.parse(product.product_images) : [],
          specifications: product.specifications ? JSON.parse(product.specifications) : {},
          tags: product.tags?.split(',').map(t => t.trim()) || [],
          meta_title: product.meta_title,
          meta_description: product.meta_description,
          is_featured: product.is_featured,
          is_active: product.is_active,
          weight_grams: product.weight_grams,
          dimensions_cm: product.dimensions_cm,
          stock_alert_level: 10, // Default value
          import_date: new Date().toISOString()
        }));
        
        // Insert batch into database
        const { data, error } = await this.supabase
          .from('products_enhanced')
          .insert(insertData)
          .select();
        
        if (error) {
          console.error('Import error:', error);
          result.errors.push({
            row: 0,
            field: 'database',
            value: '',
            message: `Database error: ${error.message}`
          });
          result.errorCount++;
        } else {
          result.successCount += data.length;
          result.importedProducts?.push(...batch);
        }
        
      } catch (error: any) {
        console.error('Batch import error:', error);
        result.errors.push({
          row: 0,
          field: 'system',
          value: '',
          message: `System error: ${error.message}`
        });
        result.errorCount++;
      }
    }
    
    result.success = result.successCount > 0;
    return result;
  }

  /**
   * Helper function to parse boolean values
   */
  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
    }
    return false;
  }

  /**
   * Helper function to parse dates
   */
  private parseDate(value: any): string | null {
    if (!value) return null;
    
    // If it's already a valid date string, return it
    if (typeof value === 'string' && this.isValidDate(value)) {
      return value;
    }
    
    // Try to parse Excel serial date
    if (typeof value === 'number') {
      const date = new Date((value - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    return null;
  }

  /**
   * Validate date format
   */
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Generate import report
   */
  generateReport(result: ImportResult): string {
    let report = `Import Report\n`;
    report += `=============\n\n`;
    report += `Total Rows Processed: ${result.totalRows}\n`;
    report += `Successfully Imported: ${result.successCount}\n`;
    report += `Errors: ${result.errorCount}\n\n`;
    
    if (result.errors.length > 0) {
      report += `Validation Errors:\n`;
      report += `-----------------\n`;
      
      result.errors.forEach(error => {
        report += `Row ${error.row}: ${error.field} - ${error.message}\n`;
      });
    }
    
    if (result.importedProducts && result.importedProducts.length > 0) {
      report += `\nImported Products:\n`;
      report += `-----------------\n`;
      
      result.importedProducts.forEach(product => {
        report += `✓ ${product.product_code}: ${product.name_en}\n`;
      });
    }
    
    return report;
  }
}