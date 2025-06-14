# Supabase Setup Guide

This guide will help you set up Supabase for the SweetSpot Cowork backend.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed
- The SweetSpot project cloned locally

## Step 1: Create a Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `sweetspot-cowork` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
5. Click "Create new project"
6. Wait for the project to be created (this takes a few minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings > API**
2. You'll see several important values:

### Project URL
- Copy the **Project URL** (e.g., `https://abcdefghijk.supabase.co`)

### API Keys
- **anon public**: This is safe to use in frontend code
- **service_role secret**: This has admin access - keep it secret!

## Step 3: Configure Environment Variables

1. Navigate to your backend directory:
   ```bash
   cd apps/backend
   ```

2. Update the `.env.local` file with your actual credentials:
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://your-actual-project-id.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-anon-key
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-service-role-key

   # Server Configuration
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000

   # JWT Configuration (for Supabase)
   JWT_SECRET=your-jwt-secret-here

   # Database Configuration (for Prisma)
   DATABASE_URL=postgresql://postgres:your-db-password@db.your-project-id.supabase.co:5432/postgres
   ```

3. Replace the placeholder values with your actual Supabase credentials:
   - `your-actual-project-id`: Your project reference from the URL
   - `your-actual-anon-key`: The anon public key from Settings > API
   - `your-actual-service-role-key`: The service_role secret key from Settings > API
   - `your-db-password`: The database password you set when creating the project

## Step 4: Test the Connection

1. Check your environment setup:
   ```bash
   npx tsx src/scripts/check-env.ts
   ```

2. If the environment check passes, test the Supabase connection:
   ```bash
   npx tsx src/scripts/test-supabase-connection.ts
   ```

## Step 5: Set Up the Database Schema

1. Push the Prisma schema to Supabase:
   ```bash
   npm run db:push
   ```

2. Run the RLS (Row Level Security) migration:
   ```bash
   # Copy the SQL from apps/backend/prisma/migrations/001_enable_rls.sql
   # and run it in the Supabase SQL Editor
   ```

   Or run it directly if you have the Supabase CLI:
   ```bash
   supabase db reset
   ```

## Step 6: Verify Everything Works

1. Test the tenant functionality:
   ```bash
   npx tsx src/scripts/test-tenant.ts
   ```

2. Start the backend server:
   ```bash
   npm run dev
   ```

3. Test the health endpoint:
   ```bash
   curl http://localhost:3001/health
   ```

## Troubleshooting

### Common Issues

#### "Missing SUPABASE_URL environment variable"
- Make sure your `.env.local` file is in the `apps/backend` directory
- Check that the environment variables don't have placeholder values
- Restart your terminal/IDE after updating the file

#### "relation 'tenants' does not exist"
- Run `npm run db:push` to create the database tables
- Make sure your DATABASE_URL is correct

#### "RLS policy violation"
- Run the RLS migration from `apps/backend/prisma/migrations/001_enable_rls.sql`
- Check that the policies are created in the Supabase dashboard

#### Connection timeout or network errors
- Check your internet connection
- Verify the SUPABASE_URL is correct
- Make sure your Supabase project is active (not paused)

### Getting Help

If you encounter issues:

1. Check the Supabase project logs in the dashboard
2. Verify your API keys haven't expired
3. Make sure your project isn't paused (free tier projects pause after inactivity)
4. Check the [Supabase documentation](https://supabase.com/docs)

## Security Notes

- **Never commit your `.env.local` file to version control**
- The service_role key has admin access - keep it secret
- Use the anon key for frontend applications
- Consider using environment-specific projects (dev, staging, prod)

## Next Steps

Once Supabase is set up:

1. Test the tenant management API endpoints
2. Set up the frontend Supabase client
3. Implement authentication flows
4. Deploy to your hosting platform

---

For more information, see the [Supabase documentation](https://supabase.com/docs) and the project's main README. 