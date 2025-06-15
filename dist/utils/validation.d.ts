import { Request, Response, NextFunction } from "express";
import { z, ZodError, ZodSchema } from "zod";
export type ValidationTarget = "body" | "query" | "params" | "headers";
export interface ValidationOptions {
    allowUnknown?: boolean;
    stripUnknown?: boolean;
    abortEarly?: boolean;
}
export declare function validate(schema: ZodSchema, target?: ValidationTarget, options?: ValidationOptions): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateBody: (schema: ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateQuery: (schema: ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateParams: (schema: ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateHeaders: (schema: ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function formatZodErrors(error: ZodError): Array<{
    field: string;
    message: string;
    code: string;
    value?: any;
}>;
export declare function validateData<T>(schema: ZodSchema<T>, data: unknown): {
    success: true;
    data: T;
} | {
    success: false;
    errors: ReturnType<typeof formatZodErrors>;
};
export declare function validateAsync<T>(schema: ZodSchema<T>, data: unknown): Promise<T>;
export declare function validateMultiple(validations: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
    headers?: ZodSchema;
}, options?: ValidationOptions): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function validateConditional(condition: (req: Request) => boolean, schema: ZodSchema, target?: ValidationTarget): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function validateFileUpload(options: {
    maxSize?: number;
    allowedMimeTypes?: string[];
    required?: boolean;
}): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const CommonValidations: any;
export declare class ValidationError extends Error {
    errors: ReturnType<typeof formatZodErrors>;
    constructor(zodError: ZodError);
}
export declare const ValidationTransforms: {
    trimString: z.ZodEffects<z.ZodString, string, string>;
    stringToNumber: z.ZodEffects<z.ZodString, number, string>;
    stringToInt: z.ZodEffects<z.ZodString, number, string>;
    stringToBoolean: z.ZodEffects<z.ZodString, boolean, string>;
    csvToArray: z.ZodEffects<z.ZodString, string[], string>;
    toLowerCase: z.ZodEffects<z.ZodString, string, string>;
    toUpperCase: z.ZodEffects<z.ZodString, string, string>;
};
export declare const createValidationMiddleware: {
    crud: (schemas: {
        create?: ZodSchema;
        update?: ZodSchema;
        query?: ZodSchema;
    }) => {
        create: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | undefined;
        update: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | undefined;
        query: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | undefined;
        params: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    };
    paginated: (querySchema?: ZodSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    searchable: (querySchema?: ZodSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
};
declare const _default: {
    validate: typeof validate;
    validateBody: (schema: ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateQuery: (schema: ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateParams: (schema: ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateHeaders: (schema: ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateMultiple: typeof validateMultiple;
    validateConditional: typeof validateConditional;
    validateFileUpload: typeof validateFileUpload;
    validateData: typeof validateData;
    validateAsync: typeof validateAsync;
    formatZodErrors: typeof formatZodErrors;
    ValidationError: typeof ValidationError;
    CommonValidations: any;
    ValidationTransforms: {
        trimString: z.ZodEffects<z.ZodString, string, string>;
        stringToNumber: z.ZodEffects<z.ZodString, number, string>;
        stringToInt: z.ZodEffects<z.ZodString, number, string>;
        stringToBoolean: z.ZodEffects<z.ZodString, boolean, string>;
        csvToArray: z.ZodEffects<z.ZodString, string[], string>;
        toLowerCase: z.ZodEffects<z.ZodString, string, string>;
        toUpperCase: z.ZodEffects<z.ZodString, string, string>;
    };
    createValidationMiddleware: {
        crud: (schemas: {
            create?: ZodSchema;
            update?: ZodSchema;
            query?: ZodSchema;
        }) => {
            create: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | undefined;
            update: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | undefined;
            query: ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | undefined;
            params: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
        };
        paginated: (querySchema?: ZodSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
        searchable: (querySchema?: ZodSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    };
};
export default _default;
//# sourceMappingURL=validation.d.ts.map