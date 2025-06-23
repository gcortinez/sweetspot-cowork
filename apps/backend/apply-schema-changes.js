#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Applying schema changes to make tenantId optional for Super Admins...\n');

try {
  // Change to the backend directory
  process.chdir(__dirname);
  
  console.log('1. Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('\n2. Pushing schema changes to database...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  
  console.log('\n✅ Schema changes applied successfully!');
  console.log('🎉 tenantId is now optional for Super Admins');
  
} catch (error) {
  console.error('❌ Error applying schema changes:', error.message);
  process.exit(1);
}