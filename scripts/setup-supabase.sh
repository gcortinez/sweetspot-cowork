#!/bin/bash

# SweetSpot Cowork - Supabase Setup Script
# This script helps set up the Supabase environment for development

set -e

echo "🏢 SweetSpot Cowork - Supabase Setup"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_status "Dependencies check passed"
}

# Generate random secrets
generate_secrets() {
    print_info "Generating secure secrets..."
    
    JWT_SECRET=$(openssl rand -base64 32)
    SESSION_SECRET=$(openssl rand -base64 32)
    
    print_status "Secrets generated"
}

# Create environment files
create_env_files() {
    print_info "Creating environment files..."
    
    # Backend .env
    if [ ! -f "apps/backend/.env" ]; then
        cp "apps/backend/.env.example" "apps/backend/.env"
        
        # Replace secrets in backend .env
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/\[your-jwt-secret\]/$JWT_SECRET/g" "apps/backend/.env"
            sed -i '' "s/\[your-session-secret\]/$SESSION_SECRET/g" "apps/backend/.env"
        else
            # Linux
            sed -i "s/\[your-jwt-secret\]/$JWT_SECRET/g" "apps/backend/.env"
            sed -i "s/\[your-session-secret\]/$SESSION_SECRET/g" "apps/backend/.env"
        fi
        
        print_status "Backend .env file created"
    else
        print_warning "Backend .env file already exists, skipping..."
    fi
    
    # Frontend .env.local
    if [ ! -f "apps/frontend/.env.local" ]; then
        cp "apps/frontend/.env.example" "apps/frontend/.env.local"
        print_status "Frontend .env.local file created"
    else
        print_warning "Frontend .env.local file already exists, skipping..."
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    npm install
    
    print_status "Dependencies installed"
}

# Build shared package
build_shared() {
    print_info "Building shared package..."
    
    cd packages/shared
    npm run build
    cd ../..
    
    print_status "Shared package built"
}

# Generate Prisma client
generate_prisma() {
    print_info "Generating Prisma client..."
    
    cd apps/backend
    npm run db:generate
    cd ../..
    
    print_status "Prisma client generated"
}

# Main setup function
main() {
    echo "Starting Supabase setup for SweetSpot Cowork..."
    echo ""
    
    check_dependencies
    generate_secrets
    create_env_files
    install_dependencies
    build_shared
    generate_prisma
    
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    print_info "Next steps:"
    echo "1. Create a Supabase project at https://app.supabase.com"
    echo "2. Copy your Supabase credentials to the .env files:"
    echo "   - apps/backend/.env"
    echo "   - apps/frontend/.env.local"
    echo "3. Run 'npm run db:push' to push the schema to Supabase"
    echo "4. Run 'npm run dev' to start the development servers"
    echo ""
    print_info "For detailed instructions, see docs/SUPABASE_SETUP.md"
}

# Run main function
main 