# Prisma + Supabase Integration Guide

This guide covers different ways to integrate Prisma with Supabase, including connection pooling options and best practices.

## Connection Options

Supabase provides three connection methods for Prisma:

### 1. Transaction Mode Pooler (Recommended)
- **Port**: 6543
- **Best for**: Most applications, serverless functions, high concurrency
- **Connection String Format**: 
  ```
  postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true
  ```

### 2. Session Mode Pooler
- **Port**: 5432 (pooler)
- **Best for**: Applications requiring prepared statements, longer sessions
- **Connection String Format**: 
  ```
  postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
  ```

### 3. Direct Connection
- **Port**: 5432 (direct)
- **Best for**: Migrations, schema operations, development
- **Connection String Format**: 
  ```
  postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
  ```

## Configuration Options

### Option 1: Transaction Pooler + Direct URL (Recommended)

```env
# .env.local
DATABASE_URL=postgresql://postgres.qyozasdgumobhlwfdihh:7TXgSqIgXGmidnMg@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:7TXgSqIgXGmidnMg@db.qyozasdgumobhlwfdihh.supabase.co:5432/postgres
```

**Prisma Schema:**
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Benefits:**
- ✅ Optimal for production applications
- ✅ Handles high concurrency
- ✅ Supports migrations via directUrl
- ✅ Connection pooling for runtime queries

### Option 2: Session Mode Pooler

```env
# .env.local
DATABASE_URL=postgresql://postgres.qyozasdgumobhlwfdihh:7TXgSqIgXGmidnMg@aws-0-us-west-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres:7TXgSqIgXGmidnMg@db.qyozasdgumobhlwfdihh.supabase.co:5432/postgres
```

**Benefits:**
- ✅ Supports prepared statements
- ✅ IPv4 compatible
- ✅ Better for long-running sessions
- ⚠️ Less efficient connection usage

### Option 3: Direct Connection Only (Development)

```env
# .env.local
DATABASE_URL=postgresql://postgres:7TXgSqIgXGmidnMg@db.qyozasdgumobhlwfdihh.supabase.co:5432/postgres
```

**Benefits:**
- ✅ Simple setup
- ✅ Full PostgreSQL feature support
- ❌ Not suitable for production
- ❌ Limited concurrent connections

## Alternative: Prisma Accelerate

For even better performance and global caching, consider Prisma Accelerate:

### Setup Steps:

1. **Install Accelerate Extension:**
   ```bash
   npm install @prisma/extension-accelerate
   ```

2. **Set up in Prisma Console:**
   - Go to https://console.prisma.io
   - Create new project
   - Choose Accelerate
   - Add your Supabase connection string
   - Get Accelerate connection string

3. **Update Environment:**
   ```env
   # Runtime connection (through Accelerate)
   DATABASE_URL=prisma://accelerate.prisma-data.net/?api_key=YOUR_API_KEY
   # Direct connection for migrations
   DIRECT_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
   ```

4. **Update Prisma Client:**
   ```typescript
   import { PrismaClient } from '@prisma/client'
   import { withAccelerate } from '@prisma/extension-accelerate'

   const prisma = new PrismaClient().$extends(withAccelerate())
   ```

5. **Generate Client:**
   ```bash
   npx prisma generate --no-engine
   ```

## Troubleshooting Common Issues

### Issue 1: "Can't reach database server"

**Cause**: Direct connection blocked or network issues

**Solutions:**
1. Use transaction pooler instead of direct connection
2. Check if your network supports IPv6
3. Verify connection string format
4. Use session mode pooler as fallback

### Issue 2: "Too many connections"

**Cause**: Exceeding Supabase connection limits

**Solutions:**
1. Use transaction mode pooler
2. Reduce connection pool size in Prisma
3. Implement connection pooling in your application
4. Consider Prisma Accelerate

### Issue 3: "Prepared statements not supported"

**Cause**: Transaction mode doesn't support prepared statements

**Solutions:**
1. Use session mode pooler
2. Disable prepared statements in Prisma
3. Use direct connection for specific operations

## Best Practices

### For Production Applications:
1. **Always use connection pooling** (Transaction mode recommended)
2. **Set up proper connection limits** in your application
3. **Monitor connection usage** in Supabase dashboard
4. **Use DIRECT_URL for migrations** only
5. **Implement graceful shutdown** to close connections properly

### For Serverless/Edge Functions:
1. **Use transaction mode pooler** for optimal performance
2. **Set connection limit to 1** in Prisma client
3. **Consider Prisma Accelerate** for global edge deployment
4. **Implement connection retry logic**

### For Development:
1. **Direct connection is fine** for local development
2. **Use pooler in staging** to match production
3. **Test migration scripts** with direct connection
4. **Monitor connection usage** during development

## Connection String Examples

Replace these placeholders with your actual values:
- `PROJECT_REF`: Your Supabase project reference (e.g., `qyozasdgumobhlwfdihh`)
- `PASSWORD`: Your database password
- `REGION`: Your Supabase region (e.g., `us-west-1`)

### Transaction Mode (Recommended):
```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Session Mode:
```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
```

### Direct Connection:
```
postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
```

## Performance Considerations

### Transaction Mode Pooler:
- **Pros**: Highest throughput, optimal for serverless, automatic connection management
- **Cons**: No prepared statements, no session-level features
- **Use case**: Most production applications, APIs, serverless functions

### Session Mode Pooler:
- **Pros**: Supports prepared statements, session-level features, IPv4 compatible
- **Cons**: Less efficient connection usage, can lead to connection hoarding
- **Use case**: Applications requiring prepared statements, long-running sessions

### Direct Connection:
- **Pros**: Full PostgreSQL feature support, no limitations
- **Cons**: Limited concurrent connections, not suitable for production scale
- **Use case**: Development, migrations, administrative tasks

## Monitoring and Debugging

1. **Supabase Dashboard**: Monitor connection usage in real-time
2. **Prisma Logs**: Enable query logging for debugging
3. **Connection Metrics**: Track pool utilization and query performance
4. **Error Handling**: Implement proper retry logic for connection failures

## Next Steps

1. Choose the appropriate connection method for your use case
2. Update your environment variables
3. Test the connection with your chosen method
4. Implement proper error handling and monitoring
5. Consider Prisma Accelerate for advanced use cases 