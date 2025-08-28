#!/bin/bash

echo "🚀 Setting up Development Database Environment"
echo "=============================================="

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Creating backup..."
    cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup created"
fi

echo ""
echo "📝 Please provide your new Supabase project details:"
echo ""

# Collect Supabase information
read -p "🔸 Project URL (https://xxx.supabase.co): " SUPABASE_URL
read -p "🔸 Anon Key: " SUPABASE_ANON_KEY
read -s -p "🔸 Service Role Key: " SUPABASE_SERVICE_KEY
echo ""
read -p "🔸 Database Host (db.xxx.supabase.co): " DB_HOST
read -p "🔸 Database Username (postgres.xxx): " DB_USERNAME
read -s -p "🔸 Database Password: " DB_PASSWORD
echo ""

# Construct database URLs
DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:5432/postgres"

echo ""
echo "🔧 Creating .env.local file..."

# Create .env.local file
cat > .env.local << EOF
# ============================================
# SweetSpot Cowork - Development Environment
# ============================================

# Database Configuration (Development)
DATABASE_URL="${DATABASE_URL}"
DIRECT_URL="${DIRECT_URL}"

# Supabase Configuration (Development)
NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_KEY}"

# Clerk Configuration (Use test/development keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_bWlnaHR5LXRlYWwtOC5jbGVyay5hY2NvdW50cy5kZXYk"
CLERK_SECRET_KEY="sk_test_uTGITDsbrQEDbVr5Jnx9oXujsgBcFWxsxn8bGGQnLS"

# Application Configuration
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"

# Security (Generate new keys for development)
JWT_SECRET="$(openssl rand -base64 32)"
ENCRYPTION_KEY="$(openssl rand -base64 32 | head -c 32)"

# Email Configuration (Optional for development)
# RESEND_API_KEY="re_your_dev_api_key"
# FROM_EMAIL="dev@yourdomain.com"

# File Upload Configuration
UPLOAD_MAX_SIZE="52428800"
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/webp,application/pdf"

# Development Blob Storage (Optional)
# BLOB_READ_WRITE_TOKEN="your_dev_blob_token"

# Rate Limiting (Relaxed for development)
RATE_LIMIT_REQUESTS_PER_HOUR="10000"
RATE_LIMIT_REQUESTS_PER_MINUTE="1000"

# Logging
LOG_LEVEL="debug"

# Testing Configuration
TEST_TENANT_ID="dev-tenant-001"
TEST_CLIENT_ID="dev-client-001"
EOF

echo "✅ .env.local file created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Run: npm run db:push (to create database schema)"
echo "2. Run: npm run db:seed (to populate with initial data)"
echo "3. Run: npm run dev (to start development server)"
echo ""
echo "🔍 Database URLs created:"
echo "   - DATABASE_URL: ${DATABASE_URL}"
echo "   - DIRECT_URL: ${DIRECT_URL}"
echo ""
echo "🎉 Development environment setup complete!"