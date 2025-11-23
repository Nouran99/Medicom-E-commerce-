# ⚡ Quick Configuration Guide

**Time Required**: 30 minutes for MVP

---

## 🎯 What You Need Right Now

To get your site running, you need **3 things**:

1. ✅ **Supabase Keys** (You already have the project!)
2. ⏳ **Run Database Migrations**
3. ⏳ **Deploy to Cloudflare**

---

## 📝 Step-by-Step (Copy & Paste)

### STEP 1: Get Your Supabase Keys (5 minutes)

**Your Supabase Project**: https://app.supabase.com/project/qxgmnbbbospkemikpjrv

1. **Go to Settings → API**
   Direct link: https://app.supabase.com/project/qxgmnbbbospkemikpjrv/settings/api

2. **Copy TWO keys**:
   
   **Key 1 - anon/public**:
   ```
   Starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Length: ~200+ characters
   Label: "anon" or "anon public"
   ```
   
   **Key 2 - service_role**:
   ```
   Starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Length: ~200+ characters
   Label: "service_role"
   ```

3. **Save them** - You'll paste these into Cloudflare later

✅ **Done? Go to Step 2**

---

### STEP 2: Run Database Migrations (10 minutes)

**Go to SQL Editor**: https://app.supabase.com/project/qxgmnbbbospkemikpjrv/sql/new

#### 2A: Create Tables

1. Click **"New query"**
2. **Copy & Paste** the entire file content from:
   ```
   /home/user/webapp/migrations/001_initial_schema.sql
   ```
3. Click **"RUN"** (green button bottom right)
4. Wait for: ✅ "Success. No rows returned"

#### 2B: Load Sample Data

1. Click **"New query"** again
2. **Copy & Paste** the entire file content from:
   ```
   /home/user/webapp/migrations/002_seed_data.sql
   ```
3. Click **"RUN"**
4. Wait for: ✅ "Success"

#### 2C: Verify

Run this quick check:
```sql
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM categories;
```

Expected:
- products: **15**
- categories: **8**

✅ **See these numbers? Go to Step 3**

---

### STEP 3: Deploy to Cloudflare Pages (15 minutes)

#### 3A: Create Account & Connect Repo

1. **Sign up**: https://dash.cloudflare.com/sign-up
2. Go to: **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. **Authorize** Cloudflare to access GitHub
4. **Select**: `Medicom-E-commerce-` repository
5. **Begin setup**

#### 3B: Build Settings

```
Framework preset: None
Build command: npm run build
Build output directory: dist
Root directory: (leave empty)
```

#### 3C: Environment Variables

Click **"Add variable"** for each:

**CRITICAL (Required)**:
```env
SUPABASE_URL=https://qxgmnbbbospkemikpjrv.supabase.co
SUPABASE_ANON_KEY=<paste-your-anon-key-from-step-1>
SUPABASE_SERVICE_KEY=<paste-your-service-role-key-from-step-1>
JWT_SECRET=medicum-egypt-secure-jwt-production-key-2025-change-this
```

**OPTIONAL (Skip for now)**:
```env
TWILIO_ACCOUNT_SID=skip-for-now
TWILIO_AUTH_TOKEN=skip-for-now
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
APP_URL=https://your-site-name.pages.dev
ADMIN_EMAIL=admin@medicumegypt.com
ENVIRONMENT=production
```

#### 3D: Deploy!

1. Click **"Save and Deploy"**
2. Wait **2-5 minutes**
3. ✅ You'll get a URL like: `https://medicum-egypt-xxx.pages.dev`

---

## 🎉 That's It!

**Your site is now LIVE!**

Visit your URL and you should see:
- ✅ Homepage in Arabic
- ✅ 15 products loaded
- ✅ Language switching works
- ✅ Shopping cart works
- ✅ Can place orders (COD)

---

## 🧪 Quick Test

1. **Homepage**: Should load with products
2. **Language**: Click EN button → Should switch to English
3. **Products**: Should see 15 medical products
4. **Cart**: Add to cart → Should work
5. **Admin**: Go to `/admin` → Login with:
   - Email: `admin@medicumegypt.com`
   - Password: `admin123`

---

## ⚠️ Known Limitations (MVP)

**What works**:
- ✅ Product browsing
- ✅ Shopping cart
- ✅ Cash on Delivery orders
- ✅ Admin dashboard
- ✅ Language switching

**What doesn't work yet** (because we skipped Twilio):
- ❌ OTP login (users can't register)
- ❌ SMS notifications

**Workaround**: 
- Use admin login for testing
- Add Twilio later when ready

---

## 🆘 Problems?

### "Products don't load"
➡️ Check: Did you paste the correct SUPABASE_ANON_KEY?

### "Site shows errors"
➡️ Check: Did database migrations run successfully?

### "Can't login"
➡️ Use admin login: `admin@medicumegypt.com` / `admin123`

---

## 📞 Need Help?

**Share with me**:
1. Your Cloudflare Pages URL
2. Any error messages you see
3. Which step you're stuck on

I'll help you troubleshoot! 🚀

---

**Next Steps After MVP**:
1. Add real Twilio credentials (for OTP)
2. Import your 150+ products
3. Add product images
4. Configure Fawry payments
5. Add custom domain

**For now**: Get the MVP running first! ✨
