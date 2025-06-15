import { supabaseAdmin } from '../lib/supabase.js';

async function createBypassLogin() {
  try {
    console.log('🔧 Creating bypass login endpoint...\n');
    
    // First, let's verify our data exists
    console.log('📊 Checking current data...');
    
    const { data: tenants } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('slug', 'sweetspot-hq');
      
    console.log('Tenants found:', tenants?.length || 0);
    if (tenants && tenants.length > 0) {
      console.log('Tenant:', tenants[0]);
    }
    
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'admin@sweetspot.io');
      
    console.log('\nUsers found:', users?.length || 0);
    if (users && users.length > 0) {
      console.log('User:', {
        id: users[0].id,
        email: users[0].email,
        role: users[0].role,
        tenantId: users[0].tenantId
      });
    }
    
    // Create a temporary API endpoint file
    const bypassEndpoint = `
// Temporary bypass login endpoint for debugging
router.post("/bypass-login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (email === "admin@sweetspot.io" && password === "Admin123!") {
      // Hardcoded response for testing
      const response = {
        success: true,
        user: {
          id: "${users?.[0]?.id || 'user_temp'}",
          email: "admin@sweetspot.io",
          tenantId: "${users?.[0]?.tenantId || 'tenant_temp'}",
          role: "SUPER_ADMIN",
          clientId: null
        },
        accessToken: "bypass_token_${Date.now()}",
        refreshToken: "bypass_refresh_${Date.now()}",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        tenant: {
          id: "${tenants?.[0]?.id || 'tenant_temp'}",
          name: "SweetSpot HQ",
          slug: "sweetspot-hq"
        }
      };
      
      return res.json(response);
    }
    
    return res.status(401).json({
      success: false,
      error: "Invalid credentials"
    });
  } catch (error) {
    console.error("Bypass login error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
`;

    console.log('\n📝 Add this endpoint to your auth routes:');
    console.log('=====================================');
    console.log(bypassEndpoint);
    console.log('=====================================');
    
    console.log('\n📋 Then update your frontend to use:');
    console.log('   Endpoint: /api/auth/bypass-login');
    console.log('   Email: admin@sweetspot.io');
    console.log('   Password: Admin123!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createBypassLogin();