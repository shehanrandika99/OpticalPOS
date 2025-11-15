# OpticalPOS - Invoice Management System

A comprehensive Point of Sale (POS) system built with Next.js 16, PostgreSQL, and TypeScript for optical store management.

## Features

- ✅ **User Management** - User registration, authentication, and role management
- ✅ **Product Management** - Product inventory with stock tracking and low stock alerts
- ✅ **Invoice System** - Create, manage, and track invoices with payment handling
- ✅ **Reports & Analytics** - Income reports with date range filtering
- ✅ **JWT Authentication** - Secure user authentication
- ✅ **SHA-256 Password Hashing** - Secure password storage
- ✅ **Modern UI** - Beautiful, responsive design with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: JWT (JSON Web Tokens)
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/OpticalPOS.git
cd OpticalPOS
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env.local` file in the root directory:
```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h
```

4. Setup database:
```bash
pnpm setup-db
```

5. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
my-app/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── users/        # User management endpoints
│   │   ├── products/     # Product management endpoints
│   │   ├── invoices/    # Invoice endpoints
│   │   └── reports/      # Reports endpoints
│   ├── components/       # React components
│   └── [pages]/          # Next.js pages
├── lib/
│   ├── config/           # Configuration files
│   ├── db/               # Database utilities
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
└── scripts/              # Database setup scripts
```

## Environment Variables

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string (required)
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - JWT token expiration time (default: 1h)

## Database Schema

The application uses the following main tables:

- `users` - User accounts
- `products` - Product inventory
- `invoice` - Invoice records
- `inv_has_product` - Invoice items

Run `pnpm setup-db` to create all tables.

## Deployment

### Vercel Deployment

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment instructions.

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## License

Private project
