#!/usr/bin/env node

// This is a simple wrapper to run the TypeScript create-super-admin script
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Super Admin creation process...\n');

try {
  // Change to the backend directory
  process.chdir(__dirname);
  
  // Run the TypeScript script
  execSync('npx ts-node src/scripts/create-super-admin.ts', {
    stdio: 'inherit',
    env: process.env
  });
} catch (error) {
  console.error('❌ Error running script:', error.message);
  process.exit(1);
}