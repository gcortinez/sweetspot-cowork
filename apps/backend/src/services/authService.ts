import { supabaseAdmin, createUserClient } from "../lib/supabase";
import { UserRole, UserStatus } from "@sweetspot/shared";
import { TenantService } from "./tenantService";
import { UserService } from "./userService";
import { getTenantContext } from "../lib/rls";

// Local type definitions
export interface LoginRequest {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantSlug: string;
  role?: UserRole;
  clientId?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  tenantId: string;
  role: UserRole;
  clientId?: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface RegisterResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface SessionInfo {
  user: AuthUser;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  isValid: boolean;
}

/**
 * Authentication Service
 * Handles login, registration, and session management for multi-tenant system
 */
export class AuthService {
  /**
   * Login user with email and password
   */
  static async login(
    email: string,
    password: string,
    tenantSlug?: string
  ): Promise<{
    success: boolean;
    user?: AuthUser;
    tenant?: { id: string; name: string; slug: string };
    tenants?: Array<{ id: string; name: string; slug: string }>; // For multi-tenant users
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    error?: string;
  }> {
    try {
      // First authenticate with Supabase to verify credentials
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });

      if (authError || !authData.user) {
        console.error("Authentication failed:", authError);
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      // If tenantSlug is provided, use the existing logic
      if (tenantSlug) {
        // Get tenant by slug
        const tenant = await TenantService.getTenantBySlug(tenantSlug);
        if (!tenant) {
          return {
            success: false,
            error: `Tenant with slug '${tenantSlug}' not found`,
          };
        }

        // Get user record from our database
        const userRecord = await UserService.getUserByEmail(email, tenant.id);
        if (!userRecord) {
          return {
            success: false,
            error: "User not found in this workspace",
          };
        }

        // Check if user is active
        if (userRecord.status !== "ACTIVE") {
          return {
            success: false,
            error: `User account is ${userRecord.status.toLowerCase()}`,
          };
        }

        // Check if tenant is active
        if (tenant.status !== "ACTIVE") {
          return {
            success: false,
            error: `Tenant is ${tenant.status.toLowerCase()}`,
          };
        }

        // Update last login timestamp
        await UserService.updateLastLogin(userRecord.id);

        const authUser: AuthUser = {
          id: userRecord.id,
          email: userRecord.email,
          tenantId: userRecord.tenantId,
          role: userRecord.role,
          clientId: userRecord.clientId,
        };

        console.log(`✅ User logged in: ${email} in tenant: ${tenant.name}`);

        return {
          success: true,
          user: authUser,
          accessToken: authData.session!.access_token,
          refreshToken: authData.session!.refresh_token,
          expiresAt: new Date(
            Date.now() + (authData.session!.expires_in || 3600) * 1000
          ).toISOString(),
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
          },
        };
      } else {
        // No tenantSlug provided - find all tenants for this user
        console.log(`🔍 Looking for user records for email: ${email}`);

        // Use raw SQL to bypass RLS
        const { data: userRecords, error: userError } = await supabaseAdmin.rpc(
          "get_user_by_email",
          {
            user_email: email,
          }
        );

        // If RPC doesn't exist, fall back to direct query with service role
        if (
          userError?.message?.includes("function") ||
          userError?.message?.includes("does not exist")
        ) {
          console.log("⚠️ RPC not found, using direct query");

          // Query with service role to bypass RLS
          const { data: directUsers, error: directError } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("email", email)
            .eq("status", "ACTIVE");

          if (directError) {
            console.error("❌ Direct query error:", directError);
            return {
              success: false,
              error: "Failed to query user records",
            };
          }

          const userRecordsFromDirect = directUsers || [];
          console.log(
            `📊 Direct query result: found ${userRecordsFromDirect.length} record(s)`
          );

          if (userRecordsFromDirect.length === 0) {
            // Try one more time without the status filter
            const { data: allUsers } = await supabaseAdmin
              .from("users")
              .select("*")
              .eq("email", email);

            console.log(
              `📊 All users query: found ${allUsers?.length || 0} record(s)`
            );
            if (allUsers && allUsers.length > 0) {
              console.log(
                `⚠️ User exists but status is: ${allUsers[0].status}`
              );
            }

            return {
              success: false,
              error: "No active workspaces found for this user",
            };
          }

          // Continue with the found records
          const userTenantsPromises = userRecordsFromDirect.map(
            async (userRecord) => {
              const tenant = await TenantService.getTenantById(
                userRecord.tenantId
              );
              console.log(
                `  - Tenant ${userRecord.tenantId}: ${tenant?.name} (${tenant?.status})`
              );
              if (tenant && tenant.status === "ACTIVE") {
                return { userRecord, tenant };
              }
              return null;
            }
          );

          const userTenants = (await Promise.all(userTenantsPromises)).filter(
            (item) => item !== null
          );

          console.log(`✅ Found ${userTenants.length} active tenant(s)`);

          if (userTenants.length === 0) {
            return {
              success: false,
              error: "No active workspaces found for this user",
            };
          }

          // If user belongs to only one tenant, auto-select it
          if (userTenants.length === 1) {
            const { userRecord, tenant } = userTenants[0]!;

            // Update last login timestamp
            await UserService.updateLastLogin(userRecord.id);

            const authUser: AuthUser = {
              id: userRecord.id,
              email: userRecord.email,
              tenantId: userRecord.tenantId,
              role: userRecord.role,
              clientId: userRecord.clientId,
            };

            console.log(
              `✅ User logged in: ${email} in tenant: ${tenant.name} (auto-selected)`
            );

            return {
              success: true,
              user: authUser,
              accessToken: authData.session!.access_token,
              refreshToken: authData.session!.refresh_token,
              expiresAt: new Date(
                Date.now() + (authData.session!.expires_in || 3600) * 1000
              ).toISOString(),
              tenant: {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
              },
            };
          } else {
            // User belongs to multiple tenants - return the list
            const tenants = userTenants.map(({ tenant }) => ({
              id: tenant!.id,
              name: tenant!.name,
              slug: tenant!.slug,
            }));

            console.log(
              `✅ User authenticated: ${email} - belongs to ${tenants.length} workspaces`
            );

            return {
              success: true,
              accessToken: authData.session!.access_token,
              refreshToken: authData.session!.refresh_token,
              expiresAt: new Date(
                Date.now() + (authData.session!.expires_in || 3600) * 1000
              ).toISOString(),
              tenants, // Return list of tenants for frontend to handle
            };
          }
        }

        // Original flow continues if RPC exists...
        console.log(`📊 Query result:`, {
          found: userRecords?.length || 0,
          error: userError?.message,
        });

        if (userError || !userRecords || userRecords.length === 0) {
          return {
            success: false,
            error: "No active workspaces found for this user",
          };
        }

        // Process the RPC results
        console.log(`✅ RPC function returned ${userRecords.length} user record(s)`);
        
        // Get tenant information for each user record
        const userTenants = [];
        for (const userRecord of userRecords) {
          console.log(`🔍 Looking up tenant: ${userRecord.tenantId}`);
          try {
            // Direct query instead of using TenantService
            console.log(`🔍 DEBUG: Querying tenants table for ID: ${userRecord.tenantId}`);
            console.log(`🔍 DEBUG: Using supabaseAdmin client`);
            
            // First try without single() to see all results
            const { data: tenants, error: tenantError } = await supabaseAdmin
              .from("tenants")
              .select("*")
              .eq("id", userRecord.tenantId);
              
            console.log(`🔍 DEBUG: Tenants query result:`, tenants?.length || 0, 'rows');
            console.log(`🔍 DEBUG: Tenants data:`, tenants);
            
            const tenant = tenants?.[0];
              
            if (tenantError) {
              console.error(`❌ Tenant query error:`, tenantError);
              continue;
            }
            
            console.log(`📊 Tenant lookup result:`, tenant ? `Found ${tenant.name} (status: ${tenant.status})` : 'Not found');
            if (tenant && tenant.status === "ACTIVE") {
              userTenants.push({ userRecord, tenant });
            }
          } catch (error) {
            console.error(`❌ Error looking up tenant:`, error);
          }
        }

        if (userTenants.length === 0) {
          return {
            success: false,
            error: "No active workspaces found for this user",
          };
        }

        // If user belongs to only one tenant, auto-select it
        if (userTenants.length === 1) {
          const { userRecord, tenant } = userTenants[0];

          // Update last login timestamp
          await UserService.updateLastLogin(userRecord.id);

          const authUser: AuthUser = {
            id: userRecord.id,
            email: userRecord.email,
            tenantId: userRecord.tenantId,
            role: userRecord.role,
            clientId: userRecord.clientId,
          };

          console.log(
            `✅ User logged in: ${email} in tenant: ${tenant.name} (auto-selected)`
          );

          return {
            success: true,
            user: authUser,
            accessToken: authData.session!.access_token,
            refreshToken: authData.session!.refresh_token,
            expiresAt: authData.session!.expires_at?.toString() || "",
            tenant: {
              id: tenant.id,
              name: tenant.name,
              slug: tenant.slug,
            },
          };
        }

        // Multiple tenants - return list for user to choose
        console.log(
          `🏢 User belongs to ${userTenants.length} tenants, returning list for selection`
        );

        return {
          success: true,
          tenants: userTenants.map((item) => ({
            id: item.tenant.id,
            name: item.tenant.name,
            slug: item.tenant.slug,
          })),
          accessToken: authData.session!.access_token,
          refreshToken: authData.session!.refresh_token,
          expiresAt: authData.session!.expires_at?.toString() || "",
        };
      }
    } catch (error) {
      console.error("Error in login:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  }

  /**
   * Register new user
   */
  static async register(data: RegisterRequest): Promise<{
    success: boolean;
    user?: AuthUser;
    tenant?: { id: string; name: string; slug: string };
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    error?: string;
  }> {
    try {
      // Get tenant by slug
      const tenant = await TenantService.getTenantBySlug(data.tenantSlug);
      if (!tenant) {
        return {
          success: false,
          error: `Tenant with slug '${data.tenantSlug}' not found`,
        };
      }

      // Check if tenant is active
      if (tenant.status !== "ACTIVE") {
        return {
          success: false,
          error: `Tenant is ${tenant.status.toLowerCase()}`,
        };
      }

      // Create user
      const userRecord = await UserService.createUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        tenantId: tenant.id,
        role: data.role || ("END_USER" as UserRole),
        clientId: data.clientId,
      });

      // Login the newly created user
      const loginResponse = await this.login(
        data.email,
        data.password,
        data.tenantSlug
      );

      console.log(
        `✅ User registered and logged in: ${data.email} in tenant: ${tenant.name}`
      );

      return loginResponse;
    } catch (error) {
      console.error("Error in register:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      };
    }
  }

  /**
   * Logout user (invalidate session)
   */
  static async logout(accessToken: string): Promise<void> {
    try {
      // Check if this is a bypass token (used for testing)
      if (accessToken.startsWith("bypass_token_")) {
        console.log(`✅ Bypass token logout: ${accessToken}`);
        // For bypass tokens, we just log the logout - no Supabase session to invalidate
        return;
      }

      // Get user from token for real Supabase tokens
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (error || !user) {
        // If token is invalid, consider logout successful (already logged out)
        console.log(`⚠️ Invalid token on logout, treating as success: ${error?.message}`);
        return;
      }

      // Sign out user from Supabase
      await supabaseAdmin.auth.admin.signOut(user.id);

      console.log(`✅ User logged out: ${user.email}`);
    } catch (error) {
      console.error("Error in logout:", error);
      // Don't throw error - logout should always succeed on client side
      // even if backend logout fails
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabaseAdmin.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        return {
          success: false,
          error: "Failed to refresh token",
        };
      }

      return {
        success: true,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: new Date(
          Date.now() + (data.session.expires_in || 3600) * 1000
        ).toISOString(),
      };
    } catch (error) {
      console.error("Error in refreshToken:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Token refresh failed",
      };
    }
  }

