import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
export declare const generateSOXReport: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const downloadSOXReport: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const generateGDPRReport: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const downloadGDPRReport: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const generateDataSubjectReport: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const generateHIPAAReport: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const downloadHIPAAReport: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const generatePatientAccessLog: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const generatePCIDSSReport: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const downloadPCIDSSReport: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getComplianceDashboard: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getComplianceAlerts: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=complianceController.d.ts.map