#!/bin/bash

# Script to generate secure random keys for your .env file

echo "Generating secure keys for your environment variables..."
echo ""

# Generate NEXTAUTH_SECRET (32+ characters)
echo "NEXTAUTH_SECRET:"
openssl rand -base64 32
echo ""

# Generate JWT_SECRET
echo "JWT_SECRET:"
openssl rand -base64 32
echo ""

# Generate ENCRYPTION_KEY (exactly 32 characters for AES-256)
echo "ENCRYPTION_KEY (32 chars):"
openssl rand -hex 16
echo ""

echo "Copy these values to your .env.local file"
echo "IMPORTANT: Never commit these keys to version control!"