  /**
   * Get session information from access token
   */
  static async getSession(accessToken: string): Promise<SessionInfo> {
    try {
      // Get tenant context from token
      const context = await getTenantContext(accessToken);

      if (!context) {
        return {
          user: {} as AuthUser,
          tenant: {} as any,
          isValid: false,
        };
      }

      // Get user details
      const userRecord = await UserService.getUserById(context.userId);
      if (!userRecord) {
        return {
          user: {} as AuthUser,
          tenant: {} as any,
          isValid: false,
        };
      }

      // Get tenant details
      const tenant = await TenantService.getTenantById(context.tenantId);
      if (!tenant) {
        return {
          user: {} as AuthUser,
          tenant: {} as any,
          isValid: false,
        };
      }

      const authUser: AuthUser = {
        id: userRecord.id,
        email: userRecord.email,
        tenantId: userRecord.tenantId,
        role: userRecord.role,
        clientId: userRecord.clientId,
      };

      return {
        user: authUser,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
        isValid: true,
      };
    } catch (error) {
      console.error("Error in getSession:", error);
      return {
        user: {} as AuthUser,
        tenant: {} as any,
        isValid: false,
      };
    }
  }

  /**
   * Verify if user has permission for a specific action
   */
  static async verifyPermissions(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string
  ): Promise<boolean> {
    try {
      // Get user record
      const userRecord = await UserService.getUserById(userId);
      if (!userRecord) {
        return false;
      }

      // Super admin can access everything
      if (userRecord.role === "SUPER_ADMIN") {
        return true;
      }

      // Basic permission logic based on role and resource
      switch (resource) {
        case "tenant":
          // Only super admin and cowork admin can manage tenants
          return ["SUPER_ADMIN", "COWORK_ADMIN"].includes(userRecord.role);

        case "user":
          // Cowork admin can manage users in their tenant
          if (userRecord.role === "COWORK_ADMIN") {
            return true;
          }
          // Users can only access their own data
          return resourceId === userId;

        case "client":
          // Cowork admin can manage all clients in their tenant
          if (userRecord.role === "COWORK_ADMIN") {
            return true;
          }
          // Client admin can only manage their own client
          if (userRecord.role === "CLIENT_ADMIN") {
            return userRecord.clientId === resourceId;
          }
          return false;

        default:
          // Default to role-based access
          const roleHierarchy: Record<UserRole, number> = {
            END_USER: 1,
            CLIENT_ADMIN: 2,
            COWORK_ADMIN: 3,
            SUPER_ADMIN: 4,
          };

          // For unknown resources, require at least CLIENT_ADMIN level
          return roleHierarchy[userRecord.role] >= 2;
      }
    } catch (error) {
      console.error("Error in verifyPermissions:", error);
      return false;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get user record with supabaseId
      const { data: userRecord, error: userError } = await supabaseAdmin
        .from("users")
        .select("id, email, supabaseId")
        .eq("id", userId)
        .single();

      if (userError || !userRecord) {
        return {
          success: false,
          error: "User not found",
        };
      }

      // Verify current password by attempting to sign in
      const { error: verifyError } =
        await supabaseAdmin.auth.signInWithPassword({
          email: userRecord.email,
          password: currentPassword,
        });

      if (verifyError) {
        return {
          success: false,
          error: "Current password is incorrect",
        };
      }

      // Update password
      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(userRecord.supabaseId, {
          password: newPassword,
        });

      if (updateError) {
        return {
          success: false,
          error: `Failed to update password: ${updateError.message}`,
        };
      }

      console.log(`✅ Password changed for user: ${userRecord.email}`);
      return { success: true };
    } catch (error) {
      console.error("Error in changePassword:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Password change failed",
      };
    }
  }

