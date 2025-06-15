import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client";
export interface CustomError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
    field?: string;
}
export declare class AppError extends Error implements CustomError {
    statusCode: number;
    code: string;
    details?: any;
    field?: string;
    constructor(message: string, statusCode?: number, code?: string, details?: any, field?: string);
}
export declare const errorHandler: (error: Error | CustomError | ZodError | PrismaClientKnownRequestError, req: Request, res: Response, next: NextFunction) => Response;
export declare const notFoundHandler: (req: Request, res: Response) => Response;
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
export default errorHandler;
//# sourceMappingURL=errorHandler.d.ts.map