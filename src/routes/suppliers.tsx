/**
 * Supplier Management Routes for Medicum Egypt
 * Handles supplier CRUD operations and relationship management
 */

import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../lib/supabase';

const supplierRoutes = new Hono<{ Bindings: Env }>();

/**
 * Get all suppliers with pagination and filtering
 */
supplierRoutes.get('/api/admin/suppliers', async c => {
  try {
    const { env } = c;
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const search = c.req.query('search') || '';
    const status = c.req.query('status');

    const offset = (page - 1) * limit;

    let query = supabase.from('sellers').select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,seller_code.ilike.%${search}%,contact_info->email.ilike.%${search}%`
      );
    }

    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: suppliers, error, count } = await query;

    if (error) {
      console.error('Error fetching suppliers:', error);
      return c.json({ error: 'Failed to fetch suppliers' }, 500);
    }

    // Get product counts for each supplier
    const supplierIds = suppliers?.map(s => s.id) || [];
    const { data: productCounts } = await supabase
      .from('products_enhanced')
      .select('seller_id')
      .in('seller_id', supplierIds);

    const productCountMap =
      productCounts?.reduce(
        (acc, p) => {
          acc[p.seller_id] = (acc[p.seller_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    // Add product count to suppliers
    const suppliersWithCounts = suppliers?.map(supplier => ({
      ...supplier,
      product_count: productCountMap[supplier.id] || 0,
    }));

    return c.json({
      suppliers: suppliersWithCounts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Supplier list error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Get single supplier details with products
 */
supplierRoutes.get('/api/admin/suppliers/:id', async c => {
  try {
    const { env } = c;
    const supplierId = c.req.param('id');
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Get supplier details
    const { data: supplier, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', supplierId)
      .single();

    if (error || !supplier) {
      return c.json({ error: 'Supplier not found' }, 404);
    }

    // Get supplier's products
    const { data: products } = await supabase
      .from('products_enhanced')
      .select('id, product_code, name_en, name_ar, price_per_unit, stock_quantity, is_active')
      .eq('seller_id', supplierId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Calculate statistics
    const stats = {
      totalProducts: products?.length || 0,
      activeProducts: products?.filter(p => p.is_active).length || 0,
      totalInventoryValue:
        products?.reduce((sum, p) => sum + p.stock_quantity * p.price_per_unit, 0) || 0,
      outOfStockProducts: products?.filter(p => p.stock_quantity === 0).length || 0,
    };

    return c.json({
      supplier: supplier,
      products: products || [],
      statistics: stats,
    });
  } catch (error: any) {
    console.error('Supplier fetch error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Create new supplier
 */
supplierRoutes.post('/api/admin/suppliers', async c => {
  try {
    const { env } = c;
    const supplierData = await c.req.json();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Validate required fields
    if (!supplierData.name || !supplierData.seller_code) {
      return c.json(
        {
          error: 'Name and seller code are required',
        },
        400
      );
    }

    // Check if seller code already exists
    const { data: existing } = await supabase
      .from('sellers')
      .select('id')
      .eq('seller_code', supplierData.seller_code)
      .single();

    if (existing) {
      return c.json(
        {
          error: 'Seller code already exists',
        },
        400
      );
    }

    // Prepare supplier data
    const newSupplier = {
      name: supplierData.name,
      seller_code: supplierData.seller_code,
      contact_info: {
        email: supplierData.email || null,
        phone: supplierData.phone || null,
        address: supplierData.address || null,
        city: supplierData.city || null,
        country: supplierData.country || 'Egypt',
        website: supplierData.website || null,
        contact_person: supplierData.contact_person || null,
      },
      is_active: supplierData.is_active !== false,
      payment_terms: supplierData.payment_terms || null,
      delivery_terms: supplierData.delivery_terms || null,
      tax_id: supplierData.tax_id || null,
      bank_details: supplierData.bank_details || null,
      notes: supplierData.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert supplier
    const { data: supplier, error } = await supabase
      .from('sellers')
      .insert(newSupplier)
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return c.json(
        {
          error: 'Failed to create supplier',
          details: error.message,
        },
        400
      );
    }

    return c.json({
      success: true,
      supplier: supplier,
      message: 'Supplier created successfully',
    });
  } catch (error: any) {
    console.error('Supplier creation error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Update supplier
 */
supplierRoutes.put('/api/admin/suppliers/:id', async c => {
  try {
    const { env } = c;
    const supplierId = c.req.param('id');
    const updates = await c.req.json();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.created_at;

    // Check if supplier exists
    const { data: existing } = await supabase
      .from('sellers')
      .select('id')
      .eq('id', supplierId)
      .single();

    if (!existing) {
      return c.json({ error: 'Supplier not found' }, 404);
    }

    // If updating seller_code, check for duplicates
    if (updates.seller_code) {
      const { data: duplicate } = await supabase
        .from('sellers')
        .select('id')
        .eq('seller_code', updates.seller_code)
        .neq('id', supplierId)
        .single();

      if (duplicate) {
        return c.json(
          {
            error: 'Seller code already exists',
          },
          400
        );
      }
    }

    // Build contact info update
    if (
      updates.email ||
      updates.phone ||
      updates.address ||
      updates.city ||
      updates.country ||
      updates.website ||
      updates.contact_person
    ) {
      updates.contact_info = {
        email: updates.email,
        phone: updates.phone,
        address: updates.address,
        city: updates.city,
        country: updates.country || 'Egypt',
        website: updates.website,
        contact_person: updates.contact_person,
      };

      // Remove individual fields
      delete updates.email;
      delete updates.phone;
      delete updates.address;
      delete updates.city;
      delete updates.country;
      delete updates.website;
      delete updates.contact_person;
    }

    // Update supplier
    const { data: supplier, error } = await supabase
      .from('sellers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', supplierId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return c.json(
        {
          error: 'Failed to update supplier',
          details: error.message,
        },
        400
      );
    }

    return c.json({
      success: true,
      supplier: supplier,
      message: 'Supplier updated successfully',
    });
  } catch (error: any) {
    console.error('Supplier update error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Delete supplier
 */
supplierRoutes.delete('/api/admin/suppliers/:id', async c => {
  try {
    const { env } = c;
    const supplierId = c.req.param('id');
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Check if supplier has products
    const { count: productCount } = await supabase
      .from('products_enhanced')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', supplierId);

    if (productCount && productCount > 0) {
      return c.json(
        {
          error: `Cannot delete supplier with ${productCount} associated products. Please reassign or delete products first.`,
        },
        400
      );
    }

    // Delete supplier
    const { error } = await supabase.from('sellers').delete().eq('id', supplierId);

    if (error) {
      console.error('Delete error:', error);
      return c.json(
        {
          error: 'Failed to delete supplier',
          details: error.message,
        },
        400
      );
    }

    return c.json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (error: any) {
    console.error('Supplier delete error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Get supplier statistics
 */
supplierRoutes.get('/api/admin/suppliers/stats/overview', async c => {
  try {
    const { env } = c;
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Get total suppliers
    const { count: totalSuppliers } = await supabase
      .from('sellers')
      .select('*', { count: 'exact', head: true });

    // Get active suppliers
    const { count: activeSuppliers } = await supabase
      .from('sellers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get top suppliers by product count
    const { data: suppliers } = await supabase
      .from('sellers')
      .select('id, name, seller_code')
      .eq('is_active', true);

    const supplierIds = suppliers?.map(s => s.id) || [];

    // Get products for each supplier
    const { data: products } = await supabase
      .from('products_enhanced')
      .select('seller_id, stock_quantity, price_per_unit')
      .in('seller_id', supplierIds);

    // Calculate supplier stats
    const supplierStats = suppliers
      ?.map(supplier => {
        const supplierProducts = products?.filter(p => p.seller_id === supplier.id) || [];
        return {
          ...supplier,
          product_count: supplierProducts.length,
          total_inventory_value: supplierProducts.reduce(
            (sum, p) => sum + p.stock_quantity * p.price_per_unit,
            0
          ),
          total_units: supplierProducts.reduce((sum, p) => sum + p.stock_quantity, 0),
        };
      })
      .sort((a, b) => b.product_count - a.product_count)
      .slice(0, 10);

    return c.json({
      totalSuppliers: totalSuppliers || 0,
      activeSuppliers: activeSuppliers || 0,
      inactiveSuppliers: (totalSuppliers || 0) - (activeSuppliers || 0),
      topSuppliers: supplierStats || [],
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Supplier stats error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Bulk activate/deactivate suppliers
 */
supplierRoutes.post('/api/admin/suppliers/bulk-status', async c => {
  try {
    const { env } = c;
    const { ids, status } = await c.req.json();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    if (!Array.isArray(ids) || ids.length === 0) {
      return c.json({ error: 'No supplier IDs provided' }, 400);
    }

    const { data, error } = await supabase
      .from('sellers')
      .update({
        is_active: status === 'active',
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)
      .select();

    if (error) {
      return c.json(
        {
          error: 'Failed to update suppliers',
          details: error.message,
        },
        400
      );
    }

    return c.json({
      success: true,
      updated: data?.length || 0,
      message: `${data?.length || 0} suppliers ${status === 'active' ? 'activated' : 'deactivated'}`,
    });
  } catch (error: any) {
    console.error('Bulk status update error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default supplierRoutes;
