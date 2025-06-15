export declare enum SignatureStatus {
    PENDING = "PENDING",
    SIGNED = "SIGNED",
    DECLINED = "DECLINED",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED"
}
export declare enum SignatureType {
    SIMPLE = "SIMPLE",
    DRAWN = "DRAWN",
    TYPED = "TYPED",
    CERTIFICATE = "CERTIFICATE"
}
interface SignatureField {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    signerId: string;
    type: SignatureType;
    required: boolean;
    label?: string;
}
interface Signer {
    id: string;
    name: string;
    email: string;
    role?: string;
    order: number;
    isRequired: boolean;
    userId?: string;
    clientId?: string;
}
interface CreateSignatureWorkflowData {
    contractId: string;
    title: string;
    documentContent: string;
    documentUrl?: string;
    signers: Signer[];
    signatureFields: SignatureField[];
    message?: string;
    expiresAt?: Date;
    requireAllSigners?: boolean;
    metadata?: Record<string, any>;
}
interface UpdateSignatureWorkflowData {
    title?: string;
    message?: string;
    expiresAt?: Date;
    requireAllSigners?: boolean;
    metadata?: Record<string, any>;
}
interface SignDocumentData {
    signatureFieldId: string;
    signatureType: SignatureType;
    signatureData: string;
    signerDetails: {
        ipAddress: string;
        userAgent: string;
        timestamp: Date;
    };
}
interface SignatureWorkflowQuery {
    page: number;
    limit: number;
    status?: SignatureStatus;
    contractId?: string;
    signerId?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}
interface SignatureWorkflow {
    id: string;
    tenantId: string;
    contractId: string;
    title: string;
    documentContent: string;
    documentUrl?: string;
    status: SignatureStatus;
    signers: Signer[];
    signatureFields: SignatureField[];
    signatures: WorkflowSignature[];
    message?: string;
    expiresAt?: Date;
    requireAllSigners: boolean;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    createdBy: string;
}
interface WorkflowSignature {
    id: string;
    signatureFieldId: string;
    signerId: string;
    signerName: string;
    signerEmail: string;
    signatureType: SignatureType;
    signatureData: string;
    signedAt: Date;
    ipAddress: string;
    userAgent: string;
    verificationHash: string;
}
interface SignatureAuditTrail {
    id: string;
    workflowId: string;
    action: string;
    performedBy: string;
    performedAt: Date;
    ipAddress: string;
    userAgent: string;
    details: Record<string, any>;
}
declare class DigitalSignatureService {
    createSignatureWorkflow(tenantId: string, createdBy: string, data: CreateSignatureWorkflowData): Promise<SignatureWorkflow>;
    getSignatureWorkflows(tenantId: string, query: SignatureWorkflowQuery): Promise<{
        workflows: SignatureWorkflow[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getWorkflowById(tenantId: string, workflowId: string): Promise<SignatureWorkflow>;
    updateWorkflow(tenantId: string, workflowId: string, data: UpdateSignatureWorkflowData): Promise<SignatureWorkflow>;
    signDocument(tenantId: string, workflowId: string, signerId: string, data: SignDocumentData): Promise<{
        success: boolean;
        workflow: SignatureWorkflow;
    }>;
    declineSignature(tenantId: string, workflowId: string, signerId: string, reason?: string): Promise<SignatureWorkflow>;
    cancelWorkflow(tenantId: string, workflowId: string, cancelledBy: string, reason?: string): Promise<SignatureWorkflow>;
    getSignerView(tenantId: string, workflowId: string, signerId: string): Promise<{
        workflow: Partial<SignatureWorkflow>;
        signerFields: SignatureField[];
        canSign: boolean;
        isExpired: boolean;
    }>;
    getAuditTrail(tenantId: string, workflowId: string): Promise<SignatureAuditTrail[]>;
    verifySignature(tenantId: string, workflowId: string, signatureId: string): Promise<{
        isValid: boolean;
        signature: WorkflowSignature;
        verificationDetails: Record<string, any>;
    }>;
    private validateSignersAndFields;
    private createAuditTrail;
    private notifySigners;
    private generateVerificationHash;
    private generateAccessToken;
    private generateId;
}
export declare const digitalSignatureService: DigitalSignatureService;
export {};
//# sourceMappingURL=digitalSignatureService.d.ts.map