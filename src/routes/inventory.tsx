/**
 * Inventory Management Routes for Medicum Egypt
 * Handles stock tracking, alerts, and inventory reports
 */

import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../lib/supabase';

type AlertSeverity = 'critical' | 'warning' | 'info';

type InventoryAlert = {
  type: 'out_of_stock' | 'low_stock' | 'expiring_soon';
  severity: AlertSeverity;
  product_id: string;
  product_code: string;
  product_name: string;
  message: string;
  message_ar: string;
  created_at: string;
  stock_quantity?: number;
  alert_level?: number;
  expiry_date?: string;
  days_until_expiry?: number;
};

const inventoryRoutes = new Hono<{ Bindings: Env }>();

/**
 * Get inventory summary
 */
inventoryRoutes.get('/api/admin/inventory/summary', async (c) => {
  try {
    const { env } = c;
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    
    // Get total products
    const { count: totalProducts } = await supabase
      .from('products_enhanced')
      .select('*', { count: 'exact', head: true });
    
    // Get out of stock products
    const { data: outOfStock } = await supabase
      .from('products_enhanced')
      .select('id, product_code, name_en, name_ar, stock_quantity')
      .eq('stock_quantity', 0)
      .eq('is_active', true);
    
    // Get low stock products
    const { data: lowStock } = await supabase
      .from('products_enhanced')
      .select('id, product_code, name_en, name_ar, stock_quantity, stock_alert_level')
      .gt('stock_quantity', 0)
      .filter('stock_quantity', 'lte', 'stock_alert_level')
      .eq('is_active', true);
    
    // Get overstocked products (stock > 500)
    const { data: overStock } = await supabase
      .from('products_enhanced')
      .select('id, product_code, name_en, name_ar, stock_quantity')
      .gt('stock_quantity', 500)
      .eq('is_active', true);
    
    // Calculate total inventory value
    const { data: allProducts } = await supabase
      .from('products_enhanced')
      .select('stock_quantity, price_per_unit')
      .eq('is_active', true);
    
    const totalValue = allProducts?.reduce((sum, product) => {
      return sum + (product.stock_quantity * product.price_per_unit);
    }, 0) || 0;
    
    // Get expiring products (within 90 days)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90);
    
    const { data: expiringProducts } = await supabase
      .from('products_enhanced')
      .select('id, product_code, name_en, name_ar, expiry_date, stock_quantity')
      .lte('expiry_date', expiryDate.toISOString())
      .gte('expiry_date', new Date().toISOString())
      .eq('is_active', true)
      .order('expiry_date', { ascending: true });
    
    return c.json({
      totalProducts: totalProducts || 0,
      outOfStock: {
        count: outOfStock?.length || 0,
        products: outOfStock || []
      },
      lowStock: {
        count: lowStock?.length || 0,
        products: lowStock || []
      },
      overStock: {
        count: overStock?.length || 0,
        products: overStock || []
      },
      expiringProducts: {
        count: expiringProducts?.length || 0,
        products: expiringProducts || []
      },
      totalInventoryValue: totalValue,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Inventory summary error:', error);
    return c.json({ error: 'Failed to get inventory summary' }, 500);
  }
});

/**
 * Get stock alerts
 */
inventoryRoutes.get('/api/admin/inventory/alerts', async (c) => {
  try {
    const { env } = c;
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    
    const alerts: InventoryAlert[] = [];
    
    // Out of stock alerts
    const { data: outOfStock } = await supabase
      .from('products_enhanced')
      .select('id, product_code, name_en, name_ar')
      .eq('stock_quantity', 0)
      .eq('is_active', true);
    
    outOfStock?.forEach(product => {
      alerts.push({
        type: 'out_of_stock',
        severity: 'critical',
        product_id: product.id,
        product_code: product.product_code,
        product_name: product.name_en,
        message: `Product "${product.name_en}" is out of stock`,
        message_ar: `المنتج "${product.name_ar}" غير متوفر في المخزون`,
        created_at: new Date().toISOString()
      });
    });
    
    // Low stock alerts
    const { data: lowStock } = await supabase
      .from('products_enhanced')
      .select('id, product_code, name_en, name_ar, stock_quantity, stock_alert_level')
      .gt('stock_quantity', 0)
      .filter('stock_quantity', 'lte', 'stock_alert_level')
      .eq('is_active', true);
    
    lowStock?.forEach(product => {
      alerts.push({
        type: 'low_stock',
        severity: 'warning',
        product_id: product.id,
        product_code: product.product_code,
        product_name: product.name_en,
        message: `Product "${product.name_en}" has low stock (${product.stock_quantity} units)`,
        message_ar: `المنتج "${product.name_ar}" منخفض في المخزون (${product.stock_quantity} وحدة)`,
        stock_quantity: product.stock_quantity,
        alert_level: product.stock_alert_level,
        created_at: new Date().toISOString()
      });
    });
    
    // Expiring products alerts
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // Alert for products expiring in 30 days
    
    const { data: expiringProducts } = await supabase
      .from('products_enhanced')
      .select('id, product_code, name_en, name_ar, expiry_date, stock_quantity')
      .lte('expiry_date', expiryDate.toISOString())
      .gte('expiry_date', new Date().toISOString())
      .eq('is_active', true);
    
    expiringProducts?.forEach(product => {
      const daysUntilExpiry = Math.ceil((new Date(product.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      alerts.push({
        type: 'expiring_soon',
        severity: daysUntilExpiry <= 7 ? 'critical' : 'warning',
        product_id: product.id,
        product_code: product.product_code,
        product_name: product.name_en,
        message: `Product "${product.name_en}" expires in ${daysUntilExpiry} days`,
        message_ar: `المنتج "${product.name_ar}" ينتهي خلال ${daysUntilExpiry} يوم`,
        expiry_date: product.expiry_date,
        days_until_expiry: daysUntilExpiry,
        stock_quantity: product.stock_quantity,
        created_at: new Date().toISOString()
      });
    });
    
    // Sort alerts by severity
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    
    return c.json({
      alerts: alerts,
      count: alerts.length,
      criticalCount: alerts.filter(a => a.severity === 'critical').length,
      warningCount: alerts.filter(a => a.severity === 'warning').length
    });
    
  } catch (error: any) {
    console.error('Inventory alerts error:', error);
    return c.json({ error: 'Failed to get inventory alerts' }, 500);
  }
});

/**
 * Update stock quantity
 */
inventoryRoutes.put('/api/admin/inventory/stock/:productId', async (c) => {
  try {
    const { env } = c;
    const productId = c.req.param('productId');
    const { quantity, operation, reason } = await c.req.json();
    
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    
    // Get current stock
    const { data: product, error } = await supabase
      .from('products_enhanced')
      .select('stock_quantity, product_code, name_en')
      .eq('id', productId)
      .single();
    
    if (error || !product) {
      return c.json({ error: 'Product not found' }, 404);
    }
    
    let newQuantity = product.stock_quantity;
    
    switch (operation) {
      case 'set':
        newQuantity = quantity;
        break;
      case 'add':
        newQuantity += quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, newQuantity - quantity);
        break;
      default:
        return c.json({ error: 'Invalid operation' }, 400);
    }
    
    // Update stock
    const { error: updateError } = await supabase
      .from('products_enhanced')
      .update({ 
        stock_quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);
    
    if (updateError) {
      return c.json({ error: 'Failed to update stock' }, 500);
    }
    
    // Log stock movement
    await supabase
      .from('stock_movements')
      .insert({
        product_id: productId,
        product_code: product.product_code,
        previous_quantity: product.stock_quantity,
        new_quantity: newQuantity,
        change_quantity: newQuantity - product.stock_quantity,
        operation: operation,
        reason: reason,
        created_at: new Date().toISOString()
      });
    
    return c.json({
      success: true,
      product_id: productId,
      previous_quantity: product.stock_quantity,
      new_quantity: newQuantity,
      message: 'Stock updated successfully'
    });
    
  } catch (error: any) {
    console.error('Stock update error:', error);
    return c.json({ error: 'Failed to update stock' }, 500);
  }
});

/**
 * Bulk update stock
 */
inventoryRoutes.post('/api/admin/inventory/bulk-update', async (c) => {
  try {
    const { env } = c;
    const { updates } = await c.req.json();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    
    if (!Array.isArray(updates)) {
      return c.json({ error: 'Updates must be an array' }, 400);
    }
    
    const results = [];
    const errors = [];
    
    for (const update of updates) {
      const { product_id, product_code, stock_quantity } = update;
      
      // Find product by ID or code
      let query = supabase
        .from('products_enhanced')
        .update({ 
          stock_quantity: stock_quantity,
          updated_at: new Date().toISOString()
        });
      
      if (product_id) {
        query = query.eq('id', product_id);
      } else if (product_code) {
        query = query.eq('product_code', product_code);
      } else {
        errors.push({ 
          product: update, 
          error: 'Product ID or code required' 
        });
        continue;
      }
      
      const { data, error } = await query.select().single();
      
      if (error) {
        errors.push({ 
          product: update, 
          error: error.message 
        });
      } else {
        results.push(data);
      }
    }
    
    return c.json({
      success: errors.length === 0,
      updated: results.length,
      failed: errors.length,
      results: results,
      errors: errors
    });
    
  } catch (error: any) {
    console.error('Bulk stock update error:', error);
    return c.json({ error: 'Failed to update stock' }, 500);
  }
});

/**
 * Get stock movement history
 */
inventoryRoutes.get('/api/admin/inventory/movements', async (c) => {
  try {
    const { env } = c;
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    
    const productId = c.req.query('productId');
    const limit = parseInt(c.req.query('limit') || '50');
    
    let query = supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (productId) {
      query = query.eq('product_id', productId);
    }
    
    const { data: movements, error } = await query;
    
    if (error) {
      // If table doesn't exist, return empty array
      return c.json({ movements: [], message: 'Stock movements table not configured' });
    }
    
    return c.json({ movements: movements || [] });
    
  } catch (error: any) {
    console.error('Stock movements error:', error);
    return c.json({ error: 'Failed to get stock movements' }, 500);
  }
});

/**
 * Generate inventory report
 */
inventoryRoutes.get('/api/admin/inventory/report', async (c) => {
  try {
    const { env } = c;
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    
    const reportType = c.req.query('type') || 'full';
    
    let query = supabase
      .from('products_enhanced')
      .select('*');
    
    switch (reportType) {
      case 'low_stock':
        query = query.filter('stock_quantity', 'lte', 'stock_alert_level');
        break;
      case 'out_of_stock':
        query = query.eq('stock_quantity', 0);
        break;
      case 'expiring':
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 90);
        query = query.lte('expiry_date', expiryDate.toISOString());
        break;
    }
    
    const { data: products, error } = await query;
    
    if (error) {
      return c.json({ error: 'Failed to generate report' }, 500);
    }
    
    // Calculate report statistics
    const stats = {
      totalProducts: products?.length || 0,
      totalValue: products?.reduce((sum, p) => sum + (p.stock_quantity * p.price_per_unit), 0) || 0,
      totalUnits: products?.reduce((sum, p) => sum + p.stock_quantity, 0) || 0,
      outOfStock: products?.filter(p => p.stock_quantity === 0).length || 0,
      lowStock: products?.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.stock_alert_level || 10)).length || 0
    };
    
    return c.json({
      reportType: reportType,
      generatedAt: new Date().toISOString(),
      statistics: stats,
      products: products || []
    });
    
  } catch (error: any) {
    console.error('Inventory report error:', error);
    return c.json({ error: 'Failed to generate report' }, 500);
  }
});

export default inventoryRoutes;