import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/api";
export interface RequestLoggerOptions {
    includeBody?: boolean;
    includeQuery?: boolean;
    includeHeaders?: boolean;
    excludePaths?: string[];
    excludeHealthCheck?: boolean;
}
export declare const requestLogger: (options?: RequestLoggerOptions) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const correlationId: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export default requestLogger;
//# sourceMappingURL=requestLogger.d.ts.map