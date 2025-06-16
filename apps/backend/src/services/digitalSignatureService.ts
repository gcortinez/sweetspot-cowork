import { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError, NotFoundError, ValidationError } from "../utils/errors";
import crypto from "crypto";

export enum SignatureStatus {
  PENDING = "PENDING",
  SIGNED = "SIGNED",
  DECLINED = "DECLINED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum SignatureType {
  SIMPLE = "SIMPLE", // Simple click-to-sign
  DRAWN = "DRAWN", // Hand-drawn signature
  TYPED = "TYPED", // Typed signature
  CERTIFICATE = "CERTIFICATE", // Digital certificate-based
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
  signatureData: string; // Base64 encoded signature image or typed text
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
  sortOrder: "asc" | "desc";
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

class DigitalSignatureService {
  async createSignatureWorkflow(
    tenantId: string,
    createdBy: string,
    data: CreateSignatureWorkflowData
  ): Promise<SignatureWorkflow> {
    // Validate signers and signature fields
    this.validateSignersAndFields(data.signers, data.signatureFields);

    // Generate unique access tokens for each signer
    const signersWithTokens = data.signers.map((signer) => ({
      ...signer,
      accessToken: this.generateAccessToken(),
    }));

    const workflow: SignatureWorkflow = {
      id: this.generateId(),
      tenantId,
      contractId: data.contractId,
      title: data.title,
      documentContent: data.documentContent,
      documentUrl: data.documentUrl,
      status: SignatureStatus.PENDING,
      signers: signersWithTokens,
      signatureFields: data.signatureFields,
      signatures: [],
      message: data.message,
      expiresAt: data.expiresAt,
      requireAllSigners: data.requireAllSigners ?? true,
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
    };

    // Create audit trail entry
    await this.createAuditTrail(workflow.id, "WORKFLOW_CREATED", createdBy, {
      title: data.title,
      signerCount: data.signers.length,
      fieldCount: data.signatureFields.length,
    });

    // In a real implementation, this would send notification emails to signers
    await this.notifySigners(workflow, "SIGNATURE_REQUEST");

    return workflow;
  }

  async getSignatureWorkflows(
    tenantId: string,
    query: SignatureWorkflowQuery
  ): Promise<{
    workflows: SignatureWorkflow[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    // Mock implementation - in reality this would query the database
    const mockWorkflows: SignatureWorkflow[] = [
      {
        id: "workflow-1",
        tenantId,
        contractId: "contract-1",
        title: "Membership Agreement - John Doe",
        documentContent: "Sample contract content...",
        status: SignatureStatus.PENDING,
        signers: [
          {
            id: "signer-1",
            name: "John Doe",
            email: "john@example.com",
            role: "Client",
            order: 1,
            isRequired: true,
            clientId: "client-1",
          },
          {
            id: "signer-2",
            name: "Manager Smith",
            email: "manager@company.com",
            role: "Company Representative",
            order: 2,
            isRequired: true,
            userId: "user-1",
          },
        ],
        signatureFields: [
          {
            id: "field-1",
            x: 100,
            y: 500,
            width: 200,
            height: 50,
            page: 1,
            signerId: "signer-1",
            type: SignatureType.DRAWN,
            required: true,
            label: "Client Signature",
          },
          {
            id: "field-2",
            x: 350,
            y: 500,
            width: 200,
            height: 50,
            page: 1,
            signerId: "signer-2",
            type: SignatureType.DRAWN,
            required: true,
            label: "Company Representative",
          },
        ],
        signatures: [],
        message: "Please review and sign the membership agreement.",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        requireAllSigners: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "user-admin",
      },
    ];

    // Apply filters
    let filteredWorkflows = mockWorkflows;

    if (query.status) {
      filteredWorkflows = filteredWorkflows.filter(
        (w) => w.status === query.status
      );
    }

    if (query.contractId) {
      filteredWorkflows = filteredWorkflows.filter(
        (w) => w.contractId === query.contractId
      );
    }

    if (query.signerId) {
      filteredWorkflows = filteredWorkflows.filter((w) =>
        w.signers.some((s) => s.id === query.signerId)
      );
    }

    // Apply pagination
    const offset = (query.page - 1) * query.limit;
    const paginatedWorkflows = filteredWorkflows.slice(
      offset,
      offset + query.limit
    );

    return {
      workflows: paginatedWorkflows,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: filteredWorkflows.length,
        pages: Math.ceil(filteredWorkflows.length / query.limit),
      },
    };
  }

