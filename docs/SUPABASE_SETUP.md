# Supabase Setup Guide for SweetSpot Cowork

This guide will help you set up Supabase for the SweetSpot Cowork multi-tenant SaaS platform.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Node.js 18+ installed
- A Supabase account

## 1. Create a New Supabase Project

### Option A: Using Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `sweetspot-cowork-dev` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### Option B: Using Supabase CLI
```bash
# Login to Supabase
supabase login

# Create a new project
supabase projects create sweetspot-cowork-dev --org-id YOUR_ORG_ID
```

## 2. Configure Environment Variables

### Backend (.env)
Copy `apps/backend/.env.example` to `apps/backend/.env` and fill in the values:

```bash
# Get these from your Supabase project settings
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
SUPABASE_URL="https://[project-ref].supabase.co"
SUPABASE_ANON_KEY="[your-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[your-service-role-key]"

# Generate these
JWT_SECRET="your-super-secret-jwt-key-here"
SESSION_SECRET="your-super-secret-session-key-here"
```

### Frontend (.env.local)
Copy `apps/frontend/.env.example` to `apps/frontend/.env.local` and fill in the values:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001"
```

## 3. Find Your Supabase Credentials

1. Go to your project in the Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`

4. Navigate to **Settings** → **Database**
5. Copy the **Connection string** → `DATABASE_URL` and `DIRECT_URL`
   - Replace `[YOUR-PASSWORD]` with your database password

## 4. Initialize Supabase Locally (Optional)

For local development with Supabase local instance:

```bash
# Initialize Supabase in your project
supabase init

# Start local Supabase (requires Docker)
supabase start

# This will give you local URLs and keys to use in development
```

## 5. Set Up Database Schema

### Option A: Using Prisma (Recommended)
```bash
# Navigate to backend
cd apps/backend

# Generate Prisma client
npm run db:generate

# Push schema to Supabase
npm run db:push
```

### Option B: Using Supabase Migrations
```bash
# Create migration from Prisma schema
npx prisma migrate dev --name init

# Apply migration to Supabase
supabase db push
```

## 6. Configure Authentication

### Enable Email Authentication
1. Go to **Authentication** → **Settings** in Supabase Dashboard
2. Under **Auth Providers**, ensure **Email** is enabled
3. Configure email templates if needed

### Set Up Row Level Security (RLS)
The database schema includes RLS policies for multi-tenant isolation. These will be applied when you push the schema.

### Configure Auth Settings
1. **Site URL**: Set to your frontend URL (e.g., `http://localhost:3000`)
2. **Redirect URLs**: Add your auth callback URLs
3. **JWT Settings**: Default settings should work

## 7. Set Up Storage (Optional)

If you need file uploads:

1. Go to **Storage** in Supabase Dashboard
2. Create buckets as needed:
   - `avatars` - User profile pictures
   - `documents` - Contract documents
   - `logos` - Tenant logos

## 8. Configure Realtime (Optional)

For real-time features:

1. Go to **Database** → **Replication** in Supabase Dashboard
2. Enable replication for tables that need real-time updates:
   - `bookings` - Real-time booking updates
   - `access_logs` - Live access monitoring

## 9. Test the Connection

Run the following to test your setup:

```bash
# Test backend connection
cd apps/backend
npm run dev

# Test frontend connection (in another terminal)
cd apps/frontend
npm run dev
```

## 10. Production Setup

For production deployment:

1. Create a production Supabase project
2. Set up environment variables in your deployment platform
3. Configure custom domain (optional)
4. Set up monitoring and alerts
5. Configure backup policies

## Environment Variables Reference

### Required for Backend
- `DATABASE_URL` - Postgres connection string
- `DIRECT_URL` - Direct Postgres connection (same as DATABASE_URL for Supabase)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (keep secret!)

### Required for Frontend
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
- `NEXT_PUBLIC_API_BASE_URL` - Your backend API URL

## Troubleshooting

### Common Issues

1. **Connection refused**: Check if your IP is allowed in Supabase network restrictions
2. **Invalid JWT**: Ensure JWT_SECRET matches between backend and Supabase
3. **RLS errors**: Make sure RLS policies are properly configured
4. **CORS errors**: Check allowed origins in Supabase auth settings

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## Next Steps

After completing this setup:

1. Run the database migrations
2. Set up Row Level Security policies
3. Configure authentication flows
4. Test multi-tenant isolation
5. Set up monitoring and logging 