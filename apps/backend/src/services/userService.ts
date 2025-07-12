import { supabaseAdmin } from "../lib/supabase";
import { UserRole, UserStatus, User } from "@sweetspot/shared";

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  clientId?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  status?: UserStatus;
  clientId?: string;
}

export interface UserResponse {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: string;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  fullName?: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  client?: {
    id: string;
    name: string;
  };
}

/**
 * User Service
 * Handles all user-related operations including creation, management, and authentication
 */
export class UserService {
  /**
   * Create a new user with Supabase Auth integration
   */
  static async createUser(data: CreateUserRequest): Promise<UserResponse> {
    try {
      // Validate tenant exists
      const { data: tenant, error: tenantError } = await supabaseAdmin
        .from("tenants")
        .select("id, name, slug")
        .eq("id", data.tenantId)
        .single();

      if (tenantError || !tenant) {
        throw new Error(`Tenant with ID '${data.tenantId}' not found`);
      }

      // Validate client exists if provided
      if (data.clientId) {
        const { data: client, error: clientError } = await supabaseAdmin
          .from("clients")
          .select("id")
          .eq("id", data.clientId)
          .eq("tenantId", data.tenantId)
          .single();

        if (clientError || !client) {
          throw new Error(
            `Client with ID '${data.clientId}' not found in tenant '${data.tenantId}'`
          );
        }
      }

      // Check if user already exists in this tenant
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", data.email)
        .eq("tenantId", data.tenantId)
        .single();

      if (existingUser) {
        throw new Error(
          `User with email '${data.email}' already exists in this tenant`
        );
      }

      // Create user in Supabase Auth
      const { data: authUser, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true,
          user_metadata: {
            tenant_id: data.tenantId,
            role: data.role,
            client_id: data.clientId,
            first_name: data.firstName,
            last_name: data.lastName,
          },
        });

      if (authError || !authUser.user) {
        console.error("Error creating auth user:", authError);
        throw new Error(
          `Failed to create user authentication: ${authError?.message}`
        );
      }

      // Generate unique ID for user
      const userId = `user_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create user record in our User table
      const { data: userRecord, error: userError } = await supabaseAdmin
        .from("users")
        .insert({
          id: userId,
          supabaseId: authUser.user.id,
          tenantId: data.tenantId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          avatar: data.avatar,
          role: data.role,
          clientId: data.clientId,
          status: "ACTIVE" as UserStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (userError) {
        console.error("Error creating user record:", userError);
        // Clean up auth user if user record creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      console.log(`✅ Created user: ${data.email} in tenant: ${tenant.name}`);

      return {
        id: userRecord.id,
        tenantId: userRecord.tenantId,
        email: userRecord.email,
        firstName: userRecord.firstName,
        lastName: userRecord.lastName,
        phone: userRecord.phone,
        avatar: userRecord.avatar,
        role: userRecord.role,
        status: userRecord.status,
        lastLoginAt: userRecord.lastLoginAt,
        clientId: userRecord.clientId,
        createdAt: userRecord.createdAt,
        updatedAt: userRecord.updatedAt,
        fullName: `${userRecord.firstName} ${userRecord.lastName}`,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
      };
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<UserResponse | null> {
    try {
      const { data: user, error } = await supabaseAdmin
        .from("users")
        .select(
          `
          *,
          tenants:tenantId(id, name, slug),
          clients:clientId(id, name)
        `
        )
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // User not found
        }
        console.error("Error getting user by ID:", error);
        throw new Error(`Failed to get user: ${(error as Error).message}`);
      }

      return this.formatUserResponse(user);
    } catch (error) {
      console.error("Error in getUserById:", error);
      throw error;
    }
  }

  /**
   * Get user by email and tenant
   */
  static async getUserByEmail(
    email: string,
    tenantId: string
  ): Promise<UserResponse | null> {
    try {
      const { data: user, error } = await supabaseAdmin
        .from("users")
        .select(
          `
          *,
          tenants:tenantId(id, name, slug),
          clients:clientId(id, name)
        `
        )
        .eq("email", email)
        .eq("tenantId", tenantId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // User not found
        }
        console.error("Error getting user by email:", error);
        throw new Error(`Failed to get user: ${(error as Error).message}`);
      }

      return this.formatUserResponse(user);
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      throw error;
    }
  }

  /**
   * Get users by tenant with pagination and filtering
   */
  static async getUsersByTenant(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
    role?: UserRole,
    status?: UserStatus,
    clientId?: string
  ): Promise<{
    users: UserResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from("users")
        .select(
          `
          *,
          tenants:tenantId(id, name, slug),
          clients:clientId(id, name)
        `,
          { count: "exact" }
        )
        .eq("tenantId", tenantId);

      if (role) {
        query = query.eq("role", role);
      }

      if (status) {
        query = query.eq("status", status);
      }

      if (clientId) {
        query = query.eq("clientId", clientId);
      }

      const {
        data: users,
        error,
        count,
      } = await query
        .order("createdAt", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error getting users by tenant:", error);
        throw new Error(`Failed to get users: ${(error as Error).message}`);
      }

      const formattedUsers: UserResponse[] = users.map((user) =>
        this.formatUserResponse(user)
      );

      return {
        users: formattedUsers,
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error("Error in getUsersByTenant:", error);
      throw error;
    }
  }

  /**
   * Update user
   */
  static async updateUser(
    userId: string,
    data: UpdateUserRequest
  ): Promise<UserResponse> {
    try {
      const { data: user, error } = await supabaseAdmin
        .from("users")
        .update({
          ...data,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", userId)
        .select(
          `
          *,
          tenants:tenantId(id, name, slug),
          clients:clientId(id, name)
        `
        )
        .single();

      if (error) {
        console.error("Error updating user:", error);
        throw new Error(`Failed to update user: ${(error as Error).message}`);
      }

      console.log(`✅ Updated user: ${user.email}`);

      return this.formatUserResponse(user);
    } catch (error) {
      console.error("Error in updateUser:", error);
      throw error;
    }
  }

  /**
   * Update user last login timestamp
   */
  static async updateLastLogin(userId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from("users")
        .update({
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Error updating last login:", error);
        throw new Error(`Failed to update last login: ${(error as Error).message}`);
      }
    } catch (error) {
      console.error("Error in updateLastLogin:", error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete by setting status to INACTIVE)
   */
  static async deleteUser(
    userId: string,
    hardDelete: boolean = false
  ): Promise<void> {
    try {
      if (hardDelete) {
        // Get user record to find supabaseId
        const { data: userRecord, error: getUserError } = await supabaseAdmin
          .from("users")
          .select("supabaseId")
          .eq("id", userId)
          .single();

        if (getUserError || !userRecord) {
          throw new Error(`User with ID '${userId}' not found`);
        }

        // Delete from auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
          userRecord.supabaseId
        );

        if (authError) {
          console.error("Error deleting auth user:", authError);
          throw new Error(
            `Failed to delete user authentication: ${authError.message}`
          );
        }

        // Hard delete - remove user record
        const { error } = await supabaseAdmin
          .from("users")
          .delete()
          .eq("id", userId);

        if (error) {
          console.error("Error hard deleting user:", error);
          throw new Error(`Failed to delete user: ${(error as Error).message}`);
        }

        console.log(`🗑️ Hard deleted user: ${userId}`);
      } else {
        // Soft delete - set status to INACTIVE
        await this.updateUser(userId, { status: "INACTIVE" as UserStatus });
        console.log(`🔒 Soft deleted user: ${userId}`);
      }
    } catch (error) {
      console.error("Error in deleteUser:", error);
      throw error;
    }
  }

  /**
   * Suspend user
   */
  static async suspendUser(userId: string): Promise<UserResponse> {
    return this.updateUser(userId, { status: "SUSPENDED" as UserStatus });
  }

  /**
   * Activate user
   */
  static async activateUser(userId: string): Promise<UserResponse> {
    return this.updateUser(userId, { status: "ACTIVE" as UserStatus });
  }

  /**
   * Get user statistics for a tenant
   */
  static async getUserStats(tenantId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    inactiveUsers: number;
    usersByRole: Record<UserRole, number>;
    recentLogins: number;
  }> {
    try {
      // Get total user count
      const { count: totalUsers } = await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("tenantId", tenantId);

      // Get active users count
      const { count: activeUsers } = await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("tenantId", tenantId)
        .eq("status", "ACTIVE");

      // Get suspended users count
      const { count: suspendedUsers } = await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("tenantId", tenantId)
        .eq("status", "SUSPENDED");

      // Get inactive users count
      const { count: inactiveUsers } = await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("tenantId", tenantId)
        .eq("status", "INACTIVE");

      // Get users by role
      const { data: roleData } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("tenantId", tenantId);

      const usersByRole: Record<UserRole, number> = {
        SUPER_ADMIN: 0,
        COWORK_ADMIN: 0,
        CLIENT_ADMIN: 0,
        END_USER: 0,
      };

      roleData?.forEach((user) => {
        usersByRole[user.role as UserRole]++;
      });

      // Get recent logins (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentLogins } = await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("tenantId", tenantId)
        .gte("lastLoginAt", sevenDaysAgo.toISOString());

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        suspendedUsers: suspendedUsers || 0,
        inactiveUsers: inactiveUsers || 0,
        usersByRole,
        recentLogins: recentLogins || 0,
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      throw new Error("Failed to get user statistics");
    }
  }

  /**
   * Format user response with computed fields
   */
  private static formatUserResponse(user: any): UserResponse {
    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      clientId: user.clientId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      fullName: `${user.firstName} ${user.lastName}`,
      tenant: user.tenants
        ? {
            id: user.tenants.id,
            name: user.tenants.name,
            slug: user.tenants.slug,
          }
        : undefined,
      client: user.clients
        ? {
            id: user.clients.id,
            name: user.clients.name,
          }
        : undefined,
    };
  }
}