  async getWorkflowById(
    tenantId: string,
    workflowId: string
  ): Promise<SignatureWorkflow> {
    // Mock implementation
    const workflows = await this.getSignatureWorkflows(tenantId, {
      page: 1,
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    const workflow = workflows.workflows.find((w) => w.id === workflowId);

    if (!workflow) {
      throw new NotFoundError("Signature workflow not found");
    }

    return workflow;
  }

  async updateWorkflow(
    tenantId: string,
    workflowId: string,
    data: UpdateSignatureWorkflowData
  ): Promise<SignatureWorkflow> {
    const workflow = await this.getWorkflowById(tenantId, workflowId);

    if (workflow.status !== SignatureStatus.PENDING) {
      throw new ValidationError(
        "Cannot update workflow that is not in pending status"
      );
    }

    const updatedWorkflow: SignatureWorkflow = {
      ...workflow,
      ...data,
      updatedAt: new Date(),
    };

    return updatedWorkflow;
  }

  async signDocument(
    tenantId: string,
    workflowId: string,
    signerId: string,
    data: SignDocumentData
  ): Promise<{ success: boolean; workflow: SignatureWorkflow }> {
    const workflow = await this.getWorkflowById(tenantId, workflowId);

    if (workflow.status !== SignatureStatus.PENDING) {
      throw new ValidationError("Workflow is not in pending status");
    }

    if (workflow.expiresAt && new Date() > workflow.expiresAt) {
      throw new ValidationError("Signature workflow has expired");
    }

    // Validate signer
    const signer = workflow.signers.find((s) => s.id === signerId);
    if (!signer) {
      throw new NotFoundError("Signer not found in this workflow");
    }

    // Validate signature field
    const signatureField = workflow.signatureFields.find(
      (f) => f.id === data.signatureFieldId
    );
    if (!signatureField) {
      throw new NotFoundError("Signature field not found");
    }

    if (signatureField.signerId !== signerId) {
      throw new ValidationError(
        "Signature field does not belong to this signer"
      );
    }

    // Check if already signed
    const existingSignature = workflow.signatures.find(
      (s) => s.signatureFieldId === data.signatureFieldId
    );
    if (existingSignature) {
      throw new ValidationError("Field has already been signed");
    }

    // Create signature record
    const signature: WorkflowSignature = {
      id: this.generateId(),
      signatureFieldId: data.signatureFieldId,
      signerId,
      signerName: signer.name,
      signerEmail: signer.email,
      signatureType: data.signatureType,
      signatureData: data.signatureData,
      signedAt: new Date(),
      ipAddress: data.signerDetails.ipAddress,
      userAgent: data.signerDetails.userAgent,
      verificationHash: this.generateVerificationHash(data, signer),
    };

    // Add signature to workflow
    const updatedSignatures = [...workflow.signatures, signature];

    // Check if all required signatures are complete
    const requiredFields = workflow.signatureFields.filter((f) => f.required);
    const completedRequiredFields = requiredFields.filter((field) =>
      updatedSignatures.some((sig) => sig.signatureFieldId === field.id)
    );

    let newStatus: SignatureStatus = workflow.status;
    let completedAt = workflow.completedAt;

    if (completedRequiredFields.length === requiredFields.length) {
      // All required signatures completed
      if (workflow.requireAllSigners) {
        const allOptionalFields = workflow.signatureFields.filter(
          (f) => !f.required
        );
        const completedOptionalFields = allOptionalFields.filter((field) =>
          updatedSignatures.some((sig) => sig.signatureFieldId === field.id)
        );

        if (
          completedOptionalFields.length === allOptionalFields.length ||
          allOptionalFields.length === 0
        ) {
          newStatus = SignatureStatus.SIGNED;
          completedAt = new Date();
        }
      } else {
        newStatus = SignatureStatus.SIGNED;
        completedAt = new Date();
      }
    }

    const updatedWorkflow: SignatureWorkflow = {
      ...workflow,
      signatures: updatedSignatures,
      status: newStatus,
      completedAt,
      updatedAt: new Date(),
    };

    // Create audit trail
    await this.createAuditTrail(workflowId, "DOCUMENT_SIGNED", signerId, {
      signatureFieldId: data.signatureFieldId,
      signatureType: data.signatureType,
      signerName: signer.name,
      signerEmail: signer.email,
    });

    // Notify other signers if workflow is completed
    if (newStatus === SignatureStatus.SIGNED) {
      await this.notifySigners(updatedWorkflow, "SIGNATURE_COMPLETED");
    }

    return {
      success: true,
      workflow: updatedWorkflow,
    };
  }

  async declineSignature(
    tenantId: string,
    workflowId: string,
    signerId: string,
    reason?: string
  ): Promise<SignatureWorkflow> {
    const workflow = await this.getWorkflowById(tenantId, workflowId);

    if (workflow.status !== SignatureStatus.PENDING) {
      throw new ValidationError("Workflow is not in pending status");
    }

    const signer = workflow.signers.find((s) => s.id === signerId);
    if (!signer) {
      throw new NotFoundError("Signer not found in this workflow");
    }

    const updatedWorkflow: SignatureWorkflow = {
      ...workflow,
      status: SignatureStatus.DECLINED,
      updatedAt: new Date(),
    };

    // Create audit trail
    await this.createAuditTrail(workflowId, "SIGNATURE_DECLINED", signerId, {
      signerName: signer.name,
      signerEmail: signer.email,
      reason: reason || "No reason provided",
    });

    // Notify stakeholders
    await this.notifySigners(updatedWorkflow, "SIGNATURE_DECLINED");

    return updatedWorkflow;
  }

  async cancelWorkflow(
    tenantId: string,
    workflowId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<SignatureWorkflow> {
    const workflow = await this.getWorkflowById(tenantId, workflowId);

    if (workflow.status === SignatureStatus.SIGNED) {
      throw new ValidationError("Cannot cancel a completed workflow");
    }

    const updatedWorkflow: SignatureWorkflow = {
      ...workflow,
      status: SignatureStatus.CANCELLED,
      updatedAt: new Date(),
    };

    // Create audit trail
    await this.createAuditTrail(workflowId, "WORKFLOW_CANCELLED", cancelledBy, {
      reason: reason || "No reason provided",
    });

    // Notify signers
    await this.notifySigners(updatedWorkflow, "SIGNATURE_CANCELLED");

    return updatedWorkflow;
  }

  async getSignerView(
    tenantId: string,
    workflowId: string,
    signerId: string
  ): Promise<{
    workflow: Partial<SignatureWorkflow>;
    signerFields: SignatureField[];
    canSign: boolean;
    isExpired: boolean;
  }> {
    const workflow = await this.getWorkflowById(tenantId, workflowId);

    const signer = workflow.signers.find((s) => s.id === signerId);
    if (!signer) {
      throw new NotFoundError("Signer not found in this workflow");
    }

    const signerFields = workflow.signatureFields.filter(
      (f) => f.signerId === signerId
    );
    const signedFields = workflow.signatures.filter(
      (s) => s.signerId === signerId
    );

    const canSign =
      workflow.status === SignatureStatus.PENDING &&
      (!workflow.expiresAt || new Date() <= workflow.expiresAt) &&
      signedFields.length < signerFields.length;

    const isExpired = workflow.expiresAt
      ? new Date() > workflow.expiresAt
      : false;

    return {
      workflow: {
        id: workflow.id,
        title: workflow.title,
        documentContent: workflow.documentContent,
        documentUrl: workflow.documentUrl,
        status: workflow.status,
        message: workflow.message,
        expiresAt: workflow.expiresAt,
        signatures: workflow.signatures,
      },
      signerFields,
      canSign,
      isExpired,
    };
  }

  async getAuditTrail(
    tenantId: string,
    workflowId: string
  ): Promise<SignatureAuditTrail[]> {
    // Mock implementation
    return [
      {
        id: "audit-1",
        workflowId,
        action: "WORKFLOW_CREATED",
        performedBy: "user-admin",
        performedAt: new Date(),
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
        details: {
          title: "Membership Agreement - John Doe",
          signerCount: 2,
          fieldCount: 2,
        },
      },
    ];
  }

  async verifySignature(
    tenantId: string,
    workflowId: string,
    signatureId: string
  ): Promise<{
    isValid: boolean;
    signature: WorkflowSignature;
    verificationDetails: Record<string, any>;
  }> {
    const workflow = await this.getWorkflowById(tenantId, workflowId);
    const signature = workflow.signatures.find((s) => s.id === signatureId);

    if (!signature) {
      throw new NotFoundError("Signature not found");
    }

    // Verify the signature hash
    const expectedHash = this.generateVerificationHash(
      {
        signatureFieldId: signature.signatureFieldId,
        signatureType: signature.signatureType,
        signatureData: signature.signatureData,
        signerDetails: {
          ipAddress: signature.ipAddress,
          userAgent: signature.userAgent,
          timestamp: signature.signedAt,
        },
      },
      {
        id: signature.signerId,
        name: signature.signerName,
        email: signature.signerEmail,
      } as Signer
    );

    const isValid = expectedHash === signature.verificationHash;

    return {
      isValid,
      signature,
      verificationDetails: {
        expectedHash,
        actualHash: signature.verificationHash,
        signedAt: signature.signedAt,
        ipAddress: signature.ipAddress,
        userAgent: signature.userAgent,
      },
    };
  }

  private validateSignersAndFields(
    signers: Signer[],
    fields: SignatureField[]
  ): void {
    // Validate that all signature fields have corresponding signers
    const signerIds = new Set(signers.map((s) => s.id));

    for (const field of fields) {
      if (!signerIds.has(field.signerId)) {
        throw new ValidationError(
          `Signature field ${field.id} references non-existent signer ${field.signerId}`
        );
      }
    }

    // Validate signer order uniqueness
    const orders = signers.map((s) => s.order);
    if (new Set(orders).size !== orders.length) {
      throw new ValidationError("Signer orders must be unique");
    }

    // Validate email uniqueness
    const emails = signers.map((s) => s.email.toLowerCase());
    if (new Set(emails).size !== emails.length) {
      throw new ValidationError("Signer emails must be unique");
    }
  }

  private async createAuditTrail(
    workflowId: string,
    action: string,
    performedBy: string,
    details: Record<string, any>
  ): Promise<void> {
    // In a real implementation, this would store audit trail in database
    const auditEntry: SignatureAuditTrail = {
      id: this.generateId(),
      workflowId,
      action,
      performedBy,
      performedAt: new Date(),
      ipAddress: "192.168.1.1", // Would come from request
      userAgent: "Unknown", // Would come from request
      details,
    };

    // Store audit entry (mock)
    console.log("Audit trail created:", auditEntry);
  }

  private async notifySigners(
    workflow: SignatureWorkflow,
    eventType: string
  ): Promise<void> {
    // In a real implementation, this would send emails or notifications
    console.log(
      `Notifying signers for workflow ${workflow.id}, event: ${eventType}`
    );

    for (const signer of workflow.signers) {
      console.log(`Notification sent to ${signer.email}`);
    }
  }

  private generateVerificationHash(
    data: SignDocumentData,
    signer: Signer
  ): string {
    const hashInput = JSON.stringify({
      signatureFieldId: data.signatureFieldId,
      signatureType: data.signatureType,
      signatureData: data.signatureData,
      signerId: signer.id,
      signerEmail: signer.email,
      timestamp: data.signerDetails.timestamp,
      ipAddress: data.signerDetails.ipAddress,
    });

    return crypto.createHash("sha256").update(hashInput).digest("hex");
  }

  private generateAccessToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private generateId(): string {
    return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const digitalSignatureService = new DigitalSignatureService();
