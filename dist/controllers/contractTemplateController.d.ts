import { Request, Response } from 'express';
export declare class ContractTemplateController {
    createTemplate(req: Request, res: Response): Promise<Response>;
    getTemplates(req: Request, res: Response): Promise<Response>;
    getTemplateById(req: Request, res: Response): Promise<Response>;
    updateTemplate(req: Request, res: Response): Promise<Response>;
    deleteTemplate(req: Request, res: Response): Promise<Response>;
    generateContract(req: Request, res: Response): Promise<Response>;
    getTemplateCategories(req: Request, res: Response): Promise<Response>;
    validateTemplate(req: Request, res: Response): Promise<Response>;
    duplicateTemplate(req: Request, res: Response): Promise<Response>;
    previewTemplate(req: Request, res: Response): Promise<Response>;
}
export declare const contractTemplateController: ContractTemplateController;
//# sourceMappingURL=contractTemplateController.d.ts.map