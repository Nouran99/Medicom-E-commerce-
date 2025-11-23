# Medicum Egypt - Infrastructure Configuration Guide

**Configuration Date**: 2025-11-23  
**Estimated Time**: 2-4 hours for complete setup  
**Current Status**: ⏳ In Progress

---

## 🎯 What We'll Configure

1. ✅ Supabase Database (Already created!)
2. ⏳ Database Tables & Data
3. ⏳ Real API Keys
4. ⏳ Cloudflare Pages Deployment
5. ⏳ Environment Variables
6. ⏳ Testing & Verification

---

## 📍 Current Status

### ✅ Already Configured
- **Supabase Project**: https://qxgmnbbbospkemikpjrv.supabase.co
- **Project ID**: qxgmnbbbospkemikpjrv
- **.dev.vars file**: Created with template values

### ⏳ Needs Configuration
- Real Supabase API keys
- Database tables (run migrations)
- Twilio credentials (for OTP)
- Production JWT secret
- Cloudflare deployment

---

## 🚀 STEP 1: Configure Supabase Database

### 1.1 Access Your Supabase Project

**Your Project URL**: https://app.supabase.com/project/qxgmnbbbospkemikpjrv

1. Go to: https://app.supabase.com
2. Login with your account
3. Select project: `qxgmnbbbospkemikpjrv`

### 1.2 Get Your Real API Keys

**Path**: Project Settings → API → Project API keys

You need to copy **TWO** keys:

1. **anon/public key** (starts with `eyJhbGci...`)
   - Used for client-side operations
   - Safe to expose in frontend
   
2. **service_role key** (starts with `eyJhbGci...`)
   - Used for admin operations
   - ⚠️ NEVER expose in frontend
   - Keep secret!

**Copy these keys and save them - we'll use them in Step 3**

### 1.3 Run Database Migrations

**Path**: SQL Editor → New query

#### Migration 1: Create Tables

1. Click **"New query"** in SQL Editor
2. Copy the ENTIRE content from: `/home/user/webapp/migrations/001_initial_schema.sql`
3. Paste in the SQL editor
4. Click **"RUN"** (bottom right, green button)
5. Wait for "Success. No rows returned"

**What this creates**: All database tables (users, products, orders, etc.)

#### Migration 2: Load Sample Data

1. Click **"New query"** again
2. Copy the ENTIRE content from: `/home/user/webapp/migrations/002_seed_data.sql`
3. Paste in the SQL editor
4. Click **"RUN"**
5. Wait for "Success"

**What this creates**: 
- 8 product categories
- 15 sample products
- 3 providers
- 5 pickup locations
- Sample coupons

#### Verify It Worked

Run this query to verify:

```sql
SELECT 
  (SELECT COUNT(*) FROM categories) as categories_count,
  (SELECT COUNT(*) FROM products) as products_count,
  (SELECT COUNT(*) FROM providers) as providers_count,
  (SELECT COUNT(*) FROM pickup_locations) as locations_count;
```

**Expected Results**:
```
categories_count: 8
products_count: 15
providers_count: 3
locations_count: 5
```

✅ If you see these numbers, database is ready!

---

## 🔑 STEP 2: Get Twilio Credentials (For OTP Login)

### Option A: Use Real Twilio (Recommended for Production)

1. **Sign up**: https://www.twilio.com/try-twilio
2. **Get free credits**: $15 trial credit
3. **Get phone number**: 
   - Console → Phone Numbers → Buy a Number
   - Choose one with SMS capability
   - Cost: ~$1/month
4. **Get credentials**:
   - Account SID (starts with AC...)
   - Auth Token (32 characters)
5. **Enable WhatsApp** (optional):
   - Join Twilio Sandbox: https://wa.me/14155238886
   - Send code: `join <your-sandbox-code>`

### Option B: Skip OTP for Now (Demo Login Only)

If you want to launch faster without OTP:
- Users can use demo login
- You can add Twilio later
- Orders will still work
- ⚠️ Less secure for production

---

## 🔐 STEP 3: Generate Production JWT Secret

Run this command to generate a secure JWT secret:

```bash
openssl rand -base64 32
```

This will output something like:
```
Xk7vN9mP2qR5tY8wA3bC6dE1fG4hJ7iK0lM3nO6pQ9s=
```

