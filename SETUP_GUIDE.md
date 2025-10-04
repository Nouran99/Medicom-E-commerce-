# Medicum Egypt - Complete Setup Guide

This guide provides step-by-step instructions to set up and deploy the Medicum Egypt e-commerce platform.

## Prerequisites

Before starting, ensure you have the following accounts and tools:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **Supabase** account for database
- **Twilio** account for SMS/WhatsApp notifications
- **Cloudflare** account for deployment
- **Fawry** merchant account for payments (optional)

## Step 1: Clone and Install

Clone the repository and install dependencies:

```bash
git clone https://github.com/Nouran99/Medicom-E-commerce-.git
cd Medicom-E-commerce-
npm install
```

## Step 2: Database Setup (Supabase)

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and API keys
3. Navigate to the SQL Editor in your Supabase dashboard

### Run Database Migrations

Execute the following SQL files in order:

1. **Initial Schema**: Run `migrations/001_initial_schema.sql`
2. **Seed Data**: Run `migrations/002_seed_data.sql`  
3. **Enhanced Schema**: Run `migrations/003_enhanced_product_schema.sql`

Alternatively, you can run the complete setup script:
```sql
-- Copy and paste the contents of CREATE_TABLES_AND_IMPORT.sql
```

### Configure Row Level Security (RLS)

Supabase automatically enables RLS. The migration scripts include the necessary policies for secure data access.

## Step 3: Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long

# Twilio Configuration (for SMS/WhatsApp)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Fawry Payment Configuration (Optional)
FAWRY_MERCHANT_CODE=your_fawry_merchant_code
FAWRY_SECRET_KEY=your_fawry_secret_key
FAWRY_SANDBOX_URL=https://atfawry.fawrystaging.com

# Application Configuration
APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@medicumegypt.com
ENVIRONMENT=development
```

### Getting Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the **Project URL** for `SUPABASE_URL`
3. Copy the **anon public** key for `SUPABASE_ANON_KEY`
4. Copy the **service_role** key for `SUPABASE_SERVICE_KEY`

### Setting Up Twilio

1. Create a [Twilio account](https://www.twilio.com)
2. Get a phone number for SMS
3. Enable WhatsApp sandbox for testing
4. Copy your Account SID and Auth Token

## Step 4: Local Development

Start the development server:

```bash
# Build the project first
npm run build

# Start local development server
npm run dev:sandbox
```

The application will be available at `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types

## Step 5: Testing the Application

### Test Authentication

1. Visit `http://localhost:3000`
2. Click "تسجيل الدخول" (Login)
3. Enter a phone number and request OTP
4. Check your phone for the OTP code
5. Enter the OTP to complete login

### Test Admin Dashboard

1. Visit `http://localhost:3000/admin`
2. Login with admin credentials (set in environment)
3. Test product management features
4. Test order management features

### Import Sample Products

Use the Excel import feature to add products:

1. Go to Admin Dashboard → Import Products
2. Download the template
3. Fill in product data
4. Upload the Excel file

## Step 6: Production Deployment

### Deploy to Cloudflare Pages

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Deploy the application:
```bash
npm run deploy:prod
```

### Configure Environment Variables in Cloudflare

1. Go to Cloudflare Pages dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add all the environment variables from your `.env` file

### Set Up Custom Domain (Optional)

1. In Cloudflare Pages, go to **Custom Domains**
2. Add your domain name
3. Configure DNS settings as instructed

## Step 7: Production Configuration

### Update Environment Variables

For production, update these variables:

```env
APP_URL=https://your-domain.com
ENVIRONMENT=production
FAWRY_SANDBOX_URL=https://www.atfawry.com  # Use production URL
```

### Configure Twilio for Production

1. Purchase a dedicated phone number
2. Set up WhatsApp Business API (optional)
3. Update phone numbers in environment variables

### Set Up Monitoring

1. Enable Cloudflare Analytics
2. Set up Supabase monitoring
3. Configure error tracking (optional)

## Step 8: Post-Deployment Tasks

### Add Real Product Data

1. Prepare your product catalog in Excel format
2. Use the admin import feature to bulk upload products
3. Add product images (implement image upload feature)
4. Configure pickup locations

### Configure Payment Methods

1. **Fawry**: Complete merchant registration and get production credentials
2. **Credit Cards**: Integrate with payment processor
3. **E-wallets**: Set up integrations with local providers

### Set Up Customer Support

1. Configure customer service phone numbers
2. Set up WhatsApp Business for support
3. Create FAQ and help documentation

## Troubleshooting

### Common Issues

**Build Errors**
- Ensure all environment variables are set
- Check TypeScript compilation with `npm run type-check`
- Verify all dependencies are installed

**Database Connection Issues**
- Verify Supabase credentials
- Check if RLS policies are correctly configured
- Ensure database migrations have been run

**SMS/WhatsApp Not Working**
- Verify Twilio credentials
- Check phone number format (include country code)
- Ensure Twilio account has sufficient balance

**Deployment Issues**
- Check Wrangler configuration
- Verify Cloudflare account permissions
- Ensure all environment variables are set in Cloudflare

### Getting Help

- Check the [API Documentation](./API_DOCUMENTATION.md)
- Review the [Issues Identified](./ISSUES_IDENTIFIED.md) document
- Contact the development team for technical support

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **JWT Secret**: Use a strong, randomly generated secret
3. **Database Access**: Ensure RLS policies are properly configured
4. **API Rate Limiting**: Monitor and adjust rate limits as needed
5. **HTTPS**: Always use HTTPS in production
6. **Input Validation**: All user inputs are validated using Zod schemas

## Performance Optimization

1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Caching**: Implement caching for frequently accessed data
3. **Image Optimization**: Compress and optimize product images
4. **CDN**: Use Cloudflare CDN for static assets
5. **Bundle Size**: Monitor and optimize JavaScript bundle size

---

**Last Updated**: October 2025  
**Version**: 2.0.0  
**Status**: Production Ready
