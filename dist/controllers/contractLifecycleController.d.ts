import { Request, Response } from 'express';
export declare class ContractLifecycleController {
    createContract(req: Request, res: Response): Promise<Response>;
    getContracts(req: Request, res: Response): Promise<Response>;
    getContractById(req: Request, res: Response): Promise<Response>;
    updateContract(req: Request, res: Response): Promise<Response>;
    activateContract(req: Request, res: Response): Promise<Response>;
    suspendContract(req: Request, res: Response): Promise<Response>;
    reactivateContract(req: Request, res: Response): Promise<Response>;
    terminateContract(req: Request, res: Response): Promise<Response>;
    cancelContract(req: Request, res: Response): Promise<Response>;
    getContractActivity(req: Request, res: Response): Promise<Response>;
    getContractStats(req: Request, res: Response): Promise<Response>;
    getExpiringContracts(req: Request, res: Response): Promise<Response>;
    sendContractForSignature(req: Request, res: Response): Promise<Response>;
}
export declare const contractLifecycleController: ContractLifecycleController;
//# sourceMappingURL=contractLifecycleController.d.ts.map