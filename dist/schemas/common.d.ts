import { z } from "zod";
export declare const idSchema: z.ZodString;
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const phoneSchema: z.ZodOptional<z.ZodString>;
export declare const urlSchema: z.ZodOptional<z.ZodString>;
export declare const dateSchema: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>;
export declare const dateRangeSchema: z.ZodEffects<z.ZodObject<{
    from: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>>;
    to: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>>;
}, "strip", z.ZodTypeAny, {
    to?: Date | undefined;
    from?: Date | undefined;
}, {
    to?: string | Date | undefined;
    from?: string | Date | undefined;
}>, {
    to?: Date | undefined;
    from?: Date | undefined;
}, {
    to?: string | Date | undefined;
    from?: string | Date | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodEffects<z.ZodString, number, string>, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodEffects<z.ZodString, number, string>, number, string>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    page?: string | undefined;
    limit?: string | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const searchSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodEffects<z.ZodString, number, string>, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodEffects<z.ZodString, number, string>, number, string>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    query: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    query?: string | undefined;
    sortBy?: string | undefined;
}, {
    page?: string | undefined;
    limit?: string | undefined;
    query?: string | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const addressSchema: z.ZodObject<{
    street: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    postalCode: z.ZodString;
    country: z.ZodString;
}, "strip", z.ZodTypeAny, {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}, {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}>;
export declare const moneySchema: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    currency: string;
    amount: number;
}, {
    amount: number;
    currency?: string | undefined;
}>;
export declare const fileUploadSchema: z.ZodObject<{
    filename: z.ZodString;
    mimeType: z.ZodString;
    size: z.ZodNumber;
    url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    filename: string;
    mimeType: string;
    size: number;
    url?: string | undefined;
}, {
    filename: string;
    mimeType: string;
    size: number;
    url?: string | undefined;
}>;
export declare const coordinatesSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    latitude: number;
    longitude: number;
}, {
    latitude: number;
    longitude: number;
}>;
export declare const colorSchema: z.ZodOptional<z.ZodString>;
export declare const createEnumSchema: <T extends [string, ...string[]]>(values: T, errorMessage?: string) => z.ZodEnum<z.Writeable<T>>;
export declare const validateRequired: <T>(schema: z.ZodSchema<T>, fieldName: string) => z.ZodEffects<z.ZodType<T, z.ZodTypeDef, T>, T & {}, T>;
export declare const validateOptional: <T>(schema: z.ZodSchema<T>) => z.ZodNullable<z.ZodOptional<z.ZodType<T, z.ZodTypeDef, T>>>;
export declare const createArraySchema: <T>(itemSchema: z.ZodSchema<T>, options?: {
    minLength?: number;
    maxLength?: number;
    unique?: boolean;
}) => z.ZodArray<z.ZodType<T, z.ZodTypeDef, T>, "many">;
export declare const conditionalSchema: <T, U>(condition: (data: any) => boolean, schema: z.ZodSchema<T>, fallbackSchema?: z.ZodSchema<U>) => z.ZodEffects<z.ZodAny, any, any>;
export declare const stringToNumber: z.ZodEffects<z.ZodString, number, string>;
export declare const stringToInt: z.ZodEffects<z.ZodString, number, string>;
export declare const stringToBoolean: z.ZodEffects<z.ZodString, boolean, string>;
export declare const trimmedString: z.ZodEffects<z.ZodString, string, string>;
export declare const lowercaseString: z.ZodEffects<z.ZodString, string, string>;
export declare const uppercaseString: z.ZodEffects<z.ZodString, string, string>;
export declare const metadataSchema: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>>;
export declare const successResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: z.ZodAny;
    message: z.ZodOptional<z.ZodString>;
    meta: z.ZodObject<{
        timestamp: z.ZodString;
        version: z.ZodString;
        requestId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        version: string;
        requestId?: string | undefined;
    }, {
        timestamp: string;
        version: string;
        requestId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    success: true;
    meta: {
        timestamp: string;
        version: string;
        requestId?: string | undefined;
    };
    message?: string | undefined;
    data?: any;
}, {
    success: true;
    meta: {
        timestamp: string;
        version: string;
        requestId?: string | undefined;
    };
    message?: string | undefined;
    data?: any;
}>;
export declare const errorResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
        field: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        message: string;
        code: string;
        details?: any;
        field?: string | undefined;
    }, {
        timestamp: string;
        message: string;
        code: string;
        details?: any;
        field?: string | undefined;
    }>;
    meta: z.ZodObject<{
        timestamp: z.ZodString;
        version: z.ZodString;
        requestId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        version: string;
        requestId?: string | undefined;
    }, {
        timestamp: string;
        version: string;
        requestId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    error: {
        timestamp: string;
        message: string;
        code: string;
        details?: any;
        field?: string | undefined;
    };
    success: false;
    meta: {
        timestamp: string;
        version: string;
        requestId?: string | undefined;
    };
}, {
    error: {
        timestamp: string;
        message: string;
        code: string;
        details?: any;
        field?: string | undefined;
    };
    success: false;
    meta: {
        timestamp: string;
        version: string;
        requestId?: string | undefined;
    };
}>;
declare const _default: {
    idSchema: z.ZodString;
    emailSchema: z.ZodString;
    passwordSchema: z.ZodString;
    phoneSchema: z.ZodOptional<z.ZodString>;
    urlSchema: z.ZodOptional<z.ZodString>;
    dateSchema: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>;
    dateRangeSchema: z.ZodEffects<z.ZodObject<{
        from: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>>;
        to: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>>;
    }, "strip", z.ZodTypeAny, {
        to?: Date | undefined;
        from?: Date | undefined;
    }, {
        to?: string | Date | undefined;
        from?: string | Date | undefined;
    }>, {
        to?: Date | undefined;
        from?: Date | undefined;
    }, {
        to?: string | Date | undefined;
        from?: string | Date | undefined;
    }>;
    paginationSchema: z.ZodObject<{
        page: z.ZodDefault<z.ZodEffects<z.ZodEffects<z.ZodString, number, string>, number, string>>;
        limit: z.ZodDefault<z.ZodEffects<z.ZodEffects<z.ZodString, number, string>, number, string>>;
        sortBy: z.ZodOptional<z.ZodString>;
        sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortOrder: "asc" | "desc";
        sortBy?: string | undefined;
    }, {
        page?: string | undefined;
        limit?: string | undefined;
        sortBy?: string | undefined;
        sortOrder?: "asc" | "desc" | undefined;
    }>;
    searchSchema: z.ZodObject<{
        page: z.ZodDefault<z.ZodEffects<z.ZodEffects<z.ZodString, number, string>, number, string>>;
        limit: z.ZodDefault<z.ZodEffects<z.ZodEffects<z.ZodString, number, string>, number, string>>;
        sortBy: z.ZodOptional<z.ZodString>;
        sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
        query: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortOrder: "asc" | "desc";
        query?: string | undefined;
        sortBy?: string | undefined;
    }, {
        page?: string | undefined;
        limit?: string | undefined;
        query?: string | undefined;
        sortBy?: string | undefined;
        sortOrder?: "asc" | "desc" | undefined;
    }>;
    addressSchema: z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        postalCode: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    }, {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    }>;
    moneySchema: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        amount: number;
    }, {
        amount: number;
        currency?: string | undefined;
    }>;
    fileUploadSchema: z.ZodObject<{
        filename: z.ZodString;
        mimeType: z.ZodString;
        size: z.ZodNumber;
        url: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        filename: string;
        mimeType: string;
        size: number;
        url?: string | undefined;
    }, {
        filename: string;
        mimeType: string;
        size: number;
        url?: string | undefined;
    }>;
    coordinatesSchema: z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
    }, {
        latitude: number;
        longitude: number;
    }>;
    colorSchema: z.ZodOptional<z.ZodString>;
    metadataSchema: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>>;
    successResponseSchema: z.ZodObject<{
        success: z.ZodLiteral<true>;
        data: z.ZodAny;
        message: z.ZodOptional<z.ZodString>;
        meta: z.ZodObject<{
            timestamp: z.ZodString;
            version: z.ZodString;
            requestId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            timestamp: string;
            version: string;
            requestId?: string | undefined;
        }, {
            timestamp: string;
            version: string;
            requestId?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        success: true;
        meta: {
            timestamp: string;
            version: string;
            requestId?: string | undefined;
        };
        message?: string | undefined;
        data?: any;
    }, {
        success: true;
        meta: {
            timestamp: string;
            version: string;
            requestId?: string | undefined;
        };
        message?: string | undefined;
        data?: any;
    }>;
    errorResponseSchema: z.ZodObject<{
        success: z.ZodLiteral<false>;
        error: z.ZodObject<{
            code: z.ZodString;
            message: z.ZodString;
            details: z.ZodOptional<z.ZodAny>;
            field: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            timestamp: string;
            message: string;
            code: string;
            details?: any;
            field?: string | undefined;
        }, {
            timestamp: string;
            message: string;
            code: string;
            details?: any;
            field?: string | undefined;
        }>;
        meta: z.ZodObject<{
            timestamp: z.ZodString;
            version: z.ZodString;
            requestId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            timestamp: string;
            version: string;
            requestId?: string | undefined;
        }, {
            timestamp: string;
            version: string;
            requestId?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        error: {
            timestamp: string;
            message: string;
            code: string;
            details?: any;
            field?: string | undefined;
        };
        success: false;
        meta: {
            timestamp: string;
            version: string;
            requestId?: string | undefined;
        };
    }, {
        error: {
            timestamp: string;
            message: string;
            code: string;
            details?: any;
            field?: string | undefined;
        };
        success: false;
        meta: {
            timestamp: string;
            version: string;
            requestId?: string | undefined;
        };
    }>;
};
export default _default;
//# sourceMappingURL=common.d.ts.map