import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Initialize Prisma Client
const prisma = new PrismaClient();

async function checkUserAndTenant() {
  const email = "gcortinez@gmail.com";
  const tenantId = "cmc4e452q0000e6c2roj7mmpg";

  console.log("🔍 Checking user and tenant issue");
  console.log("Email:", email);
  console.log("Expected Tenant ID:", tenantId);
  console.log("================================================================================");

  try {
    // 1. Check user via Prisma
    console.log("\n1️⃣ Checking user via Prisma:");
    const prismaUser = await prisma.user.findFirst({
      where: { email },
    });

    if (prismaUser) {
      console.log("✅ User found via Prisma:");
      console.log({
        id: prismaUser.id,
        email: prismaUser.email,
        tenantId: prismaUser.tenantId,
        role: prismaUser.role,
        status: prismaUser.status,
      });
      
      // If user has tenant, fetch it separately
      if (prismaUser.tenantId) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: prismaUser.tenantId },
        });
        if (tenant) {
          console.log("Associated tenant:", {
            id: tenant.id,
            name: tenant.name,
            status: tenant.status,
          });
        }
      }
    } else {
      console.log("❌ User not found via Prisma");
    }

    // 2. Check user via Supabase
    console.log("\n2️⃣ Checking user via Supabase:");
    const { data: supabaseUsers, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email);

    if (userError) {
      console.log("❌ Error querying users:", userError.message);
    } else if (supabaseUsers && supabaseUsers.length > 0) {
      console.log("✅ User found via Supabase:");
      console.log(supabaseUsers[0]);
    } else {
      console.log("❌ User not found via Supabase");
    }

    // 3. Check tenant via Prisma
    console.log("\n3️⃣ Checking tenant via Prisma:");
    const prismaTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (prismaTenant) {
      console.log("✅ Tenant found via Prisma:");
      console.log({
        id: prismaTenant.id,
        name: prismaTenant.name,
        status: prismaTenant.status,
        createdAt: prismaTenant.createdAt,
      });
    } else {
      console.log("❌ Tenant not found via Prisma");
    }

    // 4. Check tenant via Supabase
    console.log("\n4️⃣ Checking tenant via Supabase:");
    const { data: supabaseTenants, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .eq("id", tenantId);

    if (tenantError) {
      console.log("❌ Error querying tenants:", tenantError.message);
    } else if (supabaseTenants && supabaseTenants.length > 0) {
      console.log("✅ Tenant found via Supabase:");
      console.log(supabaseTenants[0]);
    } else {
      console.log("❌ Tenant not found via Supabase");
    }

    // 5. List all tenants to see what's available
    console.log("\n5️⃣ Listing all tenants:");
    const allTenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        _count: {
          select: { users: true },
        },
      },
    });

    console.log(`Found ${allTenants.length} tenants:`);
    allTenants.forEach((tenant) => {
      console.log(`  - ${tenant.id}: ${tenant.name} (${tenant.status}) - ${tenant._count.users} users`);
    });

    // 6. Check all users with the given email domain
    console.log("\n6️⃣ Checking all users with @gmail.com domain:");
    const gmailUsers = await prisma.user.findMany({
      where: {
        email: {
          endsWith: "@gmail.com",
        },
      },
      select: {
        id: true,
        email: true,
        tenantId: true,
        role: true,
        status: true,
      },
    });

    console.log(`Found ${gmailUsers.length} Gmail users:`);
    gmailUsers.forEach((user) => {
      console.log(`  - ${user.email} (${user.role}) - Tenant: ${user.tenantId || "None"}`);
    });

  } catch (error) {
    console.error("❌ Error during check:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAndTenant().catch(console.error);