/**
 * Image Upload Routes for Medicum Egypt
 * Handles product image uploads using base64 storage or external URLs
 */

import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../lib/supabase';

const imageUploadRoutes = new Hono<{ Bindings: Env }>();

/**
 * Upload single image
 * Accepts base64 or stores external URL
 */
imageUploadRoutes.post('/api/admin/upload/image', async c => {
  try {
    const { env } = c;
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const body = await c.req.parseBody();
    const file = body['file'] as File;
    const url = body['url'] as string;
    const productId = body['productId'] as string;

    let imageUrl = '';

    if (file) {
      // Convert file to base64
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = file.type || 'image/jpeg';

      // Create data URL
      imageUrl = `data:${mimeType};base64,${base64}`;

      // Store in database (you might want to use a separate images table for large files)
      const { data: imageRecord, error } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_data: imageUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: mimeType,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        // If table doesn't exist, store URL directly in products table
        if (productId) {
          const { data: product } = await supabase
            .from('products_enhanced')
            .select('product_images')
            .eq('id', productId)
            .single();

          const currentImages = product?.product_images || [];
          currentImages.push(imageUrl);

          await supabase
            .from('products_enhanced')
            .update({
              product_images: currentImages,
              updated_at: new Date().toISOString(),
            })
            .eq('id', productId);
        }
      }
    } else if (url) {
      // Validate URL
      try {
        new URL(url);
        imageUrl = url;

        // Add to product images if productId provided
        if (productId) {
          const { data: product } = await supabase
            .from('products_enhanced')
            .select('product_images')
            .eq('id', productId)
            .single();

          const currentImages = product?.product_images || [];
          if (!currentImages.includes(url)) {
            currentImages.push(url);

            await supabase
              .from('products_enhanced')
              .update({
                product_images: currentImages,
                updated_at: new Date().toISOString(),
              })
              .eq('id', productId);
          }
        }
      } catch (e) {
        return c.json({ error: 'Invalid URL provided' }, 400);
      }
    } else {
      return c.json({ error: 'No file or URL provided' }, 400);
    }

    return c.json({
      success: true,
      url: imageUrl,
      message: 'Image uploaded successfully',
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

/**
 * Upload multiple images
 */
imageUploadRoutes.post('/api/admin/upload/images', async c => {
  try {
    const { env } = c;
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const body = await c.req.parseBody();
    const productId = body['productId'] as string;
    const urls: string[] = [];

    // Process multiple files
    const files = body['files'];
    if (files && Array.isArray(files)) {
      for (const file of files) {
        if (file instanceof File) {
          const buffer = await file.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const mimeType = file.type || 'image/jpeg';
          const dataUrl = `data:${mimeType};base64,${base64}`;
          urls.push(dataUrl);
        }
      }
    }

    // Process URL list
    const urlList = body['urls'];
    if (urlList) {
      const urlArray = JSON.parse(urlList as string);
      urls.push(...urlArray);
    }

    // Update product if ID provided
    if (productId && urls.length > 0) {
      const { data: product } = await supabase
        .from('products_enhanced')
        .select('product_images')
        .eq('id', productId)
        .single();

      const currentImages = product?.product_images || [];
      const newImages = [...new Set([...currentImages, ...urls])]; // Remove duplicates

      await supabase
        .from('products_enhanced')
        .update({
          product_images: newImages,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);
    }

    return c.json({
      success: true,
      urls: urls,
      count: urls.length,
      message: `${urls.length} images uploaded successfully`,
    });
  } catch (error: any) {
    console.error('Multiple image upload error:', error);
    return c.json({ error: 'Failed to upload images' }, 500);
  }
});

/**
 * Delete image from product
 */
imageUploadRoutes.delete('/api/admin/upload/image', async c => {
  try {
    const { env } = c;
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const { productId, imageUrl } = await c.req.json();

    if (!productId || !imageUrl) {
      return c.json({ error: 'Product ID and image URL required' }, 400);
    }

    // Get current product images
    const { data: product } = await supabase
      .from('products_enhanced')
      .select('product_images')
      .eq('id', productId)
      .single();

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Remove the image from array
    const currentImages = product.product_images || [];
    const newImages = currentImages.filter((img: string) => img !== imageUrl);

    // Update product
    await supabase
      .from('products_enhanced')
      .update({
        product_images: newImages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    return c.json({
      success: true,
      message: 'Image removed successfully',
    });
  } catch (error: any) {
    console.error('Image deletion error:', error);
    return c.json({ error: 'Failed to delete image' }, 500);
  }
});

/**
 * Reorder product images
 */
imageUploadRoutes.put('/api/admin/upload/reorder', async c => {
  try {
    const { env } = c;
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    const { productId, imageUrls } = await c.req.json();

    if (!productId || !imageUrls || !Array.isArray(imageUrls)) {
      return c.json({ error: 'Product ID and image URLs array required' }, 400);
    }

    // Update product with new image order
    await supabase
      .from('products_enhanced')
      .update({
        product_images: imageUrls,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    return c.json({
      success: true,
      message: 'Images reordered successfully',
    });
  } catch (error: any) {
    console.error('Image reorder error:', error);
    return c.json({ error: 'Failed to reorder images' }, 500);
  }
});

export default imageUploadRoutes;
