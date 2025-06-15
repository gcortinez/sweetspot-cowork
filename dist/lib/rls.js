"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRLSPolicies = exports.deleteUserWithCleanup = exports.createUserWithTenant = exports.setUserMetadata = exports.withTenantContext = exports.getAllowedTenantIds = exports.canMakeBookings = exports.canViewFinancials = exports.canManageUsers = exports.canManageClients = exports.isAdmin = exports.validateTenantAccess = exports.createTenantClient = exports.getTenantContext = void 0;
const supabase_1 = require("./supabase");
const getTenantContext = async (accessToken) => {
    try {
        const { data: { user }, error, } = await supabase_1.supabaseAdmin.auth.getUser(accessToken);
        if (error || !user) {
            console.error("Error getting user:", error);
            return null;
        }
        const { data: userRecord, error: userError } = await supabase_1.supabaseAdmin
            .from("users")
            .select("id, tenantId, role, clientId")
            .eq("supabaseId", user.id)
            .single();
        if (userError || !userRecord) {
            console.error("Error getting user record:", userError);
            return null;
        }
        return {
            tenantId: userRecord.tenantId,
            userId: userRecord.id,
            role: userRecord.role,
            clientId: userRecord.clientId || undefined,
        };
    }
    catch (error) {
        console.error("Error extracting tenant context:", error);
        return null;
    }
};
exports.getTenantContext = getTenantContext;
const createTenantClient = (accessToken, tenantContext) => {
    return (0, supabase_1.createUserClient)(accessToken);
};
exports.createTenantClient = createTenantClient;
const validateTenantAccess = (userContext, targetTenantId) => {
    if (userContext.role === "SUPER_ADMIN") {
        return true;
    }
    return userContext.tenantId === targetTenantId;
};
exports.validateTenantAccess = validateTenantAccess;
const isAdmin = (role) => {
    return ["SUPER_ADMIN", "COWORK_ADMIN"].includes(role);
};
exports.isAdmin = isAdmin;
const canManageClients = (role) => {
    return ["SUPER_ADMIN", "COWORK_ADMIN"].includes(role);
};
exports.canManageClients = canManageClients;
const canManageUsers = (role) => {
    return ["SUPER_ADMIN", "COWORK_ADMIN"].includes(role);
};
exports.canManageUsers = canManageUsers;
const canViewFinancials = (role) => {
    return ["SUPER_ADMIN", "COWORK_ADMIN", "CLIENT_ADMIN"].includes(role);
};
exports.canViewFinancials = canViewFinancials;
const canMakeBookings = (role) => {
    return ["SUPER_ADMIN", "COWORK_ADMIN", "CLIENT_ADMIN", "END_USER"].includes(role);
};
exports.canMakeBookings = canMakeBookings;
const getAllowedTenantIds = async (accessToken) => {
    const context = await (0, exports.getTenantContext)(accessToken);
    if (!context) {
        return [];
    }
    if (context.role === "SUPER_ADMIN") {
        const { data: tenants, error } = await supabase_1.supabaseAdmin
            .from("tenants")
            .select("id");
        if (error) {
            console.error("Error getting all tenants:", error);
            return [context.tenantId];
        }
        return tenants.map((t) => t.id);
    }
    return [context.tenantId];
};
exports.getAllowedTenantIds = getAllowedTenantIds;
const withTenantContext = async (accessToken, callback) => {
    const context = await (0, exports.getTenantContext)(accessToken);
    if (!context) {
        throw new Error("Invalid or missing tenant context");
    }
    return callback(context);
};
exports.withTenantContext = withTenantContext;
const setUserMetadata = async (userId, tenantId, role, clientId) => {
    try {
        const { error } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(userId, {
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
    }
    catch (error) {
        console.error("Error setting user metadata:", error);
        return false;
    }
};
exports.setUserMetadata = setUserMetadata;
const createUserWithTenant = async (email, password, tenantId, role, firstName, lastName, clientId) => {
    try {
        const { data: authUser, error: authError } = await supabase_1.supabaseAdmin.auth.admin.createUser({
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
        const userId = `user_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        const { data: userRecord, error: userError } = await supabase_1.supabaseAdmin
            .from("users")
            .insert({
            id: userId,
            supabaseId: authUser.user.id,
            tenantId: tenantId,
            email,
            firstName: firstName,
            lastName: lastName,
            role,
            clientId: clientId,
            status: "ACTIVE",
        })
            .select()
            .single();
        if (userError) {
            console.error("Error creating user record:", userError);
            await supabase_1.supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            return null;
        }
        return {
            authUser: authUser.user,
            userRecord,
        };
    }
    catch (error) {
        console.error("Error creating user with tenant:", error);
        return null;
    }
};
exports.createUserWithTenant = createUserWithTenant;
const deleteUserWithCleanup = async (userId) => {
    try {
        const { data: userRecord, error: getUserError } = await supabase_1.supabaseAdmin
            .from("users")
            .select("supabaseId")
            .eq("id", userId)
            .single();
        if (getUserError || !userRecord) {
            console.error("Error getting user record:", getUserError);
            return false;
        }
        const { error: authError } = await supabase_1.supabaseAdmin.auth.admin.deleteUser(userRecord.supabaseId);
        if (authError) {
            console.error("Error deleting auth user:", authError);
            return false;
        }
        const { error: deleteError } = await supabase_1.supabaseAdmin
            .from("users")
            .delete()
            .eq("id", userId);
        if (deleteError) {
            console.error("Error deleting user record:", deleteError);
            return false;
        }
        return true;
    }
    catch (error) {
        console.error("Error deleting user with cleanup:", error);
        return false;
    }
};
exports.deleteUserWithCleanup = deleteUserWithCleanup;
const testRLSPolicies = async (accessToken) => {
    const context = await (0, exports.getTenantContext)(accessToken);
    if (!context) {
        throw new Error("No tenant context available");
    }
    const userClient = (0, supabase_1.createUserClient)(accessToken);
    try {
        const { data: tenants, error: tenantError } = await userClient
            .from("tenants")
            .select("id, name");
        const { data: users, error: userError } = await userClient
            .from("users")
            .select("id, email, role");
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
    }
    catch (error) {
        console.error("Error testing RLS policies:", error);
        throw error;
    }
};
exports.testRLSPolicies = testRLSPolicies;
//# sourceMappingURL=rls.js.map