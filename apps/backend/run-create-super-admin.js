// Direct execution of create-super-admin script
require('dotenv').config();
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

// Run the TypeScript file
require('./src/scripts/create-super-admin.ts');