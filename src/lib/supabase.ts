import { createClient } from '@supabase/supabase-js';
import type { Context } from 'hono';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  JWT_SECRET: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;
  TWILIO_WHATSAPP_NUMBER: string;
  FAWRY_MERCHANT_CODE: string;
  FAWRY_SECRET_KEY: string;
  FAWRY_SANDBOX_URL: string;
  APP_URL: string;
  ADMIN_EMAIL: string;
  ENVIRONMENT: string;
}

export function getSupabaseClient(c: Context<{ Bindings: Env }>) {
  const supabaseUrl = c.env.SUPABASE_URL;
  const supabaseKey = c.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export function getSupabaseAdmin(c: Context<{ Bindings: Env }>) {
  const supabaseUrl = c.env.SUPABASE_URL;
  const supabaseServiceKey = c.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase admin configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}