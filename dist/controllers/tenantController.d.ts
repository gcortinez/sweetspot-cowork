import { Request, Response } from "express";
export declare class TenantController {
    static createTenant(req: Request, res: Response): Promise<void>;
    static getAllTenants(req: Request, res: Response): Promise<void>;
    static getTenantById(req: Request, res: Response): Promise<void>;
    static getTenantBySlug(req: Request, res: Response): Promise<void>;
    static updateTenant(req: Request, res: Response): Promise<void>;
    static deleteTenant(req: Request, res: Response): Promise<void>;
    static suspendTenant(req: Request, res: Response): Promise<void>;
    static activateTenant(req: Request, res: Response): Promise<void>;
    static getTenantStats(req: Request, res: Response): Promise<void>;
    static generateSlug(req: Request, res: Response): Promise<void>;
    static checkSlugAvailability(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=tenantController.d.ts.map