# 🚀 Supabase Setup Guide for Medicum Egypt

## Quick Setup (5 minutes)

### Step 1: Create Supabase Account
1. Go to [app.supabase.com](https://app.supabase.com)
2. Sign up with GitHub or Email
3. Click **"New Project"**
4. Fill in:
   - **Name**: `medicum-egypt`
   - **Password**: Choose a strong database password
   - **Region**: `eu-central-1` (Frankfurt - closest to Egypt)
5. Click **"Create Project"** (takes ~2 minutes)

### Step 2: Get Your Credentials
1. Once created, go to **Settings** → **API**
2. Copy these values:

| Field | Where to Find | Example |
|-------|--------------|---------|
| **Project URL** | Under "Project URL" | `https://abcdefgh.supabase.co` |
| **anon public** | Under "Project API keys" | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| **service_role** | Under "Project API keys" (click reveal) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Step 3: Run Database Setup
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy ALL content from `migrations/001_initial_schema.sql`
4. Paste and click **"Run"**
5. Create another query
6. Copy ALL content from `migrations/002_seed_data.sql`
7. Paste and click **"Run"**

### Step 4: Update Application Configuration

#### Option A: Use Setup Script (Recommended)
```bash
cd /home/user/webapp
node setup-supabase.js
# Follow the prompts and paste your credentials
```

#### Option B: Manual Update
Edit `.dev.vars` file and replace:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here
```

### Step 5: Restart Application
```bash
pm2 restart medicum-egypt
```

## ✅ Verify Connection

Test if Supabase is connected:
```bash
curl http://localhost:3000/api/products/categories
```

You should see the 8 medical categories if connected successfully.

## 📊 What Gets Created in Supabase

### Tables Created (20+):
- `users` - Customer accounts
- `products` - Medical products (15 sample products)
- `categories` - Product categories (8 categories)
- `orders` - Customer orders
- `order_items` - Order line items
- `prescriptions` - Prescription uploads
- `inventory_lots` - Batch/lot tracking
- `addresses` - Delivery addresses
- `coupons` - Discount codes (3 sample coupons)
- `providers` - Product providers (3 providers)
- `pickup_locations` - Store locations (5 locations)
- `carts` - Shopping carts
- `notifications` - SMS/WhatsApp logs
- `reviews` - Product reviews
- `admin_users` - Admin accounts
- `audit_logs` - Admin activity logs
- `otps` - OTP verification codes

### Sample Data Included:
- ✅ 8 Medical Categories (Pain Relief, Antibiotics, etc.)
- ✅ 15 Medical Products with Arabic/English names
- ✅ 3 Providers (Cairo Pharma, Giza Medical, Nile Health)
- ✅ 5 Pickup Locations across Cairo & Giza
- ✅ 3 Active Coupons (WELCOME10, SAVE50, HEALTH20)
- ✅ 1 Admin User (admin@medicumegypt.com)

## 🔒 Security Settings

After setup, go to **Authentication** → **Policies** and ensure:
1. RLS (Row Level Security) is enabled on all tables
2. Configure appropriate policies for your production needs

## 🆘 Troubleshooting

### If you see "Invalid supabaseUrl" error:
- Check that your URL starts with `https://`
- Ensure no trailing slash at the end
- Verify the URL format: `https://[project-ref].supabase.co`

### If queries fail:
- Make sure to run migrations in order (001 first, then 002)
- Check that UUID extension is enabled (first line of migration)

### If products don't show:
- Verify seed data was inserted
- Check Supabase table viewer for data
- Ensure RLS policies allow read access

## 🎯 Next Steps After Supabase

1. **Set up Twilio** for SMS/WhatsApp OTP
2. **Configure Fawry** for payment processing
3. **Deploy to Cloudflare Pages**

## 📧 Need Help?

Common issues:
- **Free tier limits**: 500MB database, 2 projects
- **Region selection**: Choose closest to your users
- **API rate limits**: 1000 requests/hour on free tier

Ready to connect! Just need your Supabase credentials.