#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

console.log('=== SweetSpot Backend Environment Diagnostic ===\n');

async function diagnose() {
  // 1. Check current directory
  console.log('1. Current Directory:');
  console.log('   -', process.cwd());
  
  // 2. Check Node.js version
  console.log('\n2. Node.js Version:');
  console.log('   -', process.version);
  
  // 3. Check if npm is available
  console.log('\n3. Package Manager:');
  try {
    const { stdout: npmVersion } = await execPromise('npm --version');
    console.log('   - npm version:', npmVersion.trim());
  } catch (e) {
    console.log('   - npm: Not found ✗');
  }
  
  // 4. Check for node_modules
  console.log('\n4. Dependencies:');
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('   - node_modules: Exists ✓');
    
    // Check specific dependencies
    const deps = ['@supabase/supabase-js', '@prisma/client', 'ts-node', 'typescript'];
    deps.forEach(dep => {
      const depPath = path.join(nodeModulesPath, dep);
      if (fs.existsSync(depPath)) {
        console.log(`   - ${dep}: Installed ✓`);
      } else {
        console.log(`   - ${dep}: Missing ✗`);
      }
    });
  } else {
    console.log('   - node_modules: Missing ✗');
    console.log('   ⚠️  Run "npm install" to install dependencies');
  }
  
  // 5. Check for .env file
  console.log('\n5. Environment Files:');
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    console.log('   - .env: Found ✓');
    
    // Load and check critical env vars
    require('dotenv').config({ path: envPath });
    const criticalVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'DATABASE_URL'];
    criticalVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`   - ${varName}: Set ✓`);
      } else {
        console.log(`   - ${varName}: Missing ✗`);
      }
    });
  } else {
    console.log('   - .env: Missing ✗');
  }
  
  // 6. Check Prisma
  console.log('\n6. Prisma Status:');
  const prismaSchemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  if (fs.existsSync(prismaSchemaPath)) {
    console.log('   - schema.prisma: Found ✓');
  } else {
    console.log('   - schema.prisma: Missing ✗');
  }
  
  const prismaClientPath = path.join(nodeModulesPath, '.prisma', 'client');
  if (fs.existsSync(prismaClientPath)) {
    console.log('   - Prisma Client: Generated ✓');
  } else {
    console.log('   - Prisma Client: Not generated ✗');
    console.log('   ⚠️  Run "npm run db:generate" to generate Prisma client');
  }
  
  // 7. Check TypeScript
  console.log('\n7. TypeScript Configuration:');
  const tsconfigPath = path.join(__dirname, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    console.log('   - tsconfig.json: Found ✓');
  } else {
    console.log('   - tsconfig.json: Missing ✗');
  }
  
  // 8. Try to check if backend server is running
  console.log('\n8. Backend Server Status:');
  try {
    const http = require('http');
    const port = process.env.PORT || 3001;
    
    await new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${port}/health`, (res) => {
        if (res.statusCode === 200) {
          console.log(`   - Server is running on port ${port} ✓`);
        } else {
          console.log(`   - Server responded with status ${res.statusCode}`);
        }
        resolve();
      });
      
      req.on('error', () => {
        console.log(`   - Server is not running on port ${port} ✗`);
        resolve();
      });
      
      req.setTimeout(2000, () => {
        req.destroy();
        console.log(`   - Server is not responding on port ${port} ✗`);
        resolve();
      });
    });
  } catch (e) {
    console.log('   - Could not check server status');
  }
  
  // Summary
  console.log('\n=== Summary ===');
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('\n⚠️  Dependencies are not installed!');
    console.log('   Run: npm install');
  }
  
  if (!fs.existsSync(prismaClientPath) && fs.existsSync(nodeModulesPath)) {
    console.log('\n⚠️  Prisma client is not generated!');
    console.log('   Run: npm run db:generate');
  }
  
  console.log('\nTo create the super admin, you need to:');
  console.log('1. Ensure all dependencies are installed: npm install');
  console.log('2. Generate Prisma client: npm run db:generate');
  console.log('3. Run the script: npm run script:create-super-admin');
  console.log('   OR: node create-super-admin.js');
  console.log('   OR: node run-create-super-admin.js');
}

diagnose().catch(console.error);