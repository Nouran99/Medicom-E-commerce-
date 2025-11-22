# Medicum Egypt - Developer Setup Guide

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ and npm installed
- Git installed
- A Supabase account (free tier is fine)
- Optional: Twilio account for SMS/WhatsApp testing

## Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd medicum-egypt
npm install
```

### 2. Configure Environment Variables ⚠️ REQUIRED

Create a `.dev.vars` file in the project root:

```bash
# Create the file
touch .dev.vars
```

Add the following configuration (replace with your actual values):

```env
# Supabase Configuration (REQUIRED - Get from https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# JWT Secret (REQUIRED - Use any secure random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Twilio Configuration (OPTIONAL for local dev)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Fawry Payment Configuration (OPTIONAL for local dev)
FAWRY_MERCHANT_CODE=your_merchant_code
FAWRY_SECRET_KEY=your_secret_key
FAWRY_SANDBOX_URL=https://atfawry.fawrystaging.com

# Application Configuration
APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@medicumegypt.com
ENVIRONMENT=development
```

**Important:** The `.dev.vars` file is already in `.gitignore` and will not be committed to git.

### 3. Setup Supabase Database

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run these two migration files in order:

**First - Create Tables:**
```sql
-- Copy entire content from: /migrations/001_initial_schema.sql
-- Paste in SQL Editor and click "Run"
```

**Second - Add Sample Data:**
```sql
-- Copy entire content from: /migrations/002_seed_data.sql
-- Paste in SQL Editor and click "Run"
```

#### Option B: Using Command Line

```bash
# If you have Supabase CLI installed
supabase db push
```

### 4. Build the Application

```bash
npm run build
```

This generates the `/dist` folder with compiled assets.

### 5. Start Development Server

```bash
npm run dev:sandbox
```

The server will start on `http://localhost:3000`

**Note:** Due to Cloudflare Workers runtime limitations in local development, external network calls (like Supabase) may not work. For full testing, deploy to Cloudflare Pages.

## 🧪 Testing Your Setup

### Verify Server is Running

```bash
curl http://localhost:3000/api/health
```

Expected: `{"status":"healthy","timestamp":"...","environment":"development"}`

### Access the Application

- **Homepage:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin
- **Admin Login Credentials (from seed data):**
  - Email: admin@medicumegypt.com
  - Password: admin123

## 🚨 Common Issues and Solutions

### Issue: "JWT auth middleware requires options for secret"
**Solution:** You forgot to create the `.dev.vars` file. See Step 2 above.

### Issue: "DNS lookup failed" or "Failed to fetch products"
**Cause:** Cloudflare Workers local runtime blocks external network calls.

**Solutions:**
1. Deploy to Cloudflare Pages for real testing (recommended)
2. Use mock data for local development
3. Test individual functions with direct Supabase client

### Issue: "Port 3000 already in use"
**Solution:** Kill the process using port 3000:
```bash
npm run clean-port
# or manually:
lsof -ti:3000 | xargs kill -9
```

### Issue: "Module not found" errors
**Solution:** Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📦 Available Scripts

```bash
# Development
npm run dev              # Vite development server
npm run dev:sandbox      # Wrangler Pages development server

# Build
npm run build           # Build for production
npm run preview         # Preview production build

# Deployment
npm run deploy          # Deploy to Cloudflare Pages
npm run deploy:prod     # Deploy to production project

# Utilities
npm run clean-port      # Kill process on port 3000
npm test               # Test server connection
```

## 🏗️ Project Structure

```
medicum-egypt/
├── src/
│   ├── index.tsx              # Main application entry point
│   ├── lib/
│   │   └── supabase.ts        # Supabase client configuration
│   ├── middleware/
│   │   └── auth.ts            # JWT authentication middleware
│   ├── routes/                # API route handlers
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── cart.ts
│   │   ├── orders.ts
│   │   ├── admin.ts
│   │   └── ...
│   ├── services/
│   │   └── auth.service.ts    # Authentication service
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions
├── public/                    # Static files
│   └── static/
│       ├── js/                # Client-side JavaScript
│       └── images/            # Image assets
├── migrations/                # Database migration scripts
│   ├── 001_initial_schema.sql
│   └── 002_seed_data.sql
├── dist/                      # Build output (generated)
├── .dev.vars                  # Environment variables (YOU CREATE THIS)
├── wrangler.jsonc            # Cloudflare Workers config
├── vite.config.ts            # Vite build configuration
├── package.json              # Dependencies and scripts
└── README.md                 # Project documentation
```

## 🔐 Environment Variables Reference

### Required for Basic Functionality
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key (for client-side)
- `SUPABASE_SERVICE_KEY` - Supabase service role key (for server-side)
- `JWT_SECRET` - Secret for JWT token signing (min 32 characters)

### Required for Authentication
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio authentication token
- `TWILIO_PHONE_NUMBER` - Twilio phone number for SMS
- `TWILIO_WHATSAPP_NUMBER` - Twilio WhatsApp number

### Required for Payments
- `FAWRY_MERCHANT_CODE` - Fawry merchant code
- `FAWRY_SECRET_KEY` - Fawry secret key
- `FAWRY_SANDBOX_URL` - Fawry API endpoint (sandbox or production)

### Application Settings
- `APP_URL` - Application base URL
- `ADMIN_EMAIL` - Admin user email
- `ENVIRONMENT` - Environment name (development/production)

## 🚀 Deploying to Production

### Prerequisites
- Cloudflare account
- Wrangler CLI configured

### Deployment Steps

1. **Build the application:**
```bash
npm run build
```

2. **Configure Cloudflare Pages environment variables:**
   - Go to Cloudflare Pages dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add all variables from `.dev.vars`

3. **Deploy:**
```bash
npm run deploy:prod
```

4. **Verify deployment:**
   - Visit your Cloudflare Pages URL
   - Test the health endpoint: `https://your-app.pages.dev/api/health`
   - Login to admin dashboard

## 📚 Additional Resources

- [Hono Documentation](https://hono.dev/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Supabase Documentation](https://supabase.com/docs)
- [Twilio API Reference](https://www.twilio.com/docs)

## 🆘 Getting Help

If you encounter issues:

1. Check the `TEST_RESULTS.md` file for known issues
2. Review error logs in `.wrangler/logs/`
3. Check Cloudflare Workers logs in production
4. Verify environment variables are set correctly

## 🔄 Keeping Up to Date

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Rebuild
npm run build

# Restart dev server
npm run dev:sandbox
```

---

**Last Updated:** 2025-11-22  
**Version:** 1.0.0  
**Status:** Ready for Development
