/**
 * Development Auth Bypass Example
 * 
 * This shows how to create a development-only bypass for authentication
 * when testing without Supabase Auth. This should NEVER be used in production.
 */

// Example modification for AuthService.login method (development only)
const developmentBypass = {
  // Add this flag to your .env.local for development
  ENABLE_AUTH_BYPASS: process.env.NODE_ENV === 'development' && process.env.ENABLE_AUTH_BYPASS === 'true',
  
  // Known test credentials that bypass Supabase
  TEST_CREDENTIALS: {
    'superadmin@sweetspot.com': 'SuperAdmin123!',
    'gcortinez@getsweetspot.io': '123456',
    'test@example.com': 'password123'
  },

  /**
   * Check if credentials should bypass Supabase Auth
   */
  shouldBypass(email, password) {
    if (!this.ENABLE_AUTH_BYPASS) return false;
    return this.TEST_CREDENTIALS[email] === password;
  },

  /**
   * Create a mock auth response for development
   */
  createMockAuthData(email) {
    return {
      user: {
        id: `mock-${Date.now()}`,
        email: email,
        email_confirmed_at: new Date().toISOString()
      },
      session: {
        access_token: `mock-token-${Date.now()}`,
        refresh_token: `mock-refresh-${Date.now()}`,
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer'
      }
    };
  }
};

// Example usage in AuthService.login method:
/*
static async login(email, password, tenantSlug) {
  try {
    let authData;
    let authError = null;

    // Development bypass check
    if (developmentBypass.shouldBypass(email, password)) {
      console.log('🔧 Development: Using auth bypass for', email);
      authData = developmentBypass.createMockAuthData(email);
    } else {
      // Normal Supabase authentication
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });
      authData = data;
      authError = error;
    }

    if (authError || !authData.user) {
      // ... existing error handling
    }

    // ... rest of the method remains the same
  } catch (error) {
    // ... existing error handling
  }
}
*/

console.log('📝 Auth Bypass Example');
console.log('This file shows how to implement a development-only auth bypass.');
console.log('Add ENABLE_AUTH_BYPASS=true to .env.local to activate (development only).');

module.exports = developmentBypass;