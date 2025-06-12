import { supabaseAdmin, createUserClient } from "./supabase";
import { UserRole } from "@sweetspot/shared";

/**
 * RLS (Row Level Security) utilities for multi-tenant data isolation
 */

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: UserRole;
  clientId?: string;
}

/**
 * Extract tenant context from Supabase user
 */
export const getTenantContext = async (
  accessToken: string
): Promise<TenantContext | null> => {
  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !user) {
      console.error("Error getting user:", error);
      return null;
    }

    // Get user details from our User table
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, tenant_id, role, client_id")
      .eq("supabase_id", user.id)
      .single();

    if (userError || !userRecord) {
      console.error("Error getting user record:", userError);
      return null;
    }

    return {
      tenantId: userRecord.tenant_id,
      userId: userRecord.id,
      role: userRecord.role as UserRole,
      clientId: userRecord.client_id || undefined,
    };
  } catch (error) {
    console.error("Error extracting tenant context:", error);
    return null;
  }
};

/**
 * Create a Supabase client with tenant context for RLS
 */
export const createTenantClient = (
  accessToken: string,
  tenantContext: TenantContext
) => {
  return createUserClient(accessToken);
};

/**
 * Validate that a user has access to a specific tenant
 */
export const validateTenantAccess = (
  userContext: TenantContext,
  targetTenantId: string
): boolean => {
  // Super admins can access any tenant
  if (userContext.role === "SUPER_ADMIN") {
    return true;
  }

  // Other users can only access their own tenant
  return userContext.tenantId === targetTenantId;
};

/**
 * Check if user has admin privileges
 */
export const isAdmin = (role: UserRole): boolean => {
  return ["SUPER_ADMIN", "COWORK_ADMIN"].includes(role);
};

/**
 * Check if user can manage clients
 */
export const canManageClients = (role: UserRole): boolean => {
  return ["SUPER_ADMIN", "COWORK_ADMIN"].includes(role);
};

/**
 * Check if user can manage users
 */
export const canManageUsers = (role: UserRole): boolean => {
  return ["SUPER_ADMIN", "COWORK_ADMIN"].includes(role);
};

/**
 * Check if user can view financial data
 */
export const canViewFinancials = (role: UserRole): boolean => {
  return ["SUPER_ADMIN", "COWORK_ADMIN", "CLIENT_ADMIN"].includes(role);
};

/**
 * Check if user can make bookings
 */
export const canMakeBookings = (role: UserRole): boolean => {
  return ["SUPER_ADMIN", "COWORK_ADMIN", "CLIENT_ADMIN", "END_USER"].includes(
    role
  );
};

/**
 * Get allowed tenant IDs for a user
 */
export const getAllowedTenantIds = async (
  accessToken: string
): Promise<string[]> => {
  const context = await getTenantContext(accessToken);

  if (!context) {
    return [];
  }

  // Super admins can access all tenants
  if (context.role === "SUPER_ADMIN") {
    const { data: tenants, error } = await supabaseAdmin
      .from("tenants")
      .select("id");

    if (error) {
      console.error("Error getting all tenants:", error);
      return [context.tenantId];
    }

    return tenants.map((t) => t.id);
  }

  // Other users can only access their own tenant
  return [context.tenantId];
};

/**
 * Middleware function to extract and validate tenant context
 */
export const withTenantContext = async (
  accessToken: string,
  callback: (context: TenantContext) => Promise<any>
) => {
  const context = await getTenantContext(accessToken);

  if (!context) {
    throw new Error("Invalid or missing tenant context");
  }

  return callback(context);
};

/**
 * Set user metadata for RLS policies
 */
export const setUserMetadata = async (
  userId: string,
  tenantId: string,
  role: UserRole,
  clientId?: string
) => {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        tenant_id: tenantId,
        role: role,
        client_id: clientId,
      },
    });

    if (error) {
      console.error("Error setting user metadata:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error setting user metadata:", error);
    return false;
  }
};

/**
 * Create a new user with proper tenant context
 */
export const createUserWithTenant = async (
  email: string,
  password: string,
  tenantId: string,
  role: UserRole,
  firstName: string,
  lastName: string,
  clientId?: string
) => {
  try {
    // Create user in Supabase Auth
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          tenant_id: tenantId,
          role: role,
          client_id: clientId,
          first_name: firstName,
          last_name: lastName,
        },
      });

    if (authError || !authUser.user) {
      console.error("Error creating auth user:", authError);
      return null;
    }

    // Create user record in our User table
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        supabase_id: authUser.user.id,
        tenant_id: tenantId,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        client_id: clientId,
        status: "ACTIVE",
      })
      .select()
      .single();

    if (userError) {
      console.error("Error creating user record:", userError);
      // Clean up auth user if user record creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return null;
    }

    return {
      authUser: authUser.user,
      userRecord,
    };
  } catch (error) {
    console.error("Error creating user with tenant:", error);
    return null;
  }
};

/**
 * Delete user and clean up auth
 */
export const deleteUserWithCleanup = async (userId: string) => {
  try {
    // Get user record to find supabase_id
    const { data: userRecord, error: getUserError } = await supabaseAdmin
      .from("users")
      .select("supabase_id")
      .eq("id", userId)
      .single();

    if (getUserError || !userRecord) {
      console.error("Error getting user record:", getUserError);
      return false;
    }

    // Delete from auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      userRecord.supabase_id
    );

    if (authError) {
      console.error("Error deleting auth user:", authError);
      return false;
    }

    // Delete user record (should cascade due to foreign key constraints)
    const { error: deleteError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      console.error("Error deleting user record:", deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting user with cleanup:", error);
    return false;
  }
};

/**
 * Test RLS policies for a specific user
 */
export const testRLSPolicies = async (accessToken: string) => {
  const context = await getTenantContext(accessToken);

  if (!context) {
    throw new Error("No tenant context available");
  }

  const userClient = createUserClient(accessToken);

  try {
    // Test tenant access
    const { data: tenants, error: tenantError } = await userClient
      .from("tenants")
      .select("id, name");

    // Test user access
    const { data: users, error: userError } = await userClient
      .from("users")
      .select("id, email, role");

    // Test client access
    const { data: clients, error: clientError } = await userClient
      .from("clients")
      .select("id, name, status");

    return {
      context,
      tests: {
        tenants: { data: tenants, error: tenantError },
        users: { data: users, error: userError },
        clients: { data: clients, error: clientError },
      },
    };
  } catch (error) {
    console.error("Error testing RLS policies:", error);
    throw error;
  }
};
