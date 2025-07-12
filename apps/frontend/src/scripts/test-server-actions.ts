/**
 * Manual test script for Server Actions
 * Run with: npx tsx src/scripts/test-server-actions.ts
 */

import { loginAction, registerAction, getCurrentSessionAction } from '../lib/actions/auth'
import { validateData, loginSchema } from '../lib/validations'

async function testValidation() {
  console.log('🧪 Testing validation schemas...')
  
  // Test valid login data
  const validLogin = {
    email: 'test@example.com',
    password: 'ValidPassword123!',
    tenantSlug: 'test-workspace',
    rememberMe: false,
  }
  
  const validationResult = validateData(loginSchema, validLogin)
  console.log('✅ Valid login data:', validationResult.success ? 'PASS' : 'FAIL')
  
  // Test invalid login data
  const invalidLogin = {
    email: 'invalid-email',
    password: '',
    tenantSlug: '',
    rememberMe: false,
  }
  
  const invalidValidationResult = validateData(loginSchema, invalidLogin)
  console.log('✅ Invalid login data rejection:', !invalidValidationResult.success ? 'PASS' : 'FAIL')
  
  if (!invalidValidationResult.success) {
    console.log('   Validation errors:', invalidValidationResult.errors.map(e => `${e.field}: ${e.message}`))
  }
}

async function testServerActions() {
  console.log('\n🚀 Testing Server Actions...')
  
  try {
    // Test login with invalid credentials (should fail gracefully)
    console.log('Testing login with invalid credentials...')
    const loginResult = await loginAction({
      email: 'nonexistent@example.com',
      password: 'wrongpassword',
      tenantSlug: 'nonexistent-tenant',
      rememberMe: false,
    })
    
    console.log('✅ Login error handling:', !loginResult.success ? 'PASS' : 'FAIL')
    if (!loginResult.success) {
      console.log('   Error:', loginResult.error)
    }
    
    // Test registration with invalid data (should fail validation)
    console.log('\nTesting registration with invalid data...')
    const registerResult = await registerAction({
      email: 'invalid-email',
      password: 'weak',
      confirmPassword: 'different',
      firstName: '',
      lastName: '',
      tenantSlug: '',
      role: 'END_USER' as any,
      phone: 'invalid-phone',
      acceptTerms: false,
    })
    
    console.log('✅ Registration validation:', !registerResult.success ? 'PASS' : 'FAIL')
    if (!registerResult.success && registerResult.fieldErrors) {
      console.log('   Field errors:', Object.keys(registerResult.fieldErrors).length, 'fields')
    }
    
    // Test session without authentication
    console.log('\nTesting session retrieval without authentication...')
    const sessionResult = await getCurrentSessionAction()
    
    console.log('✅ Unauthenticated session:', !sessionResult.authenticated ? 'PASS' : 'FAIL')
    
  } catch (error) {
    console.error('❌ Server Actions test failed:', error)
  }
}

async function testEnvironment() {
  console.log('\n🔧 Testing environment configuration...')
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length === 0) {
    console.log('✅ All required environment variables are set')
  } else {
    console.log('❌ Missing environment variables:', missingVars.join(', '))
  }
  
  // Test database connection (basic check)
  try {
    const prismaTest = await import('../lib/server/prisma')
    console.log('✅ Prisma client import: PASS')
  } catch (error) {
    console.log('❌ Prisma client import: FAIL')
    console.error('   Error:', error)
  }
}

async function runTests() {
  console.log('🎯 SweetSpot Cowork - Server Actions Test Suite')
  console.log('=' .repeat(50))
  
  await testEnvironment()
  await testValidation()
  await testServerActions()
  
  console.log('\n✨ Test suite completed!')
  console.log('\nNext steps:')
  console.log('1. Set up proper test database for integration tests')
  console.log('2. Create test user and tenant data')
  console.log('3. Run full authentication flow tests')
  console.log('4. Test middleware with actual routes')
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error)
}

export { runTests }