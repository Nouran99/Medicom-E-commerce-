import { serve } from '@hono/node-server';
import app from './index.js';
import type { Env } from './lib/supabase.js';

const port = Number.parseInt(process.env.PORT || '3000', 10);

const bindings: Env = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || '',
  FAWRY_MERCHANT_CODE: process.env.FAWRY_MERCHANT_CODE || '',
  FAWRY_SECRET_KEY: process.env.FAWRY_SECRET_KEY || '',
  FAWRY_SANDBOX_URL: process.env.FAWRY_SANDBOX_URL || '',
  APP_URL: process.env.APP_URL || `http://localhost:${port}`,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  DEMO_MODE: process.env.DEMO_MODE || 'false',
};

serve({
  fetch: (request) => app.fetch(request, bindings),
  port,
  hostname: '0.0.0.0',
});

console.info(`Medicom is running on http://0.0.0.0:${port}`);
