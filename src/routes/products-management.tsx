/**
 * Product Management API Routes for Medicum Egypt
 * Handles CRUD operations for product management
 */

import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../lib/supabase';

const productManagementRoutes = new Hono<{ Bindings: Env }>();

/**
 * Get all products with advanced filtering and pagination
 */
productManagementRoutes.get('/api/admin/products/list', async c => {
  try {
    const { env } = c;
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Get query parameters
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const search = c.req.query('search') || '';
    const category = c.req.query('category');
    const status = c.req.query('status');
    const prescription = c.req.query('prescription');
    const sortBy = c.req.query('sortBy') || 'created_at';
    const sortOrder = c.req.query('sortOrder') || 'desc';
    const sellerCode = c.req.query('seller');

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase.from('products_enhanced').select(
      `
        *,
        seller:sellers(id, name, seller_code)
      `,
      { count: 'exact' }
    );

    // Apply filters
    if (search) {
      query = query.or(
        `name_en.ilike.%${search}%,name_ar.ilike.%${search}%,product_code.ilike.%${search}%,barcode.ilike.%${search}%,sku.ilike.%${search}%`
      );
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (prescription === 'required') {
      query = query.eq('requires_prescription', true);
    } else if (prescription === 'not-required') {
      query = query.eq('requires_prescription', false);
    }

    if (sellerCode) {
      // First get seller ID
      const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('seller_code', sellerCode)
        .single();

      if (seller) {
        query = query.eq('seller_id', seller.id);
      }
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return c.json({ error: 'Failed to fetch products' }, 500);
    }

    // Get categories for filters
    const { data: categories } = await supabase
      .from('products_enhanced')
      .select('category')
      .not('category', 'is', null);

    const uniqueCategories = [...new Set(categories?.map(c => c.category) || [])];

    // Get sellers for filters
    const { data: sellers } = await supabase.from('sellers').select('seller_code, name');

    return c.json({
      products: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      filters: {
        categories: uniqueCategories,
        sellers: sellers || [],
      },
    });
  } catch (error: any) {
    console.error('Product list error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Get single product details
 */
productManagementRoutes.get('/api/admin/products/:id', async c => {
  try {
    const { env } = c;
    const productId = c.req.param('id');
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const { data: product, error } = await supabase
      .from('products_enhanced')
      .select(
        `
        *,
        seller:sellers(*)
      `
      )
      .eq('id', productId)
      .single();

    if (error || !product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    return c.json(product);
  } catch (error: any) {
    console.error('Product fetch error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Create new product
 */
productManagementRoutes.post('/api/admin/products', async c => {
  try {
    const { env } = c;
    const productData = await c.req.json();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Validate required fields
    const requiredFields = ['product_code', 'name_en', 'name_ar', 'price_per_unit'];
    for (const field of requiredFields) {
      if (!productData[field]) {
        return c.json(
          {
            error: `Missing required field: ${field}`,
            field,
          },
          400
        );
      }
    }

    // Check if product code already exists
    const { data: existing } = await supabase
      .from('products_enhanced')
      .select('id')
      .eq('product_code', productData.product_code)
      .single();

    if (existing) {
      return c.json(
        {
          error: 'Product code already exists',
          field: 'product_code',
        },
        400
      );
    }

    // Handle seller_code -> seller_id conversion if needed
    if (productData.seller_code) {
      const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('seller_code', productData.seller_code)
        .single();

      if (seller) {
        productData.seller_id = seller.id;
      } else {
        // Create a default seller if not exists
        const { data: newSeller } = await supabase
          .from('sellers')
          .insert({
            seller_code: productData.seller_code,
            name: productData.seller_code,
            contact_info: {},
            is_active: true,
          })
          .select()
          .single();

        if (newSeller) {
          productData.seller_id = newSeller.id;
        }
      }
      delete productData.seller_code;
    }

    // Parse JSON fields if they're strings
    if (typeof productData.product_images === 'string') {
      try {
        productData.product_images = JSON.parse(productData.product_images);
      } catch (e) {
        productData.product_images = [];
      }
    }

    if (typeof productData.specifications === 'string') {
      try {
        productData.specifications = JSON.parse(productData.specifications);
      } catch (e) {
        productData.specifications = {};
      }
    }

    if (typeof productData.tags === 'string') {
      productData.tags = productData.tags.split(',').map((t: string) => t.trim());
    }

    // Set defaults for required database fields
    const productToInsert = {
      ...productData,
      currency: productData.currency || 'EGP',
      stock_quantity: productData.stock_quantity || 0,
      minimum_quantity: productData.minimum_quantity || 1,
      maximum_quantity: productData.maximum_quantity || 10,
      delivery_days_min: productData.delivery_days_min || 1,
      delivery_days_max: productData.delivery_days_max || 3,
      tax_percentage: productData.tax_percentage || 14,
      is_active: productData.is_active !== false, // Default to true
      is_featured: productData.is_featured || false,
      requires_prescription: productData.requires_prescription || false,
      is_controlled: productData.is_controlled || false,
      stock_alert_level: productData.stock_alert_level || 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert the product
    const { data: product, error } = await supabase
      .from('products_enhanced')
      .insert(productToInsert)
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return c.json(
        {
          error: 'Failed to create product',
          details: error.message,
        },
        400
      );
    }

    return c.json({
      success: true,
      product,
      message: 'Product created successfully',
    });
  } catch (error: any) {
    console.error('Product creation error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Update product
 */
productManagementRoutes.put('/api/admin/products/:id', async c => {
  try {
    const { env } = c;
    const productId = c.req.param('id');
    const updates = await c.req.json();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.created_at;
    delete updates.updated_at;
    delete updates.seller; // Remove joined data

    // Handle seller_code -> seller_id conversion if needed
    if (updates.seller_code) {
      const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('seller_code', updates.seller_code)
        .single();

      if (seller) {
        updates.seller_id = seller.id;
      }
      delete updates.seller_code;
    }

    // Parse JSON fields if they're strings
    if (typeof updates.product_images === 'string') {
      try {
        updates.product_images = JSON.parse(updates.product_images);
      } catch (e) {
        updates.product_images = [];
      }
    }

    if (typeof updates.specifications === 'string') {
      try {
        updates.specifications = JSON.parse(updates.specifications);
      } catch (e) {
        updates.specifications = {};
      }
    }

    if (typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map((t: string) => t.trim());
    }

    // Update the product
    const { data: product, error } = await supabase
      .from('products_enhanced')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return c.json({ error: 'Failed to update product', details: error.message }, 400);
    }

    return c.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error('Product update error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Delete product
 */
productManagementRoutes.delete('/api/admin/products/:id', async c => {
  try {
    const { env } = c;
    const productId = c.req.param('id');
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Check if product exists
    const { data: existing } = await supabase
      .from('products_enhanced')
      .select('id, product_code')
      .eq('id', productId)
      .single();

    if (!existing) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Delete the product
    const { error } = await supabase.from('products_enhanced').delete().eq('id', productId);

    if (error) {
      console.error('Delete error:', error);
      return c.json({ error: 'Failed to delete product', details: error.message }, 400);
    }

    return c.json({
      success: true,
      message: `Product ${existing.product_code} deleted successfully`,
    });
  } catch (error: any) {
    console.error('Product delete error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Bulk update products
 */
productManagementRoutes.post('/api/admin/products/bulk-update', async c => {
  try {
    const { env } = c;
    const { ids, updates } = await c.req.json();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ error: 'No product IDs provided' }, 400);
    }

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.created_at;
    delete updates.updated_at;

    // Update all products
    const { data, error } = await supabase
      .from('products_enhanced')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)
      .select();

    if (error) {
      console.error('Bulk update error:', error);
      return c.json({ error: 'Failed to update products', details: error.message }, 400);
    }

    return c.json({
      success: true,
      updated: data?.length || 0,
      products: data,
    });
  } catch (error: any) {
    console.error('Bulk update error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Bulk delete products
 */
productManagementRoutes.post('/api/admin/products/bulk-delete', async c => {
  try {
    const { env } = c;
    const { ids } = await c.req.json();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ error: 'No product IDs provided' }, 400);
    }

    // Delete all products
    const { error } = await supabase.from('products_enhanced').delete().in('id', ids);

    if (error) {
      console.error('Bulk delete error:', error);
      return c.json({ error: 'Failed to delete products', details: error.message }, 400);
    }

    return c.json({
      success: true,
      deleted: ids.length,
      message: `Successfully deleted ${ids.length} products`,
    });
  } catch (error: any) {
    console.error('Bulk delete error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Export products to CSV
 */
productManagementRoutes.get('/api/admin/products/export', async c => {
  try {
    const { env } = c;
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Get all products
    const { data: products, error } = await supabase
      .from('products_enhanced')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return c.json({ error: 'Failed to fetch products' }, 500);
    }

    // Convert to CSV
    const headers = Object.keys(products?.[0] || {});
    const csvHeaders = headers.join(',');

    const csvRows = products
      ?.map(product => {
        return headers
          .map(header => {
            const value = product[header];
            // Handle special cases
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
            return value;
          })
          .join(',');
      })
      .join('\n');

    const csv = `${csvHeaders}\n${csvRows}`;

    // Return CSV file
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="products_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Get product statistics
 */
productManagementRoutes.get('/api/admin/products/stats', async c => {
  try {
    const { env } = c;
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Get total products
    const { count: totalProducts } = await supabase
      .from('products_enhanced')
      .select('*', { count: 'exact', head: true });

    // Get active products
    const { count: activeProducts } = await supabase
      .from('products_enhanced')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get low stock products
    const { data: lowStockProducts } = await supabase
      .from('products_enhanced')
      .select('id, product_code, name_en, stock_quantity, stock_alert_level')
      .lte('stock_quantity', 10)
      .order('stock_quantity', { ascending: true })
      .limit(10);

    // Get products by category
    const { data: categoryStats } = await supabase.rpc('get_category_stats'); // This would be a custom RPC function

    // For now, let's calculate manually
    const { data: products } = await supabase.from('products_enhanced').select('category');

    const categoryCount: Record<string, number> = {};
    products?.forEach(p => {
      if (p.category) {
        categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
      }
    });

    return c.json({
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      inactiveProducts: (totalProducts || 0) - (activeProducts || 0),
      lowStockProducts: lowStockProducts || [],
      categoryStats: categoryCount,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default productManagementRoutes;
