import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/api';
export declare const ENCRYPTED_FIELDS: {
    user: string[];
    client: string[];
    visitor: string[];
    payment: string[];
    contract: string[];
    quotation: string[];
    communication: string[];
    lead: string[];
    opportunity: string[];
};
export declare const encryptSensitiveFields: (entityType: keyof typeof ENCRYPTED_FIELDS) => (req: Request, res: Response, next: NextFunction) => void;
export declare const decryptSensitiveFields: (entityType: keyof typeof ENCRYPTED_FIELDS) => (req: Request, res: Response, next: NextFunction) => void;
export declare const enforceHTTPS: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const secureDataTransit: (req: Request, res: Response, next: NextFunction) => void;
export declare const logEncryptedDataAccess: (entityType: keyof typeof ENCRYPTED_FIELDS) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const encryptDatabaseField: (value: string | null, fieldName: string) => string | null;
export declare const decryptDatabaseField: (encryptedValue: string | null, fieldName: string) => string | null;
export declare const createPrismaEncryptionMiddleware: () => (params: any, next: any) => Promise<any>;
//# sourceMappingURL=encryption.d.ts.map