import { ClientStatus } from "@sweetspot/shared";
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
    tenant?: {
        id: string;
        name: string;
        slug: string;
    };
    userCount?: number;
}
export declare class ClientService {
    static createClient(data: CreateClientRequest): Promise<ClientResponse>;
    static getClientById(clientId: string): Promise<ClientResponse | null>;
    static getClientByEmail(email: string, tenantId: string): Promise<ClientResponse | null>;
    static getClientsByTenant(tenantId: string, page?: number, limit?: number, status?: ClientStatus, search?: string): Promise<{
        clients: ClientResponse[];
        total: number;
        page: number;
        limit: number;
    }>;
    static updateClient(clientId: string, data: UpdateClientRequest): Promise<ClientResponse>;
    static deleteClient(clientId: string, hardDelete?: boolean): Promise<void>;
    static convertToProspect(clientId: string): Promise<ClientResponse>;
    static activateClient(clientId: string): Promise<ClientResponse>;
    static churnClient(clientId: string, notes?: string): Promise<ClientResponse>;
    static getClientStats(tenantId: string): Promise<{
        totalClients: number;
        leadClients: number;
        prospectClients: number;
        activeClients: number;
        inactiveClients: number;
        churnedClients: number;
        clientsByStatus: Record<ClientStatus, number>;
        recentClients: number;
    }>;
    private static formatClientResponse;
}
//# sourceMappingURL=clientService.d.ts.map