"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
const supabase_1 = require("../lib/supabase");
const rls_1 = require("../lib/rls");
class TenantService {
    static async createTenant(data) {
        try {
            const existingTenant = await this.getTenantBySlug(data.slug);
            if (existingTenant) {
                throw new Error(`Tenant with slug '${data.slug}' already exists`);
            }
            if (data.domain) {
                const existingDomain = await this.getTenantByDomain(data.domain);
                if (existingDomain) {
                    throw new Error(`Tenant with domain '${data.domain}' already exists`);
                }
            }
            const tenantId = `tenant_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
            const { data: tenant, error: tenantError } = await supabase_1.supabaseAdmin
                .from("tenants")
                .insert({
                id: tenantId,
                name: data.name,
                slug: data.slug,
                domain: data.domain,
                logo: data.logo,
                description: data.description,
                settings: data.settings || {},
                status: "ACTIVE",
            })
                .select()
                .single();
            if (tenantError) {
                console.error("Error creating tenant:", tenantError);
                throw new Error(`Failed to create tenant: ${tenantError.message}`);
            }
            const adminUser = await (0, rls_1.createUserWithTenant)(data.adminUser.email, data.adminUser.password, tenant.id, "COWORK_ADMIN", data.adminUser.firstName, data.adminUser.lastName);
            if (!adminUser) {
                await supabase_1.supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
                throw new Error("Failed to create admin user for tenant");
            }
            console.log(`✅ Created tenant: ${tenant.name} with admin user: ${data.adminUser.email}`);
            return {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                domain: tenant.domain,
                logo: tenant.logo,
                description: tenant.description,
                settings: tenant.settings,
                status: tenant.status,
                createdAt: tenant.createdAt,
                updatedAt: tenant.updatedAt,
            };
        }
        catch (error) {
            console.error("Error in createTenant:", error);
            throw error;
        }
    }
    static async getTenantById(tenantId) {
        try {
            const { data: tenant, error } = await supabase_1.supabaseAdmin
                .from("tenants")
                .select(`
          *,
          users:users(count),
          clients:clients(count)
        `)
                .eq("id", tenantId)
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    return null;
                }
                console.error("Error getting tenant by ID:", error);
                throw new Error(`Failed to get tenant: ${error.message}`);
            }
            return {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                domain: tenant.domain,
                logo: tenant.logo,
                description: tenant.description,
                settings: tenant.settings,
                status: tenant.status,
                createdAt: tenant.createdAt,
                updatedAt: tenant.updatedAt,
                userCount: tenant.users?.[0]?.count || 0,
                clientCount: tenant.clients?.[0]?.count || 0,
            };
        }
        catch (error) {
            console.error("Error in getTenantById:", error);
            throw error;
        }
    }
    static async getTenantBySlug(slug) {
        try {
            const { data: tenant, error } = await supabase_1.supabaseAdmin
                .from("tenants")
                .select("*")
                .eq("slug", slug)
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    return null;
                }
                console.error("Error getting tenant by slug:", error);
                throw new Error(`Failed to get tenant: ${error.message}`);
            }
            return {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                domain: tenant.domain,
                logo: tenant.logo,
                description: tenant.description,
                settings: tenant.settings,
                status: tenant.status,
                createdAt: tenant.createdAt,
                updatedAt: tenant.updatedAt,
            };
        }
        catch (error) {
            console.error("Error in getTenantBySlug:", error);
            throw error;
        }
    }
    static async getTenantByDomain(domain) {
        try {
            const { data: tenant, error } = await supabase_1.supabaseAdmin
                .from("tenants")
                .select("*")
                .eq("domain", domain)
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    return null;
                }
                console.error("Error getting tenant by domain:", error);
                throw new Error(`Failed to get tenant: ${error.message}`);
            }
            return {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                domain: tenant.domain,
                logo: tenant.logo,
                description: tenant.description,
                settings: tenant.settings,
                status: tenant.status,
                createdAt: tenant.createdAt,
                updatedAt: tenant.updatedAt,
            };
        }
        catch (error) {
            console.error("Error in getTenantByDomain:", error);
            throw error;
        }
    }
    static async getAllTenants(page = 1, limit = 10, status) {
        try {
            const offset = (page - 1) * limit;
            let query = supabase_1.supabaseAdmin.from("tenants").select(`
          *,
          users:users(count),
          clients:clients(count)
        `, { count: "exact" });
            if (status) {
                query = query.eq("status", status);
            }
            const { data: tenants, error, count, } = await query
                .order("createdAt", { ascending: false })
                .range(offset, offset + limit - 1);
            if (error) {
                console.error("Error getting all tenants:", error);
                throw new Error(`Failed to get tenants: ${error.message}`);
            }
            const formattedTenants = tenants.map((tenant) => ({
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                domain: tenant.domain,
                logo: tenant.logo,
                description: tenant.description,
                settings: tenant.settings,
                status: tenant.status,
                createdAt: tenant.createdAt,
                updatedAt: tenant.updatedAt,
                userCount: tenant.users?.[0]?.count || 0,
                clientCount: tenant.clients?.[0]?.count || 0,
            }));
            return {
                tenants: formattedTenants,
                total: count || 0,
                page,
                limit,
            };
        }
        catch (error) {
            console.error("Error in getAllTenants:", error);
            throw error;
        }
    }
    static async updateTenant(tenantId, data) {
        try {
            if (data.slug) {
                const existingTenant = await this.getTenantBySlug(data.slug);
                if (existingTenant && existingTenant.id !== tenantId) {
                    throw new Error(`Tenant with slug '${data.slug}' already exists`);
                }
            }
            if (data.domain) {
                const existingDomain = await this.getTenantByDomain(data.domain);
                if (existingDomain && existingDomain.id !== tenantId) {
                    throw new Error(`Tenant with domain '${data.domain}' already exists`);
                }
            }
            const { data: tenant, error } = await supabase_1.supabaseAdmin
                .from("tenants")
                .update({
                ...data,
                updatedAt: new Date().toISOString(),
            })
                .eq("id", tenantId)
                .select()
                .single();
            if (error) {
                console.error("Error updating tenant:", error);
                throw new Error(`Failed to update tenant: ${error.message}`);
            }
            console.log(`✅ Updated tenant: ${tenant.name}`);
            return {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                domain: tenant.domain,
                logo: tenant.logo,
                description: tenant.description,
                settings: tenant.settings,
                status: tenant.status,
                createdAt: tenant.createdAt,
                updatedAt: tenant.updatedAt,
            };
        }
        catch (error) {
            console.error("Error in updateTenant:", error);
            throw error;
        }
    }
    static async deleteTenant(tenantId, hardDelete = false) {
        try {
            if (hardDelete) {
                const { error } = await supabase_1.supabaseAdmin
                    .from("tenants")
                    .delete()
                    .eq("id", tenantId);
                if (error) {
                    console.error("Error hard deleting tenant:", error);
                    throw new Error(`Failed to delete tenant: ${error.message}`);
                }
                console.log(`🗑️ Hard deleted tenant: ${tenantId}`);
            }
            else {
                await this.updateTenant(tenantId, {
                    status: "INACTIVE",
                });
                console.log(`🔒 Soft deleted tenant: ${tenantId}`);
            }
        }
        catch (error) {
            console.error("Error in deleteTenant:", error);
            throw error;
        }
    }
    static async suspendTenant(tenantId) {
        return this.updateTenant(tenantId, { status: "SUSPENDED" });
    }
    static async activateTenant(tenantId) {
        return this.updateTenant(tenantId, { status: "ACTIVE" });
    }
    static async getTenantStats(tenantId) {
        try {
            const { count: userCount } = await supabase_1.supabaseAdmin
                .from("users")
                .select("*", { count: "exact", head: true })
                .eq("tenantId", tenantId)
                .eq("status", "ACTIVE");
            const { count: clientCount } = await supabase_1.supabaseAdmin
                .from("clients")
                .select("*", { count: "exact", head: true })
                .eq("tenantId", tenantId)
                .eq("status", "ACTIVE");
            const { count: activeBookings } = await supabase_1.supabaseAdmin
                .from("bookings")
                .select("*", { count: "exact", head: true })
                .eq("tenantId", tenantId)
                .eq("status", "CONFIRMED");
            const { count: spacesCount } = await supabase_1.supabaseAdmin
                .from("spaces")
                .select("*", { count: "exact", head: true })
                .eq("tenantId", tenantId)
                .eq("status", "ACTIVE");
            const { data: invoices } = await supabase_1.supabaseAdmin
                .from("invoices")
                .select("total")
                .eq("tenantId", tenantId)
                .eq("status", "PAID");
            const totalRevenue = invoices?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0;
            return {
                userCount: userCount || 0,
                clientCount: clientCount || 0,
                activeBookings: activeBookings || 0,
                totalRevenue,
                spacesCount: spacesCount || 0,
            };
        }
        catch (error) {
            console.error("Error getting tenant stats:", error);
            throw new Error("Failed to get tenant statistics");
        }
    }
    static validateSlug(slug) {
        const slugRegex = /^[a-z0-9-]{3,50}$/;
        return slugRegex.test(slug);
    }
    static async generateSlugFromName(name) {
        let baseSlug = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
        if (baseSlug.length < 3) {
            baseSlug = `cowork-${baseSlug}`;
        }
        if (baseSlug.length > 50) {
            baseSlug = baseSlug.substring(0, 50);
        }
        let slug = baseSlug;
        let counter = 1;
        while (await this.getTenantBySlug(slug)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        return slug;
    }
}
exports.TenantService = TenantService;
//# sourceMappingURL=tenantService.js.map