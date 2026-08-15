import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { productsRoutes } from '../src/routes/products';
import type { Env } from '../src/lib/supabase';

const demoBindings: Env = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  SUPABASE_SERVICE_KEY: '',
  JWT_SECRET: '',
  TWILIO_ACCOUNT_SID: '',
  TWILIO_AUTH_TOKEN: '',
  TWILIO_PHONE_NUMBER: '',
  TWILIO_WHATSAPP_NUMBER: '',
  FAWRY_MERCHANT_CODE: '',
  FAWRY_SECRET_KEY: '',
  FAWRY_SANDBOX_URL: '',
  APP_URL: 'http://localhost:3000',
  ADMIN_EMAIL: '',
  ENVIRONMENT: 'test',
  DEMO_MODE: 'true',
};

const app = new Hono<{ Bindings: Env }>();
app.route('/api/products', productsRoutes);

describe('portfolio demo catalog', () => {
  it('returns a curated catalog without requiring Supabase credentials', async () => {
    const response = await app.request('/api/products?limit=3', {}, demoBindings);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.mode).toBe('demo');
    expect(payload.products).toHaveLength(3);
    expect(payload.total).toBeGreaterThanOrEqual(6);
  });

  it('returns categories before attempting the dynamic product route', async () => {
    const response = await app.request('/api/products/categories', {}, demoBindings);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toHaveLength(6);
    expect(payload[0]).toMatchObject({ name_en: 'Pain Relief', name_ar: 'تسكين الألم' });
  });

  it('filters demo products by a multilingual search term', async () => {
    const response = await app.request('/api/products/search?q=vitamin&lang=en', {}, demoBindings);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.products).toHaveLength(1);
    expect(payload.products[0].sku).toBe('MED-VITD-1000');
  });
});
