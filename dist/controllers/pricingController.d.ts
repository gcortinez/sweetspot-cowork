import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
declare class PricingController {
    createPricingTier(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getPricingTiers(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getPricingTierById(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updatePricingTier(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    deletePricingTier(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    createPricingRule(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getPricingRules(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updatePricingRule(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    deletePricingRule(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    calculatePrice(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getPlansWithPricing(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    bulkUpdatePrices(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getPreviewPricing(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getRulesByTier(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    validatePricingRule(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    private timeRangesOverlap;
}
export declare const pricingController: PricingController;
export {};
//# sourceMappingURL=pricingController.d.ts.map