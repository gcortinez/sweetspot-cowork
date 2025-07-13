#!/usr/bin/env node

// Simple test script to check if our auth endpoints are working
const fetch = require('node-fetch');

async function testAuth() {
  const baseUrl = 'http://localhost:3002';
  
  console.log('🧪 Testing authentication endpoints...');
  
  try {
    // Test 1: Landing page
    console.log('1. Testing landing page...');
    const landingResponse = await fetch(`${baseUrl}/`);
    console.log(`   Status: ${landingResponse.status}`);
    
    // Test 2: Login page
    console.log('2. Testing login page...');
    const loginResponse = await fetch(`${baseUrl}/auth/login`);
    console.log(`   Status: ${loginResponse.status}`);
    
    // Test 3: Dashboard page (should redirect)
    console.log('3. Testing dashboard page...');
    const dashboardResponse = await fetch(`${baseUrl}/dashboard`, { redirect: 'manual' });
    console.log(`   Status: ${dashboardResponse.status}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(dashboardResponse.headers))}`);
    
    // Test 4: API health check
    console.log('4. Testing API health...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    console.log(`   Status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   Response: ${JSON.stringify(healthData)}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth();