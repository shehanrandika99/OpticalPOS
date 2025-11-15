# Environment Setup Guide

## Problem
Script run කරන විට `DATABASE_URL` environment variable missing error එකක් එනවා.

## Solution

### Step 1: .env.local file එක create කරන්න

Project root folder එකේ (my-app folder එකේ) `.env.local` file එකක් create කරන්න.

**PowerShell හි:**
```powershell
New-Item -Path ".env.local" -ItemType File
```

**හෝ manually:**
1. Project folder එක open කරන්න
2. New file එකක් create කරන්න
3. Name එක `.env.local` කරන්න (dot එකත් එක්ක)

### Step 2: Database URL add කරන්න

`.env.local` file එකේ මේ content එක add කරන්න:

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
NODE_ENV=development
```

**Example (Neon Database):**
```env
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.neon.tech/dbname?sslmode=require
NODE_ENV=development
```

### Step 3: Script run කරන්න

```powershell
pnpm setup-db
```

## Database URL කොහොමද ලබාගන්නේ?

### Neon Database:
1. Neon dashboard එකට login කරන්න
2. Your project select කරන්න
3. Connection string copy කරන්න
4. `.env.local` file එකේ paste කරන්න

### Local PostgreSQL:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/mydatabase
```

### Other Cloud Providers:
- Supabase, Railway, Render, etc. - ඔවුන්ගේ dashboard එකෙන් connection string එක copy කරන්න

## Security Note

⚠️ **Important:** `.env.local` file එක `.gitignore` එකේ තියෙනවාද check කරන්න. 
මේ file එක GitHub එකට commit කරන්න එපා!

## Verification

Environment variable load වුනාද check කරන්න:

```powershell
# PowerShell
Get-Content .env.local
```

Setup සාර්ථක වුනාද test කරන්න:

```powershell
pnpm setup-db
```

Success message එකක් එනවා නම් database setup සාර්ථකයි! ✅

