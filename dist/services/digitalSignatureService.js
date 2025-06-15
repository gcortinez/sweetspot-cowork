"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.digitalSignatureService = exports.SignatureType = exports.SignatureStatus = void 0;
const errors_1 = require("../utils/errors");
const crypto_1 = __importDefault(require("crypto"));
var SignatureStatus;
(function (SignatureStatus) {
    SignatureStatus["PENDING"] = "PENDING";
    SignatureStatus["SIGNED"] = "SIGNED";
    SignatureStatus["DECLINED"] = "DECLINED";
    SignatureStatus["EXPIRED"] = "EXPIRED";
    SignatureStatus["CANCELLED"] = "CANCELLED";
})(SignatureStatus || (exports.SignatureStatus = SignatureStatus = {}));
var SignatureType;
(function (SignatureType) {
    SignatureType["SIMPLE"] = "SIMPLE";
    SignatureType["DRAWN"] = "DRAWN";
    SignatureType["TYPED"] = "TYPED";
    SignatureType["CERTIFICATE"] = "CERTIFICATE";
})(SignatureType || (exports.SignatureType = SignatureType = {}));
class DigitalSignatureService {
    async createSignatureWorkflow(tenantId, createdBy, data) {
        this.validateSignersAndFields(data.signers, data.signatureFields);
        const signersWithTokens = data.signers.map(signer => ({
            ...signer,
            accessToken: this.generateAccessToken(),
        }));
        const workflow = {
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
        await this.createAuditTrail(workflow.id, 'WORKFLOW_CREATED', createdBy, {
            title: data.title,
            signerCount: data.signers.length,
            fieldCount: data.signatureFields.length,
        });
        await this.notifySigners(workflow, 'SIGNATURE_REQUEST');
        return workflow;
    }
    async getSignatureWorkflows(tenantId, query) {
        const mockWorkflows = [
            {
                id: 'workflow-1',
                tenantId,
                contractId: 'contract-1',
                title: 'Membership Agreement - John Doe',
                documentContent: 'Sample contract content...',
                status: SignatureStatus.PENDING,
                signers: [
                    {
                        id: 'signer-1',
                        name: 'John Doe',
                        email: 'john@example.com',
                        role: 'Client',
                        order: 1,
                        isRequired: true,
                        clientId: 'client-1',
                    },
                    {
                        id: 'signer-2',
                        name: 'Manager Smith',
                        email: 'manager@company.com',
                        role: 'Company Representative',
                        order: 2,
                        isRequired: true,
                        userId: 'user-1',
                    },
                ],
                signatureFields: [
                    {
                        id: 'field-1',
                        x: 100,
                        y: 500,
                        width: 200,
                        height: 50,
                        page: 1,
                        signerId: 'signer-1',
                        type: SignatureType.DRAWN,
                        required: true,
                        label: 'Client Signature',
                    },
                    {
                        id: 'field-2',
                        x: 350,
                        y: 500,
                        width: 200,
                        height: 50,
                        page: 1,
                        signerId: 'signer-2',
                        type: SignatureType.DRAWN,
                        required: true,
                        label: 'Company Representative',
                    },
                ],
                signatures: [],
                message: 'Please review and sign the membership agreement.',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                requireAllSigners: true,
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'user-admin',
            },
        ];
        let filteredWorkflows = mockWorkflows;
        if (query.status) {
            filteredWorkflows = filteredWorkflows.filter(w => w.status === query.status);
        }
        if (query.contractId) {
            filteredWorkflows = filteredWorkflows.filter(w => w.contractId === query.contractId);
        }
        if (query.signerId) {
            filteredWorkflows = filteredWorkflows.filter(w => w.signers.some(s => s.id === query.signerId));
        }
        const offset = (query.page - 1) * query.limit;
        const paginatedWorkflows = filteredWorkflows.slice(offset, offset + query.limit);
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
    async getWorkflowById(tenantId, workflowId) {
        const workflows = await this.getSignatureWorkflows(tenantId, {
            page: 1,
            limit: 100,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });
        const workflow = workflows.workflows.find(w => w.id === workflowId);
        if (!workflow) {
            throw new errors_1.NotFoundError('Signature workflow not found');
        }
        return workflow;
    }
    async updateWorkflow(tenantId, workflowId, data) {
        const workflow = await this.getWorkflowById(tenantId, workflowId);
        if (workflow.status !== SignatureStatus.PENDING) {
            throw new errors_1.ValidationError('Cannot update workflow that is not in pending status');
        }
        const updatedWorkflow = {
            ...workflow,
            ...data,
            updatedAt: new Date(),
        };
        return updatedWorkflow;
    }
    async signDocument(tenantId, workflowId, signerId, data) {
        const workflow = await this.getWorkflowById(tenantId, workflowId);
        if (workflow.status !== SignatureStatus.PENDING) {
            throw new errors_1.ValidationError('Workflow is not in pending status');
        }
        if (workflow.expiresAt && new Date() > workflow.expiresAt) {
            throw new errors_1.ValidationError('Signature workflow has expired');
        }
        const signer = workflow.signers.find(s => s.id === signerId);
        if (!signer) {
            throw new errors_1.NotFoundError('Signer not found in this workflow');
        }
        const signatureField = workflow.signatureFields.find(f => f.id === data.signatureFieldId);
        if (!signatureField) {
            throw new errors_1.NotFoundError('Signature field not found');
        }
        if (signatureField.signerId !== signerId) {
            throw new errors_1.ValidationError('Signature field does not belong to this signer');
        }
        const existingSignature = workflow.signatures.find(s => s.signatureFieldId === data.signatureFieldId);
        if (existingSignature) {
            throw new errors_1.ValidationError('Field has already been signed');
        }
        const signature = {
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
        const updatedSignatures = [...workflow.signatures, signature];
        const requiredFields = workflow.signatureFields.filter(f => f.required);
        const completedRequiredFields = requiredFields.filter(field => updatedSignatures.some(sig => sig.signatureFieldId === field.id));
        let newStatus = workflow.status;
        let completedAt = workflow.completedAt;
        if (completedRequiredFields.length === requiredFields.length) {
            if (workflow.requireAllSigners) {
                const allOptionalFields = workflow.signatureFields.filter(f => !f.required);
                const completedOptionalFields = allOptionalFields.filter(field => updatedSignatures.some(sig => sig.signatureFieldId === field.id));
                if (completedOptionalFields.length === allOptionalFields.length || allOptionalFields.length === 0) {
                    newStatus = SignatureStatus.SIGNED;
                    completedAt = new Date();
                }
            }
            else {
                newStatus = SignatureStatus.SIGNED;
                completedAt = new Date();
            }
        }
        const updatedWorkflow = {
            ...workflow,
            signatures: updatedSignatures,
            status: newStatus,
            completedAt,
            updatedAt: new Date(),
        };
        await this.createAuditTrail(workflowId, 'DOCUMENT_SIGNED', signerId, {
            signatureFieldId: data.signatureFieldId,
            signatureType: data.signatureType,
            signerName: signer.name,
            signerEmail: signer.email,
        });
        if (newStatus === SignatureStatus.SIGNED) {
            await this.notifySigners(updatedWorkflow, 'SIGNATURE_COMPLETED');
        }
        return {
            success: true,
            workflow: updatedWorkflow,
        };
    }
    async declineSignature(tenantId, workflowId, signerId, reason) {
        const workflow = await this.getWorkflowById(tenantId, workflowId);
        if (workflow.status !== SignatureStatus.PENDING) {
            throw new errors_1.ValidationError('Workflow is not in pending status');
        }
        const signer = workflow.signers.find(s => s.id === signerId);
        if (!signer) {
            throw new errors_1.NotFoundError('Signer not found in this workflow');
        }
        const updatedWorkflow = {
            ...workflow,
            status: SignatureStatus.DECLINED,
            updatedAt: new Date(),
        };
        await this.createAuditTrail(workflowId, 'SIGNATURE_DECLINED', signerId, {
            signerName: signer.name,
            signerEmail: signer.email,
            reason: reason || 'No reason provided',
        });
        await this.notifySigners(updatedWorkflow, 'SIGNATURE_DECLINED');
        return updatedWorkflow;
    }
    async cancelWorkflow(tenantId, workflowId, cancelledBy, reason) {
        const workflow = await this.getWorkflowById(tenantId, workflowId);
        if (workflow.status === SignatureStatus.SIGNED) {
            throw new errors_1.ValidationError('Cannot cancel a completed workflow');
        }
        const updatedWorkflow = {
            ...workflow,
            status: SignatureStatus.CANCELLED,
            updatedAt: new Date(),
        };
        await this.createAuditTrail(workflowId, 'WORKFLOW_CANCELLED', cancelledBy, {
            reason: reason || 'No reason provided',
        });
        await this.notifySigners(updatedWorkflow, 'SIGNATURE_CANCELLED');
        return updatedWorkflow;
    }
    async getSignerView(tenantId, workflowId, signerId) {
        const workflow = await this.getWorkflowById(tenantId, workflowId);
        const signer = workflow.signers.find(s => s.id === signerId);
        if (!signer) {
            throw new errors_1.NotFoundError('Signer not found in this workflow');
        }
        const signerFields = workflow.signatureFields.filter(f => f.signerId === signerId);
        const signedFields = workflow.signatures.filter(s => s.signerId === signerId);
        const canSign = workflow.status === SignatureStatus.PENDING &&
            (!workflow.expiresAt || new Date() <= workflow.expiresAt) &&
            signedFields.length < signerFields.length;
        const isExpired = workflow.expiresAt ? new Date() > workflow.expiresAt : false;
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
    async getAuditTrail(tenantId, workflowId) {
        return [
            {
                id: 'audit-1',
                workflowId,
                action: 'WORKFLOW_CREATED',
                performedBy: 'user-admin',
                performedAt: new Date(),
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0...',
                details: {
                    title: 'Membership Agreement - John Doe',
                    signerCount: 2,
                    fieldCount: 2,
                },
            },
        ];
    }
    async verifySignature(tenantId, workflowId, signatureId) {
        const workflow = await this.getWorkflowById(tenantId, workflowId);
        const signature = workflow.signatures.find(s => s.id === signatureId);
        if (!signature) {
            throw new errors_1.NotFoundError('Signature not found');
        }
        const expectedHash = this.generateVerificationHash({
            signatureFieldId: signature.signatureFieldId,
            signatureType: signature.signatureType,
            signatureData: signature.signatureData,
            signerDetails: {
                ipAddress: signature.ipAddress,
                userAgent: signature.userAgent,
                timestamp: signature.signedAt,
            },
        }, {
            id: signature.signerId,
            name: signature.signerName,
            email: signature.signerEmail,
        });
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
    validateSignersAndFields(signers, fields) {
        const signerIds = new Set(signers.map(s => s.id));
        for (const field of fields) {
            if (!signerIds.has(field.signerId)) {
                throw new errors_1.ValidationError(`Signature field ${field.id} references non-existent signer ${field.signerId}`);
            }
        }
        const orders = signers.map(s => s.order);
        if (new Set(orders).size !== orders.length) {
            throw new errors_1.ValidationError('Signer orders must be unique');
        }
        const emails = signers.map(s => s.email.toLowerCase());
        if (new Set(emails).size !== emails.length) {
            throw new errors_1.ValidationError('Signer emails must be unique');
        }
    }
    async createAuditTrail(workflowId, action, performedBy, details) {
        const auditEntry = {
            id: this.generateId(),
            workflowId,
            action,
            performedBy,
            performedAt: new Date(),
            ipAddress: '192.168.1.1',
            userAgent: 'Unknown',
            details,
        };
        console.log('Audit trail created:', auditEntry);
    }
    async notifySigners(workflow, eventType) {
        console.log(`Notifying signers for workflow ${workflow.id}, event: ${eventType}`);
        for (const signer of workflow.signers) {
            console.log(`Notification sent to ${signer.email}`);
        }
    }
    generateVerificationHash(data, signer) {
        const hashInput = JSON.stringify({
            signatureFieldId: data.signatureFieldId,
            signatureType: data.signatureType,
            signatureData: data.signatureData,
            signerId: signer.id,
            signerEmail: signer.email,
            timestamp: data.signerDetails.timestamp,
            ipAddress: data.signerDetails.ipAddress,
        });
        return crypto_1.default.createHash('sha256').update(hashInput).digest('hex');
    }
    generateAccessToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    generateId() {
        return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.digitalSignatureService = new DigitalSignatureService();
//# sourceMappingURL=digitalSignatureService.js.map