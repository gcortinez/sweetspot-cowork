import { Request, Response } from 'express';
export declare class ContractRenewalController {
    createRenewalRule(req: Request, res: Response): Promise<Response>;
    getRenewalRules(req: Request, res: Response): Promise<Response>;
    updateRenewalRule(req: Request, res: Response): Promise<Response>;
    deleteRenewalRule(req: Request, res: Response): Promise<Response>;
    createRenewalProposal(req: Request, res: Response): Promise<Response>;
    getRenewalProposals(req: Request, res: Response): Promise<Response>;
    processRenewalProposal(req: Request, res: Response): Promise<Response>;
    checkAndCreateRenewals(req: Request, res: Response): Promise<Response>;
    getRenewalStats(req: Request, res: Response): Promise<Response>;
    toggleRuleStatus(req: Request, res: Response): Promise<Response>;
}
export declare const contractRenewalController: ContractRenewalController;
//# sourceMappingURL=contractRenewalController.d.ts.map