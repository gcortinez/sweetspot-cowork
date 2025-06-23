#!/usr/bin/env node

// Direct execution of the super admin creation logic
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Log environment check
console.log('Environment check:');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set ✓' : 'Missing ✗');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set ✓' : 'Missing ✗');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✓' : 'Missing ✗');

// Check if required modules exist
try {
  require.resolve('@supabase/supabase-js');
  console.log('- @supabase/supabase-js: Found ✓');
} catch(e) {
  console.log('- @supabase/supabase-js: Missing ✗');
  console.error('\nError: Required dependencies are not installed.');
  console.log('Please run: npm install');
  process.exit(1);
}

try {
  require.resolve('@prisma/client');
  console.log('- @prisma/client: Found ✓');
} catch(e) {
  console.log('- @prisma/client: Missing ✗');
  console.error('\nError: Prisma client is not generated.');
  console.log('Please run: npm run db:generate');
  process.exit(1);
}

// Now try to run the script
console.log('\n🚀 Attempting to create Super Admin...\n');

try {
  // Register TypeScript
  require('ts-node').register({
    transpileOnly: true,
    compilerOptions: {
      module: 'commonjs',
      target: 'es2017',
      lib: ['es2017'],
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: false,
      skipLibCheck: true,
      resolveJsonModule: true
    }
  });

  // Execute the TypeScript file
  require('./src/scripts/create-super-admin.ts');
} catch (error) {
  console.error('❌ Error executing script:', error.message);
  
  // If ts-node fails, let's try a more direct approach
  console.log('\n🔄 Trying alternative execution method...\n');
  
  // Try using child_process as fallback
  const { execSync } = require('child_process');
  try {
    execSync('node create-super-admin.js', {
      stdio: 'inherit',
      cwd: __dirname
    });
  } catch (execError) {
    console.error('❌ Alternative execution also failed:', execError.message);
    process.exit(1);
  }
}