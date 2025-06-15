import { Request, Response } from 'express';
export declare class DigitalSignatureController {
    createWorkflow(req: Request, res: Response): Promise<Response>;
    getWorkflows(req: Request, res: Response): Promise<Response>;
    getWorkflowById(req: Request, res: Response): Promise<Response>;
    updateWorkflow(req: Request, res: Response): Promise<Response>;
    signDocument(req: Request, res: Response): Promise<Response>;
    declineSignature(req: Request, res: Response): Promise<Response>;
    cancelWorkflow(req: Request, res: Response): Promise<Response>;
    getSignerView(req: Request, res: Response): Promise<Response>;
    getAuditTrail(req: Request, res: Response): Promise<Response>;
    verifySignature(req: Request, res: Response): Promise<Response>;
}
export declare const digitalSignatureController: DigitalSignatureController;
//# sourceMappingURL=digitalSignatureController.d.ts.map