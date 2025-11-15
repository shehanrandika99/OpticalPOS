# My App - Production-Ready Next.js Application

This is a [Next.js](https://nextjs.org) project with production-ready database connectivity to Neon PostgreSQL.

## Features

- ✅ Production-ready database connection pooling
- ✅ Environment variable validation
- ✅ Structured logging system
- ✅ Type-safe TypeScript implementation
- ✅ Proper error handling and sanitization
- ✅ Security best practices
- ✅ Connection timeout handling
- ✅ Database connection monitoring

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your database connection string:
```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require&channel_binding=require
NODE_ENV=development
```

### Environment Variables

Required environment variables (see `.env.example` for full list):

- `DATABASE_URL` - PostgreSQL connection string (required)
- `NODE_ENV` - Environment: development, production, or test
- `DB_POOL_MAX` - Maximum pool connections (default: 20)
- `DB_POOL_MIN` - Minimum pool connections (default: 2)
- `DB_POOL_IDLE_TIMEOUT` - Idle timeout in ms (default: 30000)
- `DB_POOL_CONNECTION_TIMEOUT` - Connection timeout in ms (default: 10000)

### Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Production Build

```bash
pnpm build
pnpm start
```

## Project Structure

```
my-app/
├── app/
│   ├── api/
│   │   └── test-db/          # Database test API endpoint
│   ├── components/
│   │   └── DBTest.tsx        # Database connection test component
│   └── page.tsx              # Home page
├── lib/
│   ├── config/
│   │   └── env.ts            # Environment variable validation
│   ├── db/
│   │   └── index.ts          # Database connection pool & utilities
│   ├── types/
│   │   └── database.ts       # Database TypeScript types
│   └── utils/
│       └── logger.ts          # Centralized logging utility
└── .env.local                 # Environment variables (not in git)
```

## Database Connection

The application uses a connection pool for efficient database management:

- **Connection Pooling**: Configurable min/max connections
- **SSL/TLS**: Secure connections with proper certificate validation
- **Error Handling**: Comprehensive error handling with logging
- **Monitoring**: Pool statistics and connection health checks

### Testing Database Connection

1. Visit the home page
2. Click "Test Connection" button
3. View connection status and server timestamp

Or test via API:
```bash
curl http://localhost:3000/api/test-db
```

## Production Considerations

### Security

- Environment variables are validated at startup
- Error messages are sanitized in production
- SSL connections are enforced in production
- Sensitive error details are not exposed to clients

### Performance

- Connection pooling reduces overhead
- Query timeouts prevent hanging requests
- Proper connection lifecycle management
- Pool statistics for monitoring

### Monitoring

- Structured logging with timestamps
- Error tracking with context
- Connection pool statistics
- Query performance metrics

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Node.js Driver](https://node-postgres.com/)
- [Neon Database](https://neon.tech/)

## License

Private project
