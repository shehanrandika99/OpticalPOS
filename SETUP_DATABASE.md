# Database Setup Guide

## schema.sql file run කරන්නේ කොහොමද?

Database setup කිරීමට පහත ක්‍රම 3ක් තියෙනවා:

## Method 1: API Endpoint (පහසුම ක්‍රමය) ⭐

1. Development server start කරන්න:
```bash
pnpm dev
```

2. Browser එකෙන් හෝ Postman/curl වලින් API call කරන්න:
```bash
curl -X POST http://localhost:3000/api/users/setup
```

හෝ browser එකෙන්:
- URL: `http://localhost:3000/api/users/setup`
- Method: POST

## Method 2: Node.js Script (Recommended)

1. `tsx` install කරන්න (අවශ්‍ය නම්):
```bash
pnpm add -D tsx
```

2. Script run කරන්න:
```bash
pnpm setup-db
```

හෝ:
```bash
npx tsx scripts/setup-db.ts
```

## Method 3: Direct SQL (psql හෝ Database Client)

1. Database connection string එකෙන් database connect කරන්න

2. `lib/db/schema.sql` file එකේ SQL commands copy කරලා run කරන්න

**psql example:**
```bash
psql $DATABASE_URL -f lib/db/schema.sql
```

**Neon Console:**
- Neon dashboard එකට ගිහින් SQL Editor එකෙන් schema.sql file එකේ content copy කරලා run කරන්න

## Verification

Setup සාර්ථක වුනාද check කරන්න:

```bash
curl http://localhost:3000/api/users
```

හෝ Register Dashboard page එකට ගිහින් users table එක empty වෙනවාද check කරන්න.

## Troubleshooting

- **"Table already exists"** - Table එක දැනටමත් create කරලා තියෙනවා. Problem නැහැ!
- **Connection error** - `.env.local` file එකේ `DATABASE_URL` check කරන්න
- **Permission error** - Database user ට table create කරන්න permission තියෙනවාද check කරන්න

