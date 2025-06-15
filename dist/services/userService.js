"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const supabase_1 = require("../lib/supabase");
class UserService {
    static async createUser(data) {
        try {
            const { data: tenant, error: tenantError } = await supabase_1.supabaseAdmin
                .from("tenants")
                .select("id, name, slug")
                .eq("id", data.tenantId)
                .single();
            if (tenantError || !tenant) {
                throw new Error(`Tenant with ID '${data.tenantId}' not found`);
            }
            if (data.clientId) {
                const { data: client, error: clientError } = await supabase_1.supabaseAdmin
                    .from("clients")
                    .select("id")
                    .eq("id", data.clientId)
                    .eq("tenantId", data.tenantId)
                    .single();
                if (clientError || !client) {
                    throw new Error(`Client with ID '${data.clientId}' not found in tenant '${data.tenantId}'`);
                }
            }
            const { data: existingUser } = await supabase_1.supabaseAdmin
                .from("users")
                .select("id")
                .eq("email", data.email)
                .eq("tenantId", data.tenantId)
                .single();
            if (existingUser) {
                throw new Error(`User with email '${data.email}' already exists in this tenant`);
            }
            const { data: authUser, error: authError } = await supabase_1.supabaseAdmin.auth.admin.createUser({
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
                throw new Error(`Failed to create user authentication: ${authError?.message}`);
            }
            const userId = `user_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
            const { data: userRecord, error: userError } = await supabase_1.supabaseAdmin
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
                status: "ACTIVE",
            })
                .select()
                .single();
            if (userError) {
                console.error("Error creating user record:", userError);
                await supabase_1.supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
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
        }
        catch (error) {
            console.error("Error in createUser:", error);
            throw error;
        }
    }
    static async getUserById(userId) {
        try {
            const { data: user, error } = await supabase_1.supabaseAdmin
                .from("users")
                .select(`
          *,
          tenants:tenantId(id, name, slug),
          clients:clientId(id, name)
        `)
                .eq("id", userId)
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    return null;
                }
                console.error("Error getting user by ID:", error);
                throw new Error(`Failed to get user: ${error.message}`);
            }
            return this.formatUserResponse(user);
        }
        catch (error) {
            console.error("Error in getUserById:", error);
            throw error;
        }
    }
    static async getUserByEmail(email, tenantId) {
        try {
            const { data: user, error } = await supabase_1.supabaseAdmin
                .from("users")
                .select(`
          *,
          tenants:tenantId(id, name, slug),
          clients:clientId(id, name)
        `)
                .eq("email", email)
                .eq("tenantId", tenantId)
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    return null;
                }
                console.error("Error getting user by email:", error);
                throw new Error(`Failed to get user: ${error.message}`);
            }
            return this.formatUserResponse(user);
        }
        catch (error) {
            console.error("Error in getUserByEmail:", error);
            throw error;
        }
    }
    static async getUsersByTenant(tenantId, page = 1, limit = 10, role, status, clientId) {
        try {
            const offset = (page - 1) * limit;
            let query = supabase_1.supabaseAdmin
                .from("users")
                .select(`
          *,
          tenants:tenantId(id, name, slug),
          clients:clientId(id, name)
        `, { count: "exact" })
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
            const { data: users, error, count, } = await query
                .order("createdAt", { ascending: false })
                .range(offset, offset + limit - 1);
            if (error) {
                console.error("Error getting users by tenant:", error);
                throw new Error(`Failed to get users: ${error.message}`);
            }
            const formattedUsers = users.map((user) => this.formatUserResponse(user));
            return {
                users: formattedUsers,
                total: count || 0,
                page,
                limit,
            };
        }
        catch (error) {
            console.error("Error in getUsersByTenant:", error);
            throw error;
        }
    }
    static async updateUser(userId, data) {
        try {
            const { data: user, error } = await supabase_1.supabaseAdmin
                .from("users")
                .update({
                ...data,
                updatedAt: new Date().toISOString(),
            })
                .eq("id", userId)
                .select(`
          *,
          tenants:tenantId(id, name, slug),
          clients:clientId(id, name)
        `)
                .single();
            if (error) {
                console.error("Error updating user:", error);
                throw new Error(`Failed to update user: ${error.message}`);
            }
            console.log(`✅ Updated user: ${user.email}`);
            return this.formatUserResponse(user);
        }
        catch (error) {
            console.error("Error in updateUser:", error);
            throw error;
        }
    }
    static async updateLastLogin(userId) {
        try {
            const { error } = await supabase_1.supabaseAdmin
                .from("users")
                .update({
                lastLoginAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
                .eq("id", userId);
            if (error) {
                console.error("Error updating last login:", error);
                throw new Error(`Failed to update last login: ${error.message}`);
            }
        }
        catch (error) {
            console.error("Error in updateLastLogin:", error);
            throw error;
        }
    }
    static async deleteUser(userId, hardDelete = false) {
        try {
            if (hardDelete) {
                const { data: userRecord, error: getUserError } = await supabase_1.supabaseAdmin
                    .from("users")
                    .select("supabaseId")
                    .eq("id", userId)
                    .single();
                if (getUserError || !userRecord) {
                    throw new Error(`User with ID '${userId}' not found`);
                }
                const { error: authError } = await supabase_1.supabaseAdmin.auth.admin.deleteUser(userRecord.supabaseId);
                if (authError) {
                    console.error("Error deleting auth user:", authError);
                    throw new Error(`Failed to delete user authentication: ${authError.message}`);
                }
                const { error } = await supabase_1.supabaseAdmin
                    .from("users")
                    .delete()
                    .eq("id", userId);
                if (error) {
                    console.error("Error hard deleting user:", error);
                    throw new Error(`Failed to delete user: ${error.message}`);
                }
                console.log(`🗑️ Hard deleted user: ${userId}`);
            }
            else {
                await this.updateUser(userId, { status: "INACTIVE" });
                console.log(`🔒 Soft deleted user: ${userId}`);
            }
        }
        catch (error) {
            console.error("Error in deleteUser:", error);
            throw error;
        }
    }
    static async suspendUser(userId) {
        return this.updateUser(userId, { status: "SUSPENDED" });
    }
    static async activateUser(userId) {
        return this.updateUser(userId, { status: "ACTIVE" });
    }
    static async getUserStats(tenantId) {
        try {
            const { count: totalUsers } = await supabase_1.supabaseAdmin
                .from("users")
                .select("*", { count: "exact", head: true })
                .eq("tenantId", tenantId);
            const { count: activeUsers } = await supabase_1.supabaseAdmin
                .from("users")
                .select("*", { count: "exact", head: true })
                .eq("tenantId", tenantId)
                .eq("status", "ACTIVE");
            const { count: suspendedUsers } = await supabase_1.supabaseAdmin
                .from("users")
                .select("*", { count: "exact", head: true })
                .eq("tenantId", tenantId)
                .eq("status", "SUSPENDED");
            const { count: inactiveUsers } = await supabase_1.supabaseAdmin
                .from("users")
                .select("*", { count: "exact", head: true })
                .eq("tenantId", tenantId)
                .eq("status", "INACTIVE");
            const { data: roleData } = await supabase_1.supabaseAdmin
                .from("users")
                .select("role")
                .eq("tenantId", tenantId);
            const usersByRole = {
                SUPER_ADMIN: 0,
                COWORK_ADMIN: 0,
                CLIENT_ADMIN: 0,
                END_USER: 0,
            };
            roleData?.forEach((user) => {
                usersByRole[user.role]++;
            });
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const { count: recentLogins } = await supabase_1.supabaseAdmin
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
        }
        catch (error) {
            console.error("Error getting user stats:", error);
            throw new Error("Failed to get user statistics");
        }
    }
    static formatUserResponse(user) {
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
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map