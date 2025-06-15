import { Response } from "express";
import { ResponseMeta, HttpStatusCode, ErrorCode } from "../types/api";
export declare class ResponseHelper {
    private static createMeta;
    static success<T>(res: Response, data: T, message?: string, statusCode?: HttpStatusCode, meta?: Partial<ResponseMeta>): Response;
    static created<T>(res: Response, data: T, message?: string): Response;
    static noContent(res: Response, message?: string): Response;
    static error(res: Response, code: ErrorCode, message: string, statusCode?: HttpStatusCode, details?: any, field?: string): Response;
    static badRequest(res: Response, message: string, details?: any, field?: string): Response;
    static unauthorized(res: Response, message?: string): Response;
    static forbidden(res: Response, message?: string): Response;
    static notFound(res: Response, resource?: string): Response;
    static conflict(res: Response, message: string): Response;
    static validationError(res: Response, message: string, details?: any, field?: string): Response;
    static rateLimitExceeded(res: Response, retryAfter?: number): Response;
    static internalError(res: Response, message?: string): Response;
    static serviceUnavailable(res: Response, message?: string): Response;
    static paginated<T>(res: Response, data: T[], pagination: {
        page: number;
        limit: number;
        total: number;
    }, message?: string): Response;
    static fileUploadSuccess(res: Response, fileInfo: any, message?: string): Response;
    static fileTooLarge(res: Response, maxSize: string): Response;
    static invalidFileType(res: Response, allowedTypes: string[]): Response;
    static tenantNotFound(res: Response): Response;
    static tenantSuspended(res: Response): Response;
    static invalidTenant(res: Response): Response;
}
export declare const success: typeof ResponseHelper.success, created: typeof ResponseHelper.created, noContent: typeof ResponseHelper.noContent, error: typeof ResponseHelper.error, badRequest: typeof ResponseHelper.badRequest, unauthorized: typeof ResponseHelper.unauthorized, forbidden: typeof ResponseHelper.forbidden, notFound: typeof ResponseHelper.notFound, conflict: typeof ResponseHelper.conflict, validationError: typeof ResponseHelper.validationError, rateLimitExceeded: typeof ResponseHelper.rateLimitExceeded, internalError: typeof ResponseHelper.internalError, serviceUnavailable: typeof ResponseHelper.serviceUnavailable, paginated: typeof ResponseHelper.paginated, fileUploadSuccess: typeof ResponseHelper.fileUploadSuccess, fileTooLarge: typeof ResponseHelper.fileTooLarge, invalidFileType: typeof ResponseHelper.invalidFileType, tenantNotFound: typeof ResponseHelper.tenantNotFound, tenantSuspended: typeof ResponseHelper.tenantSuspended, invalidTenant: typeof ResponseHelper.invalidTenant;
export declare const handleController: <T>(controllerFn: () => Promise<T>, res: Response, statusCode?: HttpStatusCode) => Promise<Response>;
export declare const ApiResponse: typeof ResponseHelper;
export default ResponseHelper;
//# sourceMappingURL=response.d.ts.map