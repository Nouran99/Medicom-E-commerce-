import { Context } from 'hono';
import { sign, verify } from 'hono/jwt';
import { getSupabaseAdmin, Env } from '../lib/supabase';
import { AUTH_CONSTANTS } from '../utils/constants';
import { AuthenticationError, ValidationError } from '../utils/error-handler';

export class AuthService {
  private c: Context<{ Bindings: Env }>;

  constructor(c: Context<{ Bindings: Env }>) {
    this.c = c;
  }

  // Generate OTP
  generateOTP(): string {
    return Math.floor(
      Math.pow(10, AUTH_CONSTANTS.OTP_LENGTH - 1) +
        Math.random() *
          (Math.pow(10, AUTH_CONSTANTS.OTP_LENGTH) - Math.pow(10, AUTH_CONSTANTS.OTP_LENGTH - 1))
    ).toString();
  }

  // Send OTP via SMS using Twilio
  async sendOTPviaSMS(phone: string, otp: string): Promise<boolean> {
    try {
      const twilioAuth = btoa(`${this.c.env.TWILIO_ACCOUNT_SID}:${this.c.env.TWILIO_AUTH_TOKEN}`);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.c.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${twilioAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phone,
            From: this.c.env.TWILIO_PHONE_NUMBER,
            Body: `Your Medicum Egypt verification code is: ${otp}. Valid for 10 minutes.`,
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  // Send OTP via WhatsApp using Twilio
  async sendOTPviaWhatsApp(phone: string, otp: string): Promise<boolean> {
    try {
      const twilioAuth = btoa(`${this.c.env.TWILIO_ACCOUNT_SID}:${this.c.env.TWILIO_AUTH_TOKEN}`);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.c.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${twilioAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: `whatsapp:${phone}`,
            From: this.c.env.TWILIO_WHATSAPP_NUMBER,
            Body: `Your Medicum Egypt verification code is: ${otp}. Valid for 10 minutes.`,
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to send WhatsApp:', error);
      return false;
    }
  }

  // Request OTP
  async requestOTP(
    identifier: string,
    type: 'sms' | 'email'
  ): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabaseAdmin(this.c);
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + AUTH_CONSTANTS.OTP_EXPIRY_MINUTES * 60 * 1000);

    try {
      // Store OTP in database
      const { error } = await supabase.from('otps').insert({
        identifier,
        otp,
        type,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      // Send OTP
      if (type === 'sms') {
        const sent = await this.sendOTPviaSMS(identifier, otp);
        if (!sent) throw new Error('Failed to send SMS');
      } else {
        // Email sending would be implemented here
        console.log(`Email OTP for ${identifier}: ${otp}`);
      }

      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('OTP request error:', error);
      return { success: false, message: 'Failed to send OTP' };
    }
  }

  // Verify OTP
  async verifyOTP(
    identifier: string,
    otp: string
  ): Promise<{ success: boolean; token?: string; user?: any }> {
    const supabase = getSupabaseAdmin(this.c);

    try {
      // Check OTP validity
      const { data: otpRecord, error: otpError } = await supabase
        .from('otps')
        .select('*')
        .eq('identifier', identifier)
        .eq('otp', otp)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (otpError || !otpRecord) {
        return { success: false };
      }

      // Mark OTP as verified
      await supabase.from('otps').update({ verified: true }).eq('id', otpRecord.id);

      // Get or create user
      let { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .or(`phone.eq.${identifier},email.eq.${identifier}`)
        .single();

      if (userError && userError.code === 'PGRST116') {
        // User doesn't exist, create new user
        const isPhone = /^\+?[0-9]+$/.test(identifier);
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            phone: isPhone ? identifier : '',
            email: !isPhone ? identifier : '',
            name: 'New User',
            language: 'ar',
            role: 'customer',
          })
          .select()
          .single();

        if (createError) throw createError;
        user = newUser;
      }

      // Generate JWT token
      const token = await sign(
        {
          sub: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * AUTH_CONSTANTS.JWT_EXPIRY_DAYS,
        },
        this.c.env.JWT_SECRET
      );

      return { success: true, token, user };
    } catch (error) {
      console.error('OTP verification error:', error);
      return { success: false };
    }
  }

  // Verify JWT token
  async verifyToken(token: string): Promise<any> {
    try {
      const payload = await verify(token, this.c.env.JWT_SECRET);
      return payload;
    } catch (error) {
      return null;
    }
  }
}