**Save this** - you'll need it for environment variables!

---

## ☁️ STEP 4: Deploy to Cloudflare Pages

### 4.1 Create Cloudflare Account

1. Go to: https://dash.cloudflare.com/sign-up
2. Sign up (free)
3. Verify email

### 4.2 Connect GitHub Repository

1. Go to **Workers & Pages** → **Create application** → **Pages**
2. Click **"Connect to Git"**
3. Authorize Cloudflare to access GitHub
4. Select repository: `Medicom-E-commerce-`
5. Click **"Begin setup"**

### 4.3 Configure Build Settings

**Framework preset**: None (we have custom config)

**Build settings**:
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: (leave empty)
- **Node version**: 18 or higher

**Branch**: `main` (or `genspark_ai_developer` for testing)

### 4.4 Add Environment Variables

Click **"Environment variables"** and add ALL of these:

#### Supabase (Get from Step 1.2)
```
SUPABASE_URL=https://qxgmnbbbospkemikpjrv.supabase.co
SUPABASE_ANON_KEY=<your-real-anon-key-from-supabase>
SUPABASE_SERVICE_KEY=<your-real-service-key-from-supabase>
```

#### Authentication (Get from Step 3)
```
JWT_SECRET=<your-generated-secret-from-step-3>
```

#### Twilio (Get from Step 2)
```
TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
TWILIO_PHONE_NUMBER=<your-twilio-phone-number>
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

#### Payment (Optional - Skip for MVP)
```
FAWRY_MERCHANT_CODE=<your-fawry-merchant-code>
FAWRY_SECRET_KEY=<your-fawry-secret-key>
FAWRY_SANDBOX_URL=https://atfawry.fawrystaging.com
```

#### Application Settings
```
APP_URL=<your-cloudflare-pages-url>
ADMIN_EMAIL=admin@medicumegypt.com
ENVIRONMENT=production
```

⚠️ **Note**: You'll get the `APP_URL` after first deployment (like `https://medicum-egypt.pages.dev`)

### 4.5 Deploy!

1. Click **"Save and Deploy"**
2. Wait 2-5 minutes for build
3. ✅ Your site will be live!

**You'll get a URL like**: `https://medicum-egypt-xxx.pages.dev`

---

## 🧪 STEP 5: Test Your Deployment

### 5.1 Homepage Test

1. Visit your Cloudflare Pages URL
2. ✅ Should see Medicum Egypt homepage in Arabic
3. ✅ Click language toggle → Should switch to English
4. ✅ Products should load (15 sample products)

### 5.2 Authentication Test

1. Click **"تسجيل الدخول"** (Login)
2. Enter a phone number
3. ✅ Should send OTP via SMS (if Twilio configured)
4. Enter OTP code
5. ✅ Should login successfully

**If Twilio not configured**: Skip for now, use admin access

### 5.3 Shopping Test

1. Browse products
2. Click **"أضف للسلة"** (Add to Cart)
3. Go to cart
4. Proceed to checkout
5. ✅ Should create order

### 5.4 Admin Dashboard Test

1. Go to `/admin`
2. Login with:
   - Email: `admin@medicumegypt.com`
   - Password: `admin123` (from seed data)
3. ✅ Should see dashboard
4. ✅ Check products list
5. ✅ Check orders

---

## 📋 STEP 6: Update Environment Variables Locally

Now that you have real keys, update your local `.dev.vars`:

```bash
# In /home/user/webapp/.dev.vars

# Replace with REAL keys from Supabase
SUPABASE_URL=https://qxgmnbbbospkemikpjrv.supabase.co
SUPABASE_ANON_KEY=<paste-real-anon-key-here>
SUPABASE_SERVICE_KEY=<paste-real-service-key-here>

# Replace with generated JWT secret
JWT_SECRET=<paste-generated-jwt-secret-here>

# Replace with real Twilio credentials (if you have them)
TWILIO_ACCOUNT_SID=<paste-twilio-sid-here>
TWILIO_AUTH_TOKEN=<paste-twilio-token-here>
TWILIO_PHONE_NUMBER=<paste-twilio-phone-here>
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Keep these as-is for now (optional)
FAWRY_MERCHANT_CODE=1tSa6uxz2nRbgmBZWgWOdALZktquRj
FAWRY_SECRET_KEY=4d5c8d54-d71f-4a5a-8f8f-8f8f8f8f8f8f
FAWRY_SANDBOX_URL=https://atfawry.fawrystaging.com

# Update with your production URL after deployment
APP_URL=https://your-app.pages.dev
ADMIN_EMAIL=admin@medicumegypt.com
ENVIRONMENT=production
```

⚠️ **Remember**: `.dev.vars` is gitignored - never commit real keys!

---

## ✅ STEP 7: Verification Checklist

### Database ✅
- [ ] Can access Supabase dashboard
- [ ] Migrations ran successfully
- [ ] 15 products visible in database
- [ ] 8 categories created
- [ ] Admin user exists

### API Keys ✅
- [ ] Real Supabase ANON_KEY obtained
- [ ] Real Supabase SERVICE_KEY obtained
- [ ] JWT secret generated (32+ characters)
- [ ] Twilio credentials obtained (or skipped for MVP)

### Deployment ✅
- [ ] Cloudflare account created
- [ ] Repository connected
- [ ] Environment variables added
- [ ] First deployment successful
- [ ] Site is live and accessible

### Testing ✅
- [ ] Homepage loads
- [ ] Language switching works
- [ ] Products display
- [ ] Can add to cart
- [ ] Can create order
- [ ] Admin dashboard accessible

---

## 🎯 Quick Start Summary

**For Fastest MVP (2 hours)**:

1. **Get Supabase keys** (15 min)
   - Go to Supabase dashboard
   - Copy anon_key and service_role key

2. **Run migrations** (15 min)
   - Open SQL Editor
   - Run 001_initial_schema.sql
   - Run 002_seed_data.sql

3. **Generate JWT secret** (1 min)
   - Run: `openssl rand -base64 32`
   - Save the output

4. **Deploy to Cloudflare** (1 hour)
   - Create account
   - Connect GitHub
   - Add environment variables
   - Deploy

5. **Test** (30 min)
   - Visit site
   - Test basic functionality
   - Verify products load

**Skip Twilio for MVP** - Add it later when needed

---

## 🆘 Common Issues & Solutions

### Issue: "Supabase keys don't work"
**Solution**: Make sure you copied the FULL key including any trailing `=` signs

### Issue: "Database tables not created"
**Solution**: Check SQL Editor for errors. Run migrations one at a time.

### Issue: "Site shows 'Unauthorized'"
**Solution**: Check JWT_SECRET is set in Cloudflare environment variables

### Issue: "Products don't load"
**Solution**: Verify SUPABASE_ANON_KEY is correct in Cloudflare

### Issue: "OTP doesn't send"
**Solution**: Either add real Twilio credentials OR skip OTP and use admin login

---

## 📞 What You Need From Me

To help you configure, I need you to:

1. **Supabase Keys**:
   - Go to: https://app.supabase.com/project/qxgmnbbbospkemikpjrv/settings/api
   - Copy the `anon` key
   - Copy the `service_role` key
   - Share them with me (in this chat - it's secure)

2. **Confirm Migrations**:
   - Did you run the SQL migrations?
   - Did you see "Success" message?
   - Can you see products in Supabase Table Editor?

3. **Twilio Decision**:
   - Do you want OTP login now, or skip for MVP?
   - If skip: We'll use admin login only for now

4. **Cloudflare**:
   - Do you have a Cloudflare account?
   - Have you connected the GitHub repo?

**Let me know what step you're on, and I'll guide you through it!** 🚀

---

## 📊 Progress Tracker

Track your progress:

- [ ] **Step 1**: Supabase keys obtained
- [ ] **Step 2**: Database migrations ran
- [ ] **Step 3**: JWT secret generated
- [ ] **Step 4**: Twilio credentials (or decided to skip)
- [ ] **Step 5**: Cloudflare account created
- [ ] **Step 6**: Repository connected to Cloudflare
- [ ] **Step 7**: Environment variables added
- [ ] **Step 8**: First deployment successful
- [ ] **Step 9**: Site tested and working
- [ ] **Step 10**: Ready for production!

---

**Current Status**: Ready to help you configure! Let me know where you want to start. 🎉
