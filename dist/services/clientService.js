"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientService = void 0;
const supabase_1 = require("../lib/supabase");
class ClientService {
    static async createClient(data) {
        try {
            const { data: tenant, error: tenantError } = await supabase_1.supabaseAdmin
                .from("tenants")
                .select("id, name, slug")
                .eq("id", data.tenantId)
                .single();
            if (tenantError || !tenant) {
                throw new Error(`Tenant with ID '${data.tenantId}' not found`);
            }
            const { data: existingClient } = await supabase_1.supabaseAdmin
                .from("clients")
                .select("id")
                .eq("email", data.email)
                .eq("tenantId", data.tenantId)
                .single();
            if (existingClient) {
                throw new Error(`Client with email '${data.email}' already exists in this tenant`);
            }
            const clientId = `client_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
            const { data: clientRecord, error: clientError } = await supabase_1.supabaseAdmin
                .from("clients")
                .insert({
                id: clientId,
                tenantId: data.tenantId,
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                taxId: data.taxId,
                contactPerson: data.contactPerson,
                status: data.status || "LEAD",
                notes: data.notes,
            })
                .select()
                .single();
            if (clientError) {
                console.error("Error creating client:", clientError);
                throw new Error(`Failed to create client: ${clientError.message}`);
            }
            console.log(`✅ Created client: ${data.name} in tenant: ${tenant.name}`);
            return {
                id: clientRecord.id,
                tenantId: clientRecord.tenantId,
                name: clientRecord.name,
                email: clientRecord.email,
                phone: clientRecord.phone,
                address: clientRecord.address,
                taxId: clientRecord.taxId,
                contactPerson: clientRecord.contactPerson,
                status: clientRecord.status,
                notes: clientRecord.notes,
                createdAt: clientRecord.createdAt,
                updatedAt: clientRecord.updatedAt,
                tenant: {
                    id: tenant.id,
                    name: tenant.name,
                    slug: tenant.slug,
                },
            };
        }
        catch (error) {
            console.error("Error in createClient:", error);
            throw error;
        }
    }
    static async getClientById(clientId) {
        try {
            const { data: client, error } = await supabase_1.supabaseAdmin
                .from("clients")
                .select(`
          *,
          tenants:tenantId(id, name, slug),
          users:users(count)
        `)
                .eq("id", clientId)
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    return null;
                }
                console.error("Error getting client by ID:", error);
                throw new Error(`Failed to get client: ${error.message}`);
            }
            return this.formatClientResponse(client);
        }
        catch (error) {
            console.error("Error in getClientById:", error);
            throw error;
        }
    }
    static async getClientByEmail(email, tenantId) {
        try {
            const { data: client, error } = await supabase_1.supabaseAdmin
                .from("clients")
                .select(`
          *,
          tenants:tenantId(id, name, slug),
          users:users(count)
        `)
                .eq("email", email)
                .eq("tenantId", tenantId)
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    return null;
                }
                console.error("Error getting client by email:", error);
                throw new Error(`Failed to get client: ${error.message}`);
            }
            return this.formatClientResponse(client);
        }
        catch (error) {
            console.error("Error in getClientByEmail:", error);
            throw error;
        }
    }
    static async getClientsByTenant(tenantId, page = 1, limit = 10, status, search) {
        try {
            const offset = (page - 1) * limit;
            let query = supabase_1.supabaseAdmin
                .from("clients")
                .select(`
          *,
          tenants:tenantId(id, name, slug),
          users:users(count)
        `, { count: "exact" })
                .eq("tenantId", tenantId);
            if (status) {
                query = query.eq("status", status);
            }
            if (search) {
                query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,contactPerson.ilike.%${search}%`);
            }
            const { data: clients, error, count, } = await query
                .order("createdAt", { ascending: false })
                .range(offset, offset + limit - 1);
            if (error) {
                console.error("Error getting clients by tenant:", error);
                throw new Error(`Failed to get clients: ${error.message}`);
            }
            const formattedClients = clients.map((client) => this.formatClientResponse(client));
            return {
                clients: formattedClients,
                total: count || 0,
                page,
                limit,
            };
        }
        catch (error) {
            console.error("Error in getClientsByTenant:", error);
            throw error;
        }
    }
    static async updateClient(clientId, data) {
        try {
            if (data.email) {
                const { data: existingClient } = await supabase_1.supabaseAdmin
                    .from("clients")
                    .select("id, tenantId")
                    .eq("email", data.email)
                    .neq("id", clientId)
                    .single();
                if (existingClient) {
                    throw new Error(`Client with email '${data.email}' already exists in this tenant`);
                }
            }
            const { data: client, error } = await supabase_1.supabaseAdmin
                .from("clients")
                .update({
                ...data,
                updatedAt: new Date().toISOString(),
            })
                .eq("id", clientId)
                .select(`
          *,
          tenants:tenantId(id, name, slug),
          users:users(count)
        `)
                .single();
            if (error) {
                console.error("Error updating client:", error);
                throw new Error(`Failed to update client: ${error.message}`);
            }
            console.log(`✅ Updated client: ${client.name}`);
            return this.formatClientResponse(client);
        }
        catch (error) {
            console.error("Error in updateClient:", error);
            throw error;
        }
    }
    static async deleteClient(clientId, hardDelete = false) {
        try {
            if (hardDelete) {
                const { count: userCount } = await supabase_1.supabaseAdmin
                    .from("users")
                    .select("*", { count: "exact", head: true })
                    .eq("clientId", clientId);
                if (userCount && userCount > 0) {
                    throw new Error(`Cannot delete client: ${userCount} users are still associated with this client`);
                }
                const { error } = await supabase_1.supabaseAdmin
                    .from("clients")
                    .delete()
                    .eq("id", clientId);
                if (error) {
                    console.error("Error hard deleting client:", error);
                    throw new Error(`Failed to delete client: ${error.message}`);
                }
                console.log(`🗑️ Hard deleted client: ${clientId}`);
            }
            else {
                await this.updateClient(clientId, {
                    status: "INACTIVE",
                });
                console.log(`🔒 Soft deleted client: ${clientId}`);
            }
        }
        catch (error) {
            console.error("Error in deleteClient:", error);
            throw error;
        }
    }
    static async convertToProspect(clientId) {
        return this.updateClient(clientId, { status: "PROSPECT" });
    }
    static async activateClient(clientId) {
        return this.updateClient(clientId, { status: "ACTIVE" });
    }
    static async churnClient(clientId, notes) {
        const updateData = {
            status: "CHURNED",
        };
        if (notes) {
            updateData.notes = notes;
        }
        return this.updateClient(clientId, updateData);
    }
    static async getClientStats(tenantId) {
        try {
            const { count: totalClients } = await supabase_1.supabaseAdmin
                .from("clients")
                .select("*", { count: "exact", head: true })
                .eq("tenantId", tenantId);
            const { data: statusData } = await supabase_1.supabaseAdmin
                .from("clients")
                .select("status")
                .eq("tenantId", tenantId);
            const clientsByStatus = {
                LEAD: 0,
                PROSPECT: 0,
                ACTIVE: 0,
                INACTIVE: 0,
                CHURNED: 0,
            };
            statusData?.forEach((client) => {
                clientsByStatus[client.status]++;
            });
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { count: recentClients } = await supabase_1.supabaseAdmin
                .from("clients")
                .select("*", { count: "exact", head: true })
                .eq("tenantId", tenantId)
                .gte("createdAt", thirtyDaysAgo.toISOString());
            return {
                totalClients: totalClients || 0,
                leadClients: clientsByStatus.LEAD,
                prospectClients: clientsByStatus.PROSPECT,
                activeClients: clientsByStatus.ACTIVE,
                inactiveClients: clientsByStatus.INACTIVE,
                churnedClients: clientsByStatus.CHURNED,
                clientsByStatus,
                recentClients: recentClients || 0,
            };
        }
        catch (error) {
            console.error("Error getting client stats:", error);
            throw new Error("Failed to get client statistics");
        }
    }
    static formatClientResponse(client) {
        return {
            id: client.id,
            tenantId: client.tenantId,
            name: client.name,
            email: client.email,
            phone: client.phone,
            address: client.address,
            taxId: client.taxId,
            contactPerson: client.contactPerson,
            status: client.status,
            notes: client.notes,
            createdAt: client.createdAt,
            updatedAt: client.updatedAt,
            tenant: client.tenants
                ? {
                    id: client.tenants.id,
                    name: client.tenants.name,
                    slug: client.tenants.slug,
                }
                : undefined,
            userCount: client.users?.[0]?.count || 0,
        };
    }
}
exports.ClientService = ClientService;
//# sourceMappingURL=clientService.js.map