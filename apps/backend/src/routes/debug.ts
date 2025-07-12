import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";

const router = Router();

// Debug endpoint to test tenant queries
router.get("/test-tenant-query", async (req, res) => {
  const tenantId = req.query.tenantId || "cmc4e452q0000e6c2roj7mmpg";
  
  console.log("[DEBUG] Testing tenant query for ID:", tenantId);
  
  try {
    // Test 1: Simple query
    const { data: test1, error: error1 } = await supabaseAdmin
      .from("tenants")
      .select("*");
      
    console.log("[DEBUG] Test 1 - All tenants:", { count: test1?.length || 0, error: error1?.message });
    
    // Test 2: Specific tenant
    const { data: test2, error: error2 } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .eq("id", tenantId);
      
    console.log("[DEBUG] Test 2 - Specific tenant:", { count: test2?.length || 0, error: error2?.message });
    
    // Test 3: Using single()
    const { data: test3, error: error3 } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();
      
    console.log("[DEBUG] Test 3 - With single():", { found: !!test3, error: error3?.message });
    
    res.json({
      tenantId,
      tests: {
        allTenants: {
          count: test1?.length || 0,
          error: error1?.message,
          data: test1,
        },
        specificTenant: {
          count: test2?.length || 0,
          error: error2?.message,
          data: test2,
        },
        withSingle: {
          found: !!test3,
          error: error3?.message,
          data: test3,
        },
      },
      supabaseConfig: {
        url: process.env.SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
      },
    });
  } catch (error: any) {
    console.error("[DEBUG] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;