import { supabaseAdmin } from "../lib/supabase";
import { ClientStatus, Client } from "@sweetspot/shared";

export interface CreateClientRequest {
  name: string;
  email: string;
  tenantId: string;
  phone?: string;
  address?: string;
  taxId?: string;
  contactPerson?: string;
  status?: ClientStatus;
  notes?: string;
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  contactPerson?: string;
  status?: ClientStatus;
  notes?: string;
}

export interface ClientResponse {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
  contactPerson?: string;
  status: ClientStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  userCount?: number;
}

/**
 * Client Service
 * Handles all client-related operations including creation, management, and user association
 */
export class ClientService {
  /**
   * Create a new client
   */
  static async createClient(
    data: CreateClientRequest
  ): Promise<ClientResponse> {
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

      // Check if client already exists in this tenant
      const { data: existingClient } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("email", data.email)
        .eq("tenantId", data.tenantId)
        .single();

      if (existingClient) {
        throw new Error(
          `Client with email '${data.email}' already exists in this tenant`
        );
      }

      // Generate unique ID for client
      const clientId = `client_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create client record
      const { data: clientRecord, error: clientError } = await supabaseAdmin
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
          status: data.status || ("LEAD" as ClientStatus),
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
    } catch (error) {
      console.error("Error in createClient:", error);
      throw error;
    }
  }

  /**
   * Get client by ID
   */
  static async getClientById(clientId: string): Promise<ClientResponse | null> {
    try {
      const { data: client, error } = await supabaseAdmin
        .from("clients")
        .select(
          `
          *,
          tenants:tenantId(id, name, slug),
          users:users(count)
        `
        )
        .eq("id", clientId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Client not found
        }
        console.error("Error getting client by ID:", error);
        throw new Error(`Failed to get client: ${error.message}`);
      }

      return this.formatClientResponse(client);
    } catch (error) {
      console.error("Error in getClientById:", error);
      throw error;
    }
  }

  /**
   * Get client by email and tenant
   */
  static async getClientByEmail(
    email: string,
    tenantId: string
  ): Promise<ClientResponse | null> {
    try {
      const { data: client, error } = await supabaseAdmin
        .from("clients")
        .select(
          `
          *,
          tenants:tenantId(id, name, slug),
          users:users(count)
        `
        )
        .eq("email", email)
        .eq("tenantId", tenantId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Client not found
        }
        console.error("Error getting client by email:", error);
        throw new Error(`Failed to get client: ${error.message}`);
      }

      return this.formatClientResponse(client);
    } catch (error) {
      console.error("Error in getClientByEmail:", error);
      throw error;
    }
  }

  /**
   * Get clients by tenant with pagination and filtering
   */
  static async getClientsByTenant(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
    status?: ClientStatus,
    search?: string
  ): Promise<{
    clients: ClientResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from("clients")
        .select(
          `
          *,
          tenants:tenantId(id, name, slug),
          users:users(count)
        `,
          { count: "exact" }
        )
        .eq("tenantId", tenantId);

      if (status) {
        query = query.eq("status", status);
      }

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,contactPerson.ilike.%${search}%`
        );
      }

      const {
        data: clients,
        error,
        count,
      } = await query
        .order("createdAt", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error getting clients by tenant:", error);
        throw new Error(`Failed to get clients: ${error.message}`);
      }

      const formattedClients: ClientResponse[] = clients.map((client) =>
        this.formatClientResponse(client)
      );

      return {
        clients: formattedClients,
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error("Error in getClientsByTenant:", error);
      throw error;
    }
  }

  /**
   * Update client
   */
  static async updateClient(
    clientId: string,
    data: UpdateClientRequest
  ): Promise<ClientResponse> {
    try {
      // Validate email uniqueness if being updated
      if (data.email) {
        const { data: existingClient } = await supabaseAdmin
          .from("clients")
          .select("id, tenantId")
          .eq("email", data.email)
          .neq("id", clientId)
          .single();

        if (existingClient) {
          throw new Error(
            `Client with email '${data.email}' already exists in this tenant`
          );
        }
      }

      const { data: client, error } = await supabaseAdmin
        .from("clients")
        .update({
          ...data,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", clientId)
        .select(
          `
          *,
          tenants:tenantId(id, name, slug),
          users:users(count)
        `
        )
        .single();

      if (error) {
        console.error("Error updating client:", error);
        throw new Error(`Failed to update client: ${error.message}`);
      }

      console.log(`✅ Updated client: ${client.name}`);

      return this.formatClientResponse(client);
    } catch (error) {
      console.error("Error in updateClient:", error);
      throw error;
    }
  }

  /**
   * Delete client (soft delete by setting status to INACTIVE)
   */
  static async deleteClient(
    clientId: string,
    hardDelete: boolean = false
  ): Promise<void> {
    try {
      if (hardDelete) {
        // Check if client has associated users
        const { count: userCount } = await supabaseAdmin
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("clientId", clientId);

        if (userCount && userCount > 0) {
          throw new Error(
            `Cannot delete client: ${userCount} users are still associated with this client`
          );
        }

        // Hard delete - remove client record
        const { error } = await supabaseAdmin
          .from("clients")
          .delete()
          .eq("id", clientId);

        if (error) {
          console.error("Error hard deleting client:", error);
          throw new Error(`Failed to delete client: ${error.message}`);
        }

        console.log(`🗑️ Hard deleted client: ${clientId}`);
      } else {
        // Soft delete - set status to INACTIVE
        await this.updateClient(clientId, {
          status: "INACTIVE" as ClientStatus,
        });
        console.log(`🔒 Soft deleted client: ${clientId}`);
      }
    } catch (error) {
      console.error("Error in deleteClient:", error);
      throw error;
    }
  }

  /**
   * Convert lead to prospect
   */
  static async convertToProspect(clientId: string): Promise<ClientResponse> {
    return this.updateClient(clientId, { status: "PROSPECT" as ClientStatus });
  }

  /**
   * Activate client
   */
  static async activateClient(clientId: string): Promise<ClientResponse> {
    return this.updateClient(clientId, { status: "ACTIVE" as ClientStatus });
  }

  /**
   * Mark client as churned
   */
  static async churnClient(
    clientId: string,
    notes?: string
  ): Promise<ClientResponse> {
    const updateData: UpdateClientRequest = {
      status: "CHURNED" as ClientStatus,
    };
    if (notes) {
      updateData.notes = notes;
    }
    return this.updateClient(clientId, updateData);
  }

  /**
   * Get client statistics for a tenant
   */
  static async getClientStats(tenantId: string): Promise<{
    totalClients: number;
    leadClients: number;
    prospectClients: number;
    activeClients: number;
    inactiveClients: number;
    churnedClients: number;
    clientsByStatus: Record<ClientStatus, number>;
    recentClients: number;
  }> {
    try {
      // Get total client count
      const { count: totalClients } = await supabaseAdmin
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("tenantId", tenantId);

      // Get clients by status
      const { data: statusData } = await supabaseAdmin
        .from("clients")
        .select("status")
        .eq("tenantId", tenantId);

      const clientsByStatus: Record<ClientStatus, number> = {
        LEAD: 0,
        PROSPECT: 0,
        ACTIVE: 0,
        INACTIVE: 0,
        CHURNED: 0,
      };

      statusData?.forEach((client) => {
        clientsByStatus[client.status as ClientStatus]++;
      });

      // Get recent clients (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: recentClients } = await supabaseAdmin
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
    } catch (error) {
      console.error("Error getting client stats:", error);
      throw new Error("Failed to get client statistics");
    }
  }

  /**
   * Format client response with computed fields
   */
  private static formatClientResponse(client: any): ClientResponse {
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