  /**
   * Reset password (send reset email)
   */
  static async resetPassword(
    email: string,
    tenantSlug: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify user exists in the specified tenant
      const tenant = await TenantService.getTenantBySlug(tenantSlug);
      if (!tenant) {
        return {
          success: false,
          error: `Tenant with slug '${tenantSlug}' not found`,
        };
      }

      const userRecord = await UserService.getUserByEmail(email, tenant.id);
      if (!userRecord) {
        return {
          success: false,
          error: "User not found in this tenant",
        };
      }

      // Send password reset email
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password?tenant=${tenantSlug}`,
      });

      if (error) {
        return {
          success: false,
          error: `Failed to send reset email: ${error.message}`,
        };
      }

      console.log(`✅ Password reset email sent to: ${email}`);
      return { success: true };
    } catch (error) {
      console.error("Error in resetPassword:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Password reset failed",
      };
    }
  }

  /**
   * Confirm password reset
   */
  static async confirmResetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create a temporary client with the reset token
      const { data, error } = await supabaseAdmin.auth.verifyOtp({
        token_hash: token,
        type: "recovery",
      });

      if (error || !data.user) {
        return {
          success: false,
          error: "Invalid or expired reset token",
        };
      }

      // Update password using admin API
      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
          password: newPassword,
        });

      if (updateError) {
        return {
          success: false,
          error: `Failed to reset password: ${updateError.message}`,
        };
      }

      console.log(`✅ Password reset completed`);
      return { success: true };
    } catch (error) {
      console.error("Error in confirmResetPassword:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Password reset confirmation failed",
      };
    }
  }
}
