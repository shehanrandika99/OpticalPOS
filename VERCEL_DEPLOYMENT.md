# Vercel Deployment Guide

## Step 1: Fix TypeScript Errors
✅ Fixed: TypeScript error in `app/api/reports/income/route.ts` - Added proper type annotations

## Step 2: Environment Variables Setup in Vercel

After deploying to Vercel, you need to add environment variables:

1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Add the following variables:

### Required Environment Variables:

```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h
```

### How to get DATABASE_URL:

If using a PostgreSQL database (like Supabase, Neon, or Railway):

**Format:**
```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

**Example (Supabase):**
```
postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Example (Neon):**
```
postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb
```

## Step 3: Database Setup

After deployment, you need to run the database schema:

### Option 1: Use Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Run database setup script
vercel env pull .env.local
pnpm setup-db
```

### Option 2: Use API Endpoint
Create a temporary API endpoint to run the schema, then delete it after setup.

### Option 3: Manual SQL
Run the SQL from `lib/db/schema.sql` directly in your database.

## Step 4: Deploy

1. Push your code to GitHub:
```bash
git add .
git commit -m "Fix TypeScript errors for Vercel deployment"
git push
```

2. Vercel will automatically deploy on push

3. Add environment variables in Vercel dashboard

4. Run database setup

## Step 5: Verify Deployment

1. Check build logs in Vercel dashboard
2. Test the application
3. Verify database connection

## Troubleshooting

### Build Fails:
- Check TypeScript errors
- Ensure all dependencies are in `package.json`
- Check `next.config.ts` for any issues

### Database Connection Fails:
- Verify `DATABASE_URL` is correct
- Check if database allows connections from Vercel IPs
- Ensure database is accessible from internet

### Runtime Errors:
- Check Vercel function logs
- Verify environment variables are set
- Check database connection string format

