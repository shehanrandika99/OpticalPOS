# Vercel Environment Variables Setup Guide (Sinhala/English)

## Problem (ප්‍රශ්නය)
Deployment කරපු අවස්ථාවේ `DATABASE_URL is required but not set` error එකක් එනවා.

## Solution (විසඳුම)

### Step 1: Vercel Dashboard එකට Login කරන්න
1. [Vercel Dashboard](https://vercel.com/dashboard) එකට යන්න
2. Your project select කරන්න

### Step 2: Environment Variables Add කරන්න
1. Project settings එකට යන්න
2. **Settings** tab එක click කරන්න
3. **Environment Variables** section එකට scroll down කරන්න
4. **Add New** button එක click කරන්න

### Step 3: DATABASE_URL Add කරන්න

**Variable Name:**
```
DATABASE_URL
```

**Value:**
Your PostgreSQL connection string. Examples:

**Neon Database:**
```
postgresql://username:password@ep-xxx-xxx.region.neon.tech/dbname?sslmode=require
```

**Supabase:**
```
postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Railway:**
```
postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

### Step 4: Environment Select කරන්න
- ✅ **Production** - Production deployments වලට
- ✅ **Preview** - Preview deployments වලට  
- ✅ **Development** - Development deployments වලට

**Important:** All three environments select කරන්න (recommended)

### Step 5: Save කරන්න
1. **Save** button click කරන්න
2. **Redeploy** button click කරන්න (or automatic redeploy වෙයි)

## How to Get DATABASE_URL

### Neon Database:
1. [Neon Dashboard](https://console.neon.tech) එකට login කරන්න
2. Your project select කරන්න
3. **Connection Details** section එකේ connection string copy කරන්න
4. Password එක add කරන්න (if not included)

### Supabase:
1. [Supabase Dashboard](https://app.supabase.com) එකට login කරන්න
2. Your project select කරන්න
3. **Settings** → **Database** → **Connection string** එක copy කරන්න
4. Password එක replace කරන්න

### Railway:
1. [Railway Dashboard](https://railway.app) එකට login කරන්න
2. Your PostgreSQL service select කරන්න
3. **Variables** tab එකේ `DATABASE_URL` copy කරන්න

## Verification (සත්‍යාපනය)

### Option 1: Vercel Dashboard
1. Project settings එකේ **Settings** → **Environment Variables** එක check කරන්න
2. `DATABASE_URL` එක listed වෙනවාද check කරන්න

### Option 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Pull environment variables
vercel env pull .env.local

# Check if DATABASE_URL exists
cat .env.local | grep DATABASE_URL
```

### Option 3: Test API
Deployment කරපු පසු `/api/test-db` endpoint එක test කරන්න:
```bash
curl https://your-app.vercel.app/api/test-db
```

## Troubleshooting (ගැටලු විසඳීම)

### Error: "DATABASE_URL is required but not set"
- ✅ Vercel settings එකේ environment variable add කරලා නැද්ද check කරන්න
- ✅ Redeploy කරලා නැද්ද check කරන්න
- ✅ Correct environment (Production/Preview) select කරලා නැද්ද check කරන්න

### Error: "Connection refused" or "Connection timeout"
- ✅ Database connection string correct ද check කරන්න
- ✅ Database public access enable කරලා නැද්ද check කරන්න
- ✅ Firewall rules database allow කරනවාද check කරන්න

### Error: "Authentication failed"
- ✅ Username/password correct ද check කරන්න
- ✅ Database credentials correct ද verify කරන්න

## Important Notes (වැදගත් සටහන්)

1. **Never commit `.env.local` to Git** - This file contains sensitive information
2. **Use different databases for different environments** - Production, Preview, Development
3. **Keep your DATABASE_URL secure** - Don't share it publicly
4. **Redeploy after adding environment variables** - Changes take effect after redeployment

## Quick Checklist (ක්ෂණික ලැයිස්තුව)

- [ ] Vercel dashboard එකට login කරලා
- [ ] Project select කරලා
- [ ] Settings → Environment Variables එකට ගිහින්
- [ ] `DATABASE_URL` add කරලා
- [ ] All environments (Production, Preview, Development) select කරලා
- [ ] Save කරලා
- [ ] Redeploy කරලා
- [ ] Test කරලා check කරලා

## Support (උදව්)

If you still have issues:
1. Check Vercel function logs in the dashboard
2. Verify database is accessible from internet
3. Check database provider's documentation
4. Review connection string format

