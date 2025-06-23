#!/usr/bin/env node

// Alternative execution script for create-super-admin
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Super Admin creation script...');
console.log('Working directory:', process.cwd());

// Method 1: Try using npm run
console.log('\nAttempting Method 1: npm run script:create-super-admin');
const npm = spawn('npm', ['run', 'script:create-super-admin'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

npm.on('error', (error) => {
  console.error('npm run failed:', error.message);
  
  // Method 2: Try direct node execution
  console.log('\nAttempting Method 2: Direct node execution');
  const node = spawn('node', ['run-create-super-admin.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });
  
  node.on('error', (error2) => {
    console.error('Direct node execution failed:', error2.message);
    
    // Method 3: Try npx ts-node
    console.log('\nAttempting Method 3: npx ts-node');
    const npx = spawn('npx', ['ts-node', 'src/scripts/create-super-admin.ts'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });
    
    npx.on('error', (error3) => {
      console.error('npx ts-node failed:', error3.message);
      process.exit(1);
    });
    
    npx.on('close', (code) => {
      console.log(`\nScript completed with code ${code}`);
      process.exit(code);
    });
  });
  
  node.on('close', (code) => {
    if (code !== 0) {
      // Try method 3
      console.log('\nAttempting Method 3: npx ts-node');
      const npx = spawn('npx', ['ts-node', 'src/scripts/create-super-admin.ts'], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
      });
      
      npx.on('error', (error3) => {
        console.error('npx ts-node failed:', error3.message);
        process.exit(1);
      });
      
      npx.on('close', (code2) => {
        console.log(`\nScript completed with code ${code2}`);
        process.exit(code2);
      });
    } else {
      console.log(`\nScript completed with code ${code}`);
      process.exit(code);
    }
  });
});

npm.on('close', (code) => {
  console.log(`\nScript completed with code ${code}`);
  process.exit(code);
});