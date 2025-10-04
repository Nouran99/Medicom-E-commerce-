import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'Supabase service key is required'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  TWILIO_ACCOUNT_SID: z.string().min(1, 'Twilio Account SID is required'),
  TWILIO_AUTH_TOKEN: z.string().min(1, 'Twilio Auth Token is required'),
  TWILIO_PHONE_NUMBER: z.string().min(1, 'Twilio phone number is required'),
  TWILIO_WHATSAPP_NUMBER: z.string().min(1, 'Twilio WhatsApp number is required'),
  FAWRY_MERCHANT_CODE: z.string().optional(),
  FAWRY_SECRET_KEY: z.string().optional(),
  FAWRY_SANDBOX_URL: z.string().url().optional(),
  APP_URL: z.string().url('Invalid app URL'),
  ADMIN_EMAIL: z.string().email('Invalid admin email'),
  ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

export function validateEnvironment(env: Record<string, unknown>): ValidatedEnv {
  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`
      );
      throw new Error(`Environment validation failed:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

export function getRequiredEnvVars(): string[] {
  return [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'JWT_SECRET',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'TWILIO_WHATSAPP_NUMBER',
    'APP_URL',
    'ADMIN_EMAIL',
  ];
}
