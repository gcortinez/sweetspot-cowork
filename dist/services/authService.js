"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const supabase_1 = require("../lib/supabase");
const tenantService_1 = require("./tenantService");
const userService_1 = require("./userService");
const rls_1 = require("../lib/rls");
class AuthService {
    static async login(email, password, tenantSlug) {
        try {
            const { data: authData, error: authError } = await supabase_1.supabaseAdmin.auth.signInWithPassword({
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
            if (tenantSlug) {
                const tenant = await tenantService_1.TenantService.getTenantBySlug(tenantSlug);
                if (!tenant) {
                    return {
                        success: false,
                        error: `Tenant with slug '${tenantSlug}' not found`,
                    };
                }
                const userRecord = await userService_1.UserService.getUserByEmail(email, tenant.id);
                if (!userRecord) {
                    return {
                        success: false,
                        error: "User not found in this workspace",
                    };
                }
                if (userRecord.status !== "ACTIVE") {
                    return {
                        success: false,
                        error: `User account is ${userRecord.status.toLowerCase()}`,
                    };
                }
                if (tenant.status !== "ACTIVE") {
                    return {
                        success: false,
                        error: `Tenant is ${tenant.status.toLowerCase()}`,
                    };
                }
                await userService_1.UserService.updateLastLogin(userRecord.id);
                const authUser = {
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
                    accessToken: authData.session.access_token,
                    refreshToken: authData.session.refresh_token,
                    expiresAt: new Date(Date.now() + (authData.session.expires_in || 3600) * 1000).toISOString(),
                    tenant: {
                        id: tenant.id,
                        name: tenant.name,
                        slug: tenant.slug,
                    },
                };
            }
            else {
                console.log(`🔍 Looking for user records for email: ${email}`);
                const { data: userRecords, error: userError } = await supabase_1.supabaseAdmin.rpc("get_user_by_email", {
                    user_email: email,
                });
                if (userError?.message?.includes("function") ||
                    userError?.message?.includes("does not exist")) {
                    console.log("⚠️ RPC not found, using direct query");
                    const { data: directUsers, error: directError } = await supabase_1.supabaseAdmin
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
                    console.log(`📊 Direct query result: found ${userRecordsFromDirect.length} record(s)`);
                    if (userRecordsFromDirect.length === 0) {
                        const { data: allUsers } = await supabase_1.supabaseAdmin
                            .from("users")
                            .select("*")
                            .eq("email", email);
                        console.log(`📊 All users query: found ${allUsers?.length || 0} record(s)`);
                        if (allUsers && allUsers.length > 0) {
                            console.log(`⚠️ User exists but status is: ${allUsers[0].status}`);
                        }
                        return {
                            success: false,
                            error: "No active workspaces found for this user",
                        };
                    }
                    const userTenantsPromises = userRecordsFromDirect.map(async (userRecord) => {
                        const tenant = await tenantService_1.TenantService.getTenantById(userRecord.tenantId);
                        console.log(`  - Tenant ${userRecord.tenantId}: ${tenant?.name} (${tenant?.status})`);
                        if (tenant && tenant.status === "ACTIVE") {
                            return { userRecord, tenant };
                        }
                        return null;
                    });
                    const userTenants = (await Promise.all(userTenantsPromises)).filter((item) => item !== null);
                    console.log(`✅ Found ${userTenants.length} active tenant(s)`);
                    if (userTenants.length === 0) {
                        return {
                            success: false,
                            error: "No active workspaces found for this user",
                        };
                    }
                    if (userTenants.length === 1) {
                        const { userRecord, tenant } = userTenants[0];
                        await userService_1.UserService.updateLastLogin(userRecord.id);
                        const authUser = {
                            id: userRecord.id,
                            email: userRecord.email,
                            tenantId: userRecord.tenantId,
                            role: userRecord.role,
                            clientId: userRecord.clientId,
                        };
                        console.log(`✅ User logged in: ${email} in tenant: ${tenant.name} (auto-selected)`);
                        return {
                            success: true,
                            user: authUser,
                            accessToken: authData.session.access_token,
                            refreshToken: authData.session.refresh_token,
                            expiresAt: new Date(Date.now() + (authData.session.expires_in || 3600) * 1000).toISOString(),
                            tenant: {
                                id: tenant.id,
                                name: tenant.name,
                                slug: tenant.slug,
                            },
                        };
                    }
                    else {
                        const tenants = userTenants.map(({ tenant }) => ({
                            id: tenant.id,
                            name: tenant.name,
                            slug: tenant.slug,
                        }));
                        console.log(`✅ User authenticated: ${email} - belongs to ${tenants.length} workspaces`);
                        return {
                            success: true,
                            accessToken: authData.session.access_token,
                            refreshToken: authData.session.refresh_token,
                            expiresAt: new Date(Date.now() + (authData.session.expires_in || 3600) * 1000).toISOString(),
                            tenants,
                        };
                    }
                }
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
                console.log(`✅ RPC function returned ${userRecords.length} user record(s)`);
                const userTenants = [];
                for (const userRecord of userRecords) {
                    console.log(`🔍 Looking up tenant: ${userRecord.tenantId}`);
                    try {
                        console.log(`🔍 DEBUG: Querying tenants table for ID: ${userRecord.tenantId}`);
                        console.log(`🔍 DEBUG: Using supabaseAdmin client`);
                        const { data: tenants, error: tenantError } = await supabase_1.supabaseAdmin
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
                    }
                    catch (error) {
                        console.error(`❌ Error looking up tenant:`, error);
                    }
                }
                if (userTenants.length === 0) {
                    return {
                        success: false,
                        error: "No active workspaces found for this user",
                    };
                }
                if (userTenants.length === 1) {
                    const { userRecord, tenant } = userTenants[0];
                    await userService_1.UserService.updateLastLogin(userRecord.id);
                    const authUser = {
                        id: userRecord.id,
                        email: userRecord.email,
                        tenantId: userRecord.tenantId,
                        role: userRecord.role,
                        clientId: userRecord.clientId,
                    };
                    console.log(`✅ User logged in: ${email} in tenant: ${tenant.name} (auto-selected)`);
                    return {
                        success: true,
                        user: authUser,
                        accessToken: authData.session.access_token,
                        refreshToken: authData.session.refresh_token,
                        expiresAt: authData.session.expires_at?.toString() || "",
                        tenant: {
                            id: tenant.id,
                            name: tenant.name,
                            slug: tenant.slug,
                        },
                    };
                }
                console.log(`🏢 User belongs to ${userTenants.length} tenants, returning list for selection`);
                return {
                    success: true,
                    tenants: userTenants.map((item) => ({
                        id: item.tenant.id,
                        name: item.tenant.name,
                        slug: item.tenant.slug,
                    })),
                    accessToken: authData.session.access_token,
                    refreshToken: authData.session.refresh_token,
                    expiresAt: authData.session.expires_at?.toString() || "",
                };
            }
        }
        catch (error) {
            console.error("Error in login:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Login failed",
            };
        }
    }
    static async register(data) {
        try {
            const tenant = await tenantService_1.TenantService.getTenantBySlug(data.tenantSlug);
            if (!tenant) {
                return {
                    success: false,
                    error: `Tenant with slug '${data.tenantSlug}' not found`,
                };
            }
            if (tenant.status !== "ACTIVE") {
                return {
                    success: false,
                    error: `Tenant is ${tenant.status.toLowerCase()}`,
                };
            }
            const userRecord = await userService_1.UserService.createUser({
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                tenantId: tenant.id,
                role: data.role || "END_USER",
                clientId: data.clientId,
            });
            const loginResponse = await this.login(data.email, data.password, data.tenantSlug);
            console.log(`✅ User registered and logged in: ${data.email} in tenant: ${tenant.name}`);
            return loginResponse;
        }
        catch (error) {
            console.error("Error in register:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Registration failed",
            };
        }
    }
    static async logout(accessToken) {
        try {
            if (accessToken.startsWith("bypass_token_")) {
                console.log(`✅ Bypass token logout: ${accessToken}`);
                return;
            }
            const { data: { user }, error, } = await supabase_1.supabaseAdmin.auth.getUser(accessToken);
            if (error || !user) {
                console.log(`⚠️ Invalid token on logout, treating as success: ${error?.message}`);
                return;
            }
            await supabase_1.supabaseAdmin.auth.admin.signOut(user.id);
            console.log(`✅ User logged out: ${user.email}`);
        }
        catch (error) {
            console.error("Error in logout:", error);
        }
    }
    static async refreshToken(refreshToken) {
        try {
            const { data, error } = await supabase_1.supabaseAdmin.auth.refreshSession({
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
                expiresAt: new Date(Date.now() + (data.session.expires_in || 3600) * 1000).toISOString(),
            };
        }
        catch (error) {
            console.error("Error in refreshToken:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Token refresh failed",
            };
        }
    }
    static async getSession(accessToken) {
        try {
            const context = await (0, rls_1.getTenantContext)(accessToken);
            if (!context) {
                return {
                    user: {},
                    tenant: {},
                    isValid: false,
                };
            }
            const userRecord = await userService_1.UserService.getUserById(context.userId);
            if (!userRecord) {
                return {
                    user: {},
                    tenant: {},
                    isValid: false,
                };
            }
            const tenant = await tenantService_1.TenantService.getTenantById(context.tenantId);
            if (!tenant) {
                return {
                    user: {},
                    tenant: {},
                    isValid: false,
                };
            }
            const authUser = {
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
        }
        catch (error) {
            console.error("Error in getSession:", error);
            return {
                user: {},
                tenant: {},
                isValid: false,
            };
        }
    }
    static async verifyPermissions(userId, action, resource, resourceId) {
        try {
            const userRecord = await userService_1.UserService.getUserById(userId);
            if (!userRecord) {
                return false;
            }
            if (userRecord.role === "SUPER_ADMIN") {
                return true;
            }
            switch (resource) {
                case "tenant":
                    return ["SUPER_ADMIN", "COWORK_ADMIN"].includes(userRecord.role);
                case "user":
                    if (userRecord.role === "COWORK_ADMIN") {
                        return true;
                    }
                    return resourceId === userId;
                case "client":
                    if (userRecord.role === "COWORK_ADMIN") {
                        return true;
                    }
                    if (userRecord.role === "CLIENT_ADMIN") {
                        return userRecord.clientId === resourceId;
                    }
                    return false;
                default:
                    const roleHierarchy = {
                        END_USER: 1,
                        CLIENT_ADMIN: 2,
                        COWORK_ADMIN: 3,
                        SUPER_ADMIN: 4,
                    };
                    return roleHierarchy[userRecord.role] >= 2;
            }
        }
        catch (error) {
            console.error("Error in verifyPermissions:", error);
            return false;
        }
    }
    static async changePassword(userId, currentPassword, newPassword) {
        try {
            const { data: userRecord, error: userError } = await supabase_1.supabaseAdmin
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
            const { error: verifyError } = await supabase_1.supabaseAdmin.auth.signInWithPassword({
                email: userRecord.email,
                password: currentPassword,
            });
            if (verifyError) {
                return {
                    success: false,
                    error: "Current password is incorrect",
                };
            }
            const { error: updateError } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(userRecord.supabaseId, {
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
        }
        catch (error) {
            console.error("Error in changePassword:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Password change failed",
            };
        }
    }
    static async resetPassword(email, tenantSlug) {
        try {
            const tenant = await tenantService_1.TenantService.getTenantBySlug(tenantSlug);
            if (!tenant) {
                return {
                    success: false,
                    error: `Tenant with slug '${tenantSlug}' not found`,
                };
            }
            const userRecord = await userService_1.UserService.getUserByEmail(email, tenant.id);
            if (!userRecord) {
                return {
                    success: false,
                    error: "User not found in this tenant",
                };
            }
            const { error } = await supabase_1.supabaseAdmin.auth.resetPasswordForEmail(email, {
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
        }
        catch (error) {
            console.error("Error in resetPassword:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Password reset failed",
            };
        }
    }
    static async confirmResetPassword(token, newPassword) {
        try {
            const { data, error } = await supabase_1.supabaseAdmin.auth.verifyOtp({
                token_hash: token,
                type: "recovery",
            });
            if (error || !data.user) {
                return {
                    success: false,
                    error: "Invalid or expired reset token",
                };
            }
            const { error: updateError } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(data.user.id, {
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
        }
        catch (error) {
            console.error("Error in confirmResetPassword:", error);
            return {
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Password reset confirmation failed",
            };
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map