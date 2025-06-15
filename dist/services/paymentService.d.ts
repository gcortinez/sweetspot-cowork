import { Payment, PaymentMethod, PaymentStatus } from '@prisma/client';
interface CreatePaymentData {
    clientId: string;
    invoiceId?: string;
    amount: number;
    currency?: string;
    method: PaymentMethod;
    reference?: string;
    metadata?: Record<string, any>;
}
interface ProcessPaymentData {
    paymentIntentId?: string;
    transactionId?: string;
    gatewayResponse?: Record<string, any>;
}
interface PaymentQuery {
    page: number;
    limit: number;
    clientId?: string;
    invoiceId?: string;
    method?: PaymentMethod;
    status?: PaymentStatus;
    dateFrom?: string;
    dateTo?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}
interface PaymentStats {
    totalPayments: number;
    totalAmount: number;
    byMethod: Array<{
        method: PaymentMethod;
        count: number;
        amount: number;
        percentage: number;
    }>;
    byStatus: Array<{
        status: PaymentStatus;
        count: number;
        amount: number;
        percentage: number;
    }>;
    thisMonth: {
        count: number;
        amount: number;
    };
    thisWeek: {
        count: number;
        amount: number;
    };
    recentPayments: Array<{
        id: string;
        amount: number;
        method: PaymentMethod;
        status: PaymentStatus;
        clientName: string;
        createdAt: Date;
    }>;
}
interface PaymentWithRelations extends Payment {
    client: {
        id: string;
        name: string;
        email: string;
    };
    invoice?: {
        id: string;
        number: string;
        total: number;
        status: string;
    };
}
declare class PaymentService {
    createPayment(tenantId: string, data: CreatePaymentData): Promise<Payment>;
    processPayment(tenantId: string, paymentId: string, data: ProcessPaymentData): Promise<Payment>;
    getPayments(tenantId: string, query: PaymentQuery): Promise<{
        payments: PaymentWithRelations[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getPaymentById(tenantId: string, paymentId: string): Promise<PaymentWithRelations>;
    refundPayment(tenantId: string, paymentId: string, amount?: number): Promise<Payment>;
    getPaymentStats(tenantId: string): Promise<PaymentStats>;
    cancelPayment(tenantId: string, paymentId: string): Promise<Payment>;
    retryPayment(tenantId: string, paymentId: string): Promise<Payment>;
    getClientPayments(tenantId: string, clientId: string): Promise<Payment[]>;
    getInvoicePayments(tenantId: string, invoiceId: string): Promise<Payment[]>;
}
export declare const paymentService: PaymentService;
export {};
//# sourceMappingURL=paymentService.d.ts.map