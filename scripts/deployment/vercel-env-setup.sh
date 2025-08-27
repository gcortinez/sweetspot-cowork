#!/bin/bash

echo "🔧 Setting up Vercel Production Environment Variables..."

# Check if required environment variables are set
if [ -z "$CLERK_SECRET_KEY" ]; then
    echo "❌ Error: CLERK_SECRET_KEY environment variable is required"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ]; then
    echo "❌ Error: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable is required"
    exit 1
fi

# Set NODE_ENV to production
echo "1. Setting NODE_ENV to production..."
npx vercel env rm NODE_ENV production --yes 2>/dev/null || true
npx vercel env add NODE_ENV production "production"

# Set Clerk keys
echo "2. Setting Clerk environment variables..."
npx vercel env rm CLERK_SECRET_KEY production --yes 2>/dev/null || true
npx vercel env add CLERK_SECRET_KEY production "$CLERK_SECRET_KEY"

npx vercel env rm NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production --yes 2>/dev/null || true
npx vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"

# Set database URLs
echo "3. Setting database URLs..."
npx vercel env rm DATABASE_URL production --yes 2>/dev/null || true
npx vercel env add DATABASE_URL production "postgresql://postgres.qyozasdgumobhlwfdihh:ECKczIisQglln6DP@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

npx vercel env rm DIRECT_URL production --yes 2>/dev/null || true
npx vercel env add DIRECT_URL production "postgresql://postgres.qyozasdgumobhlwfdihh:ECKczIisQglln6DP@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Set app URLs
echo "4. Setting application URLs..."
npx vercel env rm NEXT_PUBLIC_APP_URL production --yes 2>/dev/null || true
npx vercel env add NEXT_PUBLIC_APP_URL production "https://cowork.thesweetspot.cloud"

npx vercel env rm NEXT_PUBLIC_API_BASE_URL production --yes 2>/dev/null || true
npx vercel env add NEXT_PUBLIC_API_BASE_URL production "https://cowork.thesweetspot.cloud"

echo ""
echo "✅ Environment variables configured!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy to production: npx vercel --prod"
echo "2. Test the application"