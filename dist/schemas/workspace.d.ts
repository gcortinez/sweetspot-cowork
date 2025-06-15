import { z } from "zod";
export declare const workspaceStatusSchema: z.ZodEnum<[string, string, string, string]>;
export declare const spaceTypeSchema: z.ZodEnum<[string, string, string, string, string, string, string, string, string]>;
export declare const spaceStatusSchema: z.ZodEnum<[string, string, string, string, string]>;
export declare const bookingStatusSchema: z.ZodEnum<[string, string, string, string, string, string]>;
export declare const membershipTypeSchema: z.ZodEnum<[string, string, string, string, string]>;
export declare const amenitySchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    isPremium: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isPremium: boolean;
    id?: string | undefined;
    description?: string | undefined;
    category?: string | undefined;
    icon?: string | undefined;
}, {
    name: string;
    id?: string | undefined;
    description?: string | undefined;
    category?: string | undefined;
    icon?: string | undefined;
    isPremium?: boolean | undefined;
}>;
export declare const createWorkspaceSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    slug: z.ZodString;
    website: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodObject<{
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
    coordinates: z.ZodOptional<z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
    }, {
        latitude: number;
        longitude: number;
    }>>;
    logo: z.ZodOptional<z.ZodString>;
    coverImage: z.ZodOptional<z.ZodString>;
    brandColor: z.ZodOptional<z.ZodString>;
    settings: z.ZodObject<{
        currency: z.ZodDefault<z.ZodString>;
        timezone: z.ZodDefault<z.ZodString>;
        language: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodObject<{
            monday: z.ZodObject<{
                isOpen: z.ZodBoolean;
                openTime: z.ZodOptional<z.ZodString>;
                closeTime: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }>;
            tuesday: z.ZodObject<{
                isOpen: z.ZodBoolean;
                openTime: z.ZodOptional<z.ZodString>;
                closeTime: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }>;
            wednesday: z.ZodObject<{
                isOpen: z.ZodBoolean;
                openTime: z.ZodOptional<z.ZodString>;
                closeTime: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }>;
            thursday: z.ZodObject<{
                isOpen: z.ZodBoolean;
                openTime: z.ZodOptional<z.ZodString>;
                closeTime: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }>;
            friday: z.ZodObject<{
                isOpen: z.ZodBoolean;
                openTime: z.ZodOptional<z.ZodString>;
                closeTime: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }>;
            saturday: z.ZodObject<{
                isOpen: z.ZodBoolean;
                openTime: z.ZodOptional<z.ZodString>;
                closeTime: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }>;
            sunday: z.ZodObject<{
                isOpen: z.ZodBoolean;
                openTime: z.ZodOptional<z.ZodString>;
                closeTime: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            monday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            tuesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            wednesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            thursday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            friday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            saturday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            sunday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
        }, {
            monday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            tuesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            wednesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            thursday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            friday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            saturday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            sunday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
        }>;
        bookingPolicy: z.ZodObject<{
            maxAdvanceDays: z.ZodDefault<z.ZodNumber>;
            minBookingDuration: z.ZodDefault<z.ZodNumber>;
            maxBookingDuration: z.ZodDefault<z.ZodNumber>;
            cancellationHours: z.ZodDefault<z.ZodNumber>;
            autoConfirm: z.ZodDefault<z.ZodBoolean>;
            requireDeposit: z.ZodDefault<z.ZodBoolean>;
            depositPercentage: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            maxAdvanceDays: number;
            minBookingDuration: number;
            maxBookingDuration: number;
            cancellationHours: number;
            autoConfirm: boolean;
            requireDeposit: boolean;
            depositPercentage: number;
        }, {
            maxAdvanceDays?: number | undefined;
            minBookingDuration?: number | undefined;
            maxBookingDuration?: number | undefined;
            cancellationHours?: number | undefined;
            autoConfirm?: boolean | undefined;
            requireDeposit?: boolean | undefined;
            depositPercentage?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        timezone: string;
        language: string;
        businessHours: {
            monday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            tuesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            wednesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            thursday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            friday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            saturday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            sunday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
        };
        bookingPolicy: {
            maxAdvanceDays: number;
            minBookingDuration: number;
            maxBookingDuration: number;
            cancellationHours: number;
            autoConfirm: boolean;
            requireDeposit: boolean;
            depositPercentage: number;
        };
    }, {
        businessHours: {
            monday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            tuesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            wednesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            thursday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            friday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            saturday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            sunday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
        };
        bookingPolicy: {
            maxAdvanceDays?: number | undefined;
            minBookingDuration?: number | undefined;
            maxBookingDuration?: number | undefined;
            cancellationHours?: number | undefined;
            autoConfirm?: boolean | undefined;
            requireDeposit?: boolean | undefined;
            depositPercentage?: number | undefined;
        };
        currency?: string | undefined;
        timezone?: string | undefined;
        language?: string | undefined;
    }>;
    metadata: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    settings: {
        currency: string;
        timezone: string;
        language: string;
        businessHours: {
            monday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            tuesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            wednesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            thursday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            friday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            saturday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            sunday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
        };
        bookingPolicy: {
            maxAdvanceDays: number;
            minBookingDuration: number;
            maxBookingDuration: number;
            cancellationHours: number;
            autoConfirm: boolean;
            requireDeposit: boolean;
            depositPercentage: number;
        };
    };
    address: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    phone?: string | undefined;
    metadata?: Record<string, any> | undefined;
    email?: string | undefined;
    logo?: string | undefined;
    description?: string | undefined;
    website?: string | undefined;
    coordinates?: {
        latitude: number;
        longitude: number;
    } | undefined;
    coverImage?: string | undefined;
    brandColor?: string | undefined;
}, {
    name: string;
    slug: string;
    settings: {
        businessHours: {
            monday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            tuesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            wednesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            thursday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            friday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            saturday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            sunday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
        };
        bookingPolicy: {
            maxAdvanceDays?: number | undefined;
            minBookingDuration?: number | undefined;
            maxBookingDuration?: number | undefined;
            cancellationHours?: number | undefined;
            autoConfirm?: boolean | undefined;
            requireDeposit?: boolean | undefined;
            depositPercentage?: number | undefined;
        };
        currency?: string | undefined;
        timezone?: string | undefined;
        language?: string | undefined;
    };
    address: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    phone?: string | undefined;
    metadata?: Record<string, any> | undefined;
    email?: string | undefined;
    logo?: string | undefined;
    description?: string | undefined;
    website?: string | undefined;
    coordinates?: {
        latitude: number;
        longitude: number;
    } | undefined;
    coverImage?: string | undefined;
    brandColor?: string | undefined;
}>;
export declare const updateWorkspaceSchema: z.ZodObject<Omit<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    slug: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodObject<{
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
    }>>;
    coordinates: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
    }, {
        latitude: number;
        longitude: number;
    }>>>;
    logo: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    coverImage: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    brandColor: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    settings: z.ZodOptional<z.ZodObject<{
        currency: z.ZodDefault<z.ZodString>;
        timezone: z.ZodDefault<z.ZodString>;
        language: z.ZodDefault<z.ZodString>;
        businessHours: z.ZodObject<{
            monday: z.ZodObject<{
                isOpen: z.ZodBoolean;
                openTime: z.ZodOptional<z.ZodString>;
                closeTime: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }>;
            tuesday: z.ZodObject<{
                isOpen: z.ZodBoolean;
                openTime: z.ZodOptional<z.ZodString>;
                closeTime: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }>;
            wednesday: z.ZodObject<{
                isOpen: z.ZodBoolean;
                openTime: z.ZodOptional<z.ZodString>;
                closeTime: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }>;
            thursday: z.ZodObject<{
                isOpen: z.ZodBoolean;
                openTime: z.ZodOptional<z.ZodString>;
                closeTime: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }>;
            friday: z.ZodObject<{
                isOpen: z.ZodBoolean;
                openTime: z.ZodOptional<z.ZodString>;
                closeTime: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }>;
            saturday: z.ZodObject<{
                isOpen: z.ZodBoolean;
                openTime: z.ZodOptional<z.ZodString>;
                closeTime: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }>;
            sunday: z.ZodObject<{
                isOpen: z.ZodBoolean;
                openTime: z.ZodOptional<z.ZodString>;
                closeTime: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }, {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            monday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            tuesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            wednesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            thursday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            friday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            saturday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            sunday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
        }, {
            monday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            tuesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            wednesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            thursday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            friday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            saturday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            sunday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
        }>;
        bookingPolicy: z.ZodObject<{
            maxAdvanceDays: z.ZodDefault<z.ZodNumber>;
            minBookingDuration: z.ZodDefault<z.ZodNumber>;
            maxBookingDuration: z.ZodDefault<z.ZodNumber>;
            cancellationHours: z.ZodDefault<z.ZodNumber>;
            autoConfirm: z.ZodDefault<z.ZodBoolean>;
            requireDeposit: z.ZodDefault<z.ZodBoolean>;
            depositPercentage: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            maxAdvanceDays: number;
            minBookingDuration: number;
            maxBookingDuration: number;
            cancellationHours: number;
            autoConfirm: boolean;
            requireDeposit: boolean;
            depositPercentage: number;
        }, {
            maxAdvanceDays?: number | undefined;
            minBookingDuration?: number | undefined;
            maxBookingDuration?: number | undefined;
            cancellationHours?: number | undefined;
            autoConfirm?: boolean | undefined;
            requireDeposit?: boolean | undefined;
            depositPercentage?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        timezone: string;
        language: string;
        businessHours: {
            monday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            tuesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            wednesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            thursday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            friday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            saturday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            sunday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
        };
        bookingPolicy: {
            maxAdvanceDays: number;
            minBookingDuration: number;
            maxBookingDuration: number;
            cancellationHours: number;
            autoConfirm: boolean;
            requireDeposit: boolean;
            depositPercentage: number;
        };
    }, {
        businessHours: {
            monday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            tuesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            wednesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            thursday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            friday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            saturday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            sunday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
        };
        bookingPolicy: {
            maxAdvanceDays?: number | undefined;
            minBookingDuration?: number | undefined;
            maxBookingDuration?: number | undefined;
            cancellationHours?: number | undefined;
            autoConfirm?: boolean | undefined;
            requireDeposit?: boolean | undefined;
            depositPercentage?: number | undefined;
        };
        currency?: string | undefined;
        timezone?: string | undefined;
        language?: string | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>>>;
}, "slug">, "strip", z.ZodTypeAny, {
    phone?: string | undefined;
    metadata?: Record<string, any> | undefined;
    email?: string | undefined;
    name?: string | undefined;
    logo?: string | undefined;
    description?: string | undefined;
    settings?: {
        currency: string;
        timezone: string;
        language: string;
        businessHours: {
            monday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            tuesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            wednesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            thursday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            friday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            saturday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            sunday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
        };
        bookingPolicy: {
            maxAdvanceDays: number;
            minBookingDuration: number;
            maxBookingDuration: number;
            cancellationHours: number;
            autoConfirm: boolean;
            requireDeposit: boolean;
            depositPercentage: number;
        };
    } | undefined;
    address?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    } | undefined;
    website?: string | undefined;
    coordinates?: {
        latitude: number;
        longitude: number;
    } | undefined;
    coverImage?: string | undefined;
    brandColor?: string | undefined;
}, {
    phone?: string | undefined;
    metadata?: Record<string, any> | undefined;
    email?: string | undefined;
    name?: string | undefined;
    logo?: string | undefined;
    description?: string | undefined;
    settings?: {
        businessHours: {
            monday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            tuesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            wednesday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            thursday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            friday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            saturday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
            sunday: {
                isOpen: boolean;
                openTime?: string | undefined;
                closeTime?: string | undefined;
            };
        };
        bookingPolicy: {
            maxAdvanceDays?: number | undefined;
            minBookingDuration?: number | undefined;
            maxBookingDuration?: number | undefined;
            cancellationHours?: number | undefined;
            autoConfirm?: boolean | undefined;
            requireDeposit?: boolean | undefined;
            depositPercentage?: number | undefined;
        };
        currency?: string | undefined;
        timezone?: string | undefined;
        language?: string | undefined;
    } | undefined;
    address?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    } | undefined;
    website?: string | undefined;
    coordinates?: {
        latitude: number;
        longitude: number;
    } | undefined;
    coverImage?: string | undefined;
    brandColor?: string | undefined;
}>;
export declare const createSpaceSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<[string, string, string, string, string, string, string, string, string]>;
    capacity: z.ZodNumber;
    area: z.ZodOptional<z.ZodNumber>;
    pricing: z.ZodObject<{
        hourly: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            currency: string;
            amount: number;
        }, {
            amount: number;
            currency?: string | undefined;
        }>>;
        daily: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            currency: string;
            amount: number;
        }, {
            amount: number;
            currency?: string | undefined;
        }>>;
        weekly: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            currency: string;
            amount: number;
        }, {
            amount: number;
            currency?: string | undefined;
        }>>;
        monthly: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            currency: string;
            amount: number;
        }, {
            amount: number;
            currency?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        daily?: {
            currency: string;
            amount: number;
        } | undefined;
        weekly?: {
            currency: string;
            amount: number;
        } | undefined;
        monthly?: {
            currency: string;
            amount: number;
        } | undefined;
        hourly?: {
            currency: string;
            amount: number;
        } | undefined;
    }, {
        daily?: {
            amount: number;
            currency?: string | undefined;
        } | undefined;
        weekly?: {
            amount: number;
            currency?: string | undefined;
        } | undefined;
        monthly?: {
            amount: number;
            currency?: string | undefined;
        } | undefined;
        hourly?: {
            amount: number;
            currency?: string | undefined;
        } | undefined;
    }>;
    amenities: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
    images: z.ZodOptional<z.ZodArray<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>, "many">>;
    location: z.ZodOptional<z.ZodObject<{
        floor: z.ZodOptional<z.ZodString>;
        building: z.ZodOptional<z.ZodString>;
        room: z.ZodOptional<z.ZodString>;
        coordinates: z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            latitude: number;
            longitude: number;
        }, {
            latitude: number;
            longitude: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        floor?: string | undefined;
        room?: string | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
        building?: string | undefined;
    }, {
        floor?: string | undefined;
        room?: string | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
        building?: string | undefined;
    }>>;
    equipment: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
    accessibility: z.ZodOptional<z.ZodObject<{
        wheelchairAccessible: z.ZodDefault<z.ZodBoolean>;
        hearingLoopAvailable: z.ZodDefault<z.ZodBoolean>;
        visualAidSupport: z.ZodDefault<z.ZodBoolean>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        wheelchairAccessible: boolean;
        hearingLoopAvailable: boolean;
        visualAidSupport: boolean;
        notes?: string | undefined;
    }, {
        notes?: string | undefined;
        wheelchairAccessible?: boolean | undefined;
        hearingLoopAvailable?: boolean | undefined;
        visualAidSupport?: boolean | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: string;
    capacity: number;
    pricing: {
        daily?: {
            currency: string;
            amount: number;
        } | undefined;
        weekly?: {
            currency: string;
            amount: number;
        } | undefined;
        monthly?: {
            currency: string;
            amount: number;
        } | undefined;
        hourly?: {
            currency: string;
            amount: number;
        } | undefined;
    };
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
    amenities?: string[] | undefined;
    location?: {
        floor?: string | undefined;
        room?: string | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
        building?: string | undefined;
    } | undefined;
    equipment?: string[] | undefined;
    area?: number | undefined;
    images?: (string | undefined)[] | undefined;
    accessibility?: {
        wheelchairAccessible: boolean;
        hearingLoopAvailable: boolean;
        visualAidSupport: boolean;
        notes?: string | undefined;
    } | undefined;
}, {
    name: string;
    type: string;
    capacity: number;
    pricing: {
        daily?: {
            amount: number;
            currency?: string | undefined;
        } | undefined;
        weekly?: {
            amount: number;
            currency?: string | undefined;
        } | undefined;
        monthly?: {
            amount: number;
            currency?: string | undefined;
        } | undefined;
        hourly?: {
            amount: number;
            currency?: string | undefined;
        } | undefined;
    };
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
    amenities?: string[] | undefined;
    location?: {
        floor?: string | undefined;
        room?: string | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
        building?: string | undefined;
    } | undefined;
    equipment?: string[] | undefined;
    area?: number | undefined;
    images?: (string | undefined)[] | undefined;
    accessibility?: {
        notes?: string | undefined;
        wheelchairAccessible?: boolean | undefined;
        hearingLoopAvailable?: boolean | undefined;
        visualAidSupport?: boolean | undefined;
    } | undefined;
}>;
export declare const updateSpaceSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodEnum<[string, string, string, string, string, string, string, string, string]>>;
    capacity: z.ZodOptional<z.ZodNumber>;
    area: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    pricing: z.ZodOptional<z.ZodObject<{
        hourly: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            currency: string;
            amount: number;
        }, {
            amount: number;
            currency?: string | undefined;
        }>>;
        daily: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            currency: string;
            amount: number;
        }, {
            amount: number;
            currency?: string | undefined;
        }>>;
        weekly: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            currency: string;
            amount: number;
        }, {
            amount: number;
            currency?: string | undefined;
        }>>;
        monthly: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            currency: string;
            amount: number;
        }, {
            amount: number;
            currency?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        daily?: {
            currency: string;
            amount: number;
        } | undefined;
        weekly?: {
            currency: string;
            amount: number;
        } | undefined;
        monthly?: {
            currency: string;
            amount: number;
        } | undefined;
        hourly?: {
            currency: string;
            amount: number;
        } | undefined;
    }, {
        daily?: {
            amount: number;
            currency?: string | undefined;
        } | undefined;
        weekly?: {
            amount: number;
            currency?: string | undefined;
        } | undefined;
        monthly?: {
            amount: number;
            currency?: string | undefined;
        } | undefined;
        hourly?: {
            amount: number;
            currency?: string | undefined;
        } | undefined;
    }>>;
    amenities: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>>;
    images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>, "many">>>;
    location: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        floor: z.ZodOptional<z.ZodString>;
        building: z.ZodOptional<z.ZodString>;
        room: z.ZodOptional<z.ZodString>;
        coordinates: z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            latitude: number;
            longitude: number;
        }, {
            latitude: number;
            longitude: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        floor?: string | undefined;
        room?: string | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
        building?: string | undefined;
    }, {
        floor?: string | undefined;
        room?: string | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
        building?: string | undefined;
    }>>>;
    equipment: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>>;
    accessibility: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        wheelchairAccessible: z.ZodDefault<z.ZodBoolean>;
        hearingLoopAvailable: z.ZodDefault<z.ZodBoolean>;
        visualAidSupport: z.ZodDefault<z.ZodBoolean>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        wheelchairAccessible: boolean;
        hearingLoopAvailable: boolean;
        visualAidSupport: boolean;
        notes?: string | undefined;
    }, {
        notes?: string | undefined;
        wheelchairAccessible?: boolean | undefined;
        hearingLoopAvailable?: boolean | undefined;
        visualAidSupport?: boolean | undefined;
    }>>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>>>;
} & {
    status: z.ZodOptional<z.ZodEnum<[string, string, string, string, string]>>;
}, "strip", z.ZodTypeAny, {
    metadata?: Record<string, any> | undefined;
    status?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    type?: string | undefined;
    capacity?: number | undefined;
    amenities?: string[] | undefined;
    location?: {
        floor?: string | undefined;
        room?: string | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
        building?: string | undefined;
    } | undefined;
    equipment?: string[] | undefined;
    area?: number | undefined;
    pricing?: {
        daily?: {
            currency: string;
            amount: number;
        } | undefined;
        weekly?: {
            currency: string;
            amount: number;
        } | undefined;
        monthly?: {
            currency: string;
            amount: number;
        } | undefined;
        hourly?: {
            currency: string;
            amount: number;
        } | undefined;
    } | undefined;
    images?: (string | undefined)[] | undefined;
    accessibility?: {
        wheelchairAccessible: boolean;
        hearingLoopAvailable: boolean;
        visualAidSupport: boolean;
        notes?: string | undefined;
    } | undefined;
}, {
    metadata?: Record<string, any> | undefined;
    status?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    type?: string | undefined;
    capacity?: number | undefined;
    amenities?: string[] | undefined;
    location?: {
        floor?: string | undefined;
        room?: string | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
        building?: string | undefined;
    } | undefined;
    equipment?: string[] | undefined;
    area?: number | undefined;
    pricing?: {
        daily?: {
            amount: number;
            currency?: string | undefined;
        } | undefined;
        weekly?: {
            amount: number;
            currency?: string | undefined;
        } | undefined;
        monthly?: {
            amount: number;
            currency?: string | undefined;
        } | undefined;
        hourly?: {
            amount: number;
            currency?: string | undefined;
        } | undefined;
    } | undefined;
    images?: (string | undefined)[] | undefined;
    accessibility?: {
        notes?: string | undefined;
        wheelchairAccessible?: boolean | undefined;
        hearingLoopAvailable?: boolean | undefined;
        visualAidSupport?: boolean | undefined;
    } | undefined;
}>;
export declare const spaceFiltersSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
    status: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
    minCapacity: z.ZodOptional<z.ZodNumber>;
    maxCapacity: z.ZodOptional<z.ZodNumber>;
    amenities: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
    available: z.ZodOptional<z.ZodBoolean>;
    priceRange: z.ZodOptional<z.ZodObject<{
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        period: z.ZodDefault<z.ZodEnum<["hourly", "daily", "weekly", "monthly"]>>;
    }, "strip", z.ZodTypeAny, {
        period: "daily" | "weekly" | "monthly" | "hourly";
        min?: number | undefined;
        max?: number | undefined;
    }, {
        period?: "daily" | "weekly" | "monthly" | "hourly" | undefined;
        min?: number | undefined;
        max?: number | undefined;
    }>>;
    floor: z.ZodOptional<z.ZodString>;
    building: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    search?: string | undefined;
    status?: string[] | undefined;
    type?: string[] | undefined;
    amenities?: string[] | undefined;
    maxCapacity?: number | undefined;
    floor?: string | undefined;
    minCapacity?: number | undefined;
    building?: string | undefined;
    available?: boolean | undefined;
    priceRange?: {
        period: "daily" | "weekly" | "monthly" | "hourly";
        min?: number | undefined;
        max?: number | undefined;
    } | undefined;
}, {
    search?: string | undefined;
    status?: string[] | undefined;
    type?: string[] | undefined;
    amenities?: string[] | undefined;
    maxCapacity?: number | undefined;
    floor?: string | undefined;
    minCapacity?: number | undefined;
    building?: string | undefined;
    available?: boolean | undefined;
    priceRange?: {
        period?: "daily" | "weekly" | "monthly" | "hourly" | undefined;
        min?: number | undefined;
        max?: number | undefined;
    } | undefined;
}>;
export declare const createBookingSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    spaceId: z.ZodString;
    startTime: z.ZodString;
    endTime: z.ZodString;
    attendees: z.ZodOptional<z.ZodNumber>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    isRecurring: z.ZodDefault<z.ZodBoolean>;
    recurrencePattern: z.ZodOptional<z.ZodObject<{
        frequency: z.ZodEnum<["daily", "weekly", "monthly"]>;
        interval: z.ZodNumber;
        daysOfWeek: z.ZodOptional<z.ZodArray<z.ZodType<number, z.ZodTypeDef, number>, "many">>;
        endDate: z.ZodOptional<z.ZodString>;
        occurrences: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        frequency: "daily" | "weekly" | "monthly";
        interval: number;
        endDate?: string | undefined;
        daysOfWeek?: number[] | undefined;
        occurrences?: number | undefined;
    }, {
        frequency: "daily" | "weekly" | "monthly";
        interval: number;
        endDate?: string | undefined;
        daysOfWeek?: number[] | undefined;
        occurrences?: number | undefined;
    }>>;
    requirements: z.ZodOptional<z.ZodObject<{
        setup: z.ZodOptional<z.ZodString>;
        equipment: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
        catering: z.ZodOptional<z.ZodString>;
        specialRequests: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        equipment?: string[] | undefined;
        catering?: string | undefined;
        setup?: string | undefined;
        specialRequests?: string | undefined;
    }, {
        equipment?: string[] | undefined;
        catering?: string | undefined;
        setup?: string | undefined;
        specialRequests?: string | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>>;
}, "strip", z.ZodTypeAny, {
    spaceId: string;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
    metadata?: Record<string, any> | undefined;
    title?: string | undefined;
    description?: string | undefined;
    attendees?: number | undefined;
    requirements?: {
        equipment?: string[] | undefined;
        catering?: string | undefined;
        setup?: string | undefined;
        specialRequests?: string | undefined;
    } | undefined;
    recurrencePattern?: {
        frequency: "daily" | "weekly" | "monthly";
        interval: number;
        endDate?: string | undefined;
        daysOfWeek?: number[] | undefined;
        occurrences?: number | undefined;
    } | undefined;
}, {
    spaceId: string;
    startTime: string;
    endTime: string;
    metadata?: Record<string, any> | undefined;
    title?: string | undefined;
    description?: string | undefined;
    attendees?: number | undefined;
    requirements?: {
        equipment?: string[] | undefined;
        catering?: string | undefined;
        setup?: string | undefined;
        specialRequests?: string | undefined;
    } | undefined;
    isRecurring?: boolean | undefined;
    recurrencePattern?: {
        frequency: "daily" | "weekly" | "monthly";
        interval: number;
        endDate?: string | undefined;
        daysOfWeek?: number[] | undefined;
        occurrences?: number | undefined;
    } | undefined;
}>, {
    spaceId: string;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
    metadata?: Record<string, any> | undefined;
    title?: string | undefined;
    description?: string | undefined;
    attendees?: number | undefined;
    requirements?: {
        equipment?: string[] | undefined;
        catering?: string | undefined;
        setup?: string | undefined;
        specialRequests?: string | undefined;
    } | undefined;
    recurrencePattern?: {
        frequency: "daily" | "weekly" | "monthly";
        interval: number;
        endDate?: string | undefined;
        daysOfWeek?: number[] | undefined;
        occurrences?: number | undefined;
    } | undefined;
}, {
    spaceId: string;
    startTime: string;
    endTime: string;
    metadata?: Record<string, any> | undefined;
    title?: string | undefined;
    description?: string | undefined;
    attendees?: number | undefined;
    requirements?: {
        equipment?: string[] | undefined;
        catering?: string | undefined;
        setup?: string | undefined;
        specialRequests?: string | undefined;
    } | undefined;
    isRecurring?: boolean | undefined;
    recurrencePattern?: {
        frequency: "daily" | "weekly" | "monthly";
        interval: number;
        endDate?: string | undefined;
        daysOfWeek?: number[] | undefined;
        occurrences?: number | undefined;
    } | undefined;
}>, {
    spaceId: string;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
    metadata?: Record<string, any> | undefined;
    title?: string | undefined;
    description?: string | undefined;
    attendees?: number | undefined;
    requirements?: {
        equipment?: string[] | undefined;
        catering?: string | undefined;
        setup?: string | undefined;
        specialRequests?: string | undefined;
    } | undefined;
    recurrencePattern?: {
        frequency: "daily" | "weekly" | "monthly";
        interval: number;
        endDate?: string | undefined;
        daysOfWeek?: number[] | undefined;
        occurrences?: number | undefined;
    } | undefined;
}, {
    spaceId: string;
    startTime: string;
    endTime: string;
    metadata?: Record<string, any> | undefined;
    title?: string | undefined;
    description?: string | undefined;
    attendees?: number | undefined;
    requirements?: {
        equipment?: string[] | undefined;
        catering?: string | undefined;
        setup?: string | undefined;
        specialRequests?: string | undefined;
    } | undefined;
    isRecurring?: boolean | undefined;
    recurrencePattern?: {
        frequency: "daily" | "weekly" | "monthly";
        interval: number;
        endDate?: string | undefined;
        daysOfWeek?: number[] | undefined;
        occurrences?: number | undefined;
    } | undefined;
}>;
export declare const updateBookingSchema: z.ZodEffects<z.ZodObject<{
    startTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
    attendees: z.ZodOptional<z.ZodNumber>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<[string, string, string, string, string, string]>>;
    requirements: z.ZodOptional<z.ZodObject<{
        setup: z.ZodOptional<z.ZodString>;
        equipment: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
        catering: z.ZodOptional<z.ZodString>;
        specialRequests: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        equipment?: string[] | undefined;
        catering?: string | undefined;
        setup?: string | undefined;
        specialRequests?: string | undefined;
    }, {
        equipment?: string[] | undefined;
        catering?: string | undefined;
        setup?: string | undefined;
        specialRequests?: string | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>>;
}, "strip", z.ZodTypeAny, {
    metadata?: Record<string, any> | undefined;
    title?: string | undefined;
    status?: string | undefined;
    description?: string | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    attendees?: number | undefined;
    requirements?: {
        equipment?: string[] | undefined;
        catering?: string | undefined;
        setup?: string | undefined;
        specialRequests?: string | undefined;
    } | undefined;
}, {
    metadata?: Record<string, any> | undefined;
    title?: string | undefined;
    status?: string | undefined;
    description?: string | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    attendees?: number | undefined;
    requirements?: {
        equipment?: string[] | undefined;
        catering?: string | undefined;
        setup?: string | undefined;
        specialRequests?: string | undefined;
    } | undefined;
}>, {
    metadata?: Record<string, any> | undefined;
    title?: string | undefined;
    status?: string | undefined;
    description?: string | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    attendees?: number | undefined;
    requirements?: {
        equipment?: string[] | undefined;
        catering?: string | undefined;
        setup?: string | undefined;
        specialRequests?: string | undefined;
    } | undefined;
}, {
    metadata?: Record<string, any> | undefined;
    title?: string | undefined;
    status?: string | undefined;
    description?: string | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    attendees?: number | undefined;
    requirements?: {
        equipment?: string[] | undefined;
        catering?: string | undefined;
        setup?: string | undefined;
        specialRequests?: string | undefined;
    } | undefined;
}>;
export declare const bookingFiltersSchema: z.ZodObject<{
    spaceId: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    spaceType: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    search?: string | undefined;
    userId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    status?: string[] | undefined;
    spaceId?: string | undefined;
    spaceType?: string[] | undefined;
}, {
    search?: string | undefined;
    userId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    status?: string[] | undefined;
    spaceId?: string | undefined;
    spaceType?: string[] | undefined;
}>;
export declare const createMembershipSchema: z.ZodEffects<z.ZodObject<{
    userId: z.ZodString;
    type: z.ZodEnum<[string, string, string, string, string]>;
    startDate: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
    pricing: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
        billingCycle: z.ZodDefault<z.ZodEnum<["monthly", "quarterly", "yearly"]>>;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        billingCycle: "monthly" | "quarterly" | "yearly";
        amount: number;
    }, {
        amount: number;
        currency?: string | undefined;
        billingCycle?: "monthly" | "quarterly" | "yearly" | undefined;
    }>;
    benefits: z.ZodObject<{
        includedHours: z.ZodOptional<z.ZodNumber>;
        discountPercentage: z.ZodOptional<z.ZodNumber>;
        accessLevels: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
        priorityBooking: z.ZodDefault<z.ZodBoolean>;
        guestPasses: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        priorityBooking: boolean;
        guestPasses: number;
        discountPercentage?: number | undefined;
        includedHours?: number | undefined;
        accessLevels?: string[] | undefined;
    }, {
        discountPercentage?: number | undefined;
        includedHours?: number | undefined;
        accessLevels?: string[] | undefined;
        priorityBooking?: boolean | undefined;
        guestPasses?: number | undefined;
    }>;
    metadata: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    startDate: string;
    type: string;
    pricing: {
        currency: string;
        billingCycle: "monthly" | "quarterly" | "yearly";
        amount: number;
    };
    benefits: {
        priorityBooking: boolean;
        guestPasses: number;
        discountPercentage?: number | undefined;
        includedHours?: number | undefined;
        accessLevels?: string[] | undefined;
    };
    metadata?: Record<string, any> | undefined;
    endDate?: string | undefined;
}, {
    userId: string;
    startDate: string;
    type: string;
    pricing: {
        amount: number;
        currency?: string | undefined;
        billingCycle?: "monthly" | "quarterly" | "yearly" | undefined;
    };
    benefits: {
        discountPercentage?: number | undefined;
        includedHours?: number | undefined;
        accessLevels?: string[] | undefined;
        priorityBooking?: boolean | undefined;
        guestPasses?: number | undefined;
    };
    metadata?: Record<string, any> | undefined;
    endDate?: string | undefined;
}>, {
    userId: string;
    startDate: string;
    type: string;
    pricing: {
        currency: string;
        billingCycle: "monthly" | "quarterly" | "yearly";
        amount: number;
    };
    benefits: {
        priorityBooking: boolean;
        guestPasses: number;
        discountPercentage?: number | undefined;
        includedHours?: number | undefined;
        accessLevels?: string[] | undefined;
    };
    metadata?: Record<string, any> | undefined;
    endDate?: string | undefined;
}, {
    userId: string;
    startDate: string;
    type: string;
    pricing: {
        amount: number;
        currency?: string | undefined;
        billingCycle?: "monthly" | "quarterly" | "yearly" | undefined;
    };
    benefits: {
        discountPercentage?: number | undefined;
        includedHours?: number | undefined;
        accessLevels?: string[] | undefined;
        priorityBooking?: boolean | undefined;
        guestPasses?: number | undefined;
    };
    metadata?: Record<string, any> | undefined;
    endDate?: string | undefined;
}>;
export declare const updateMembershipSchema: any;
export declare const workspaceResponseSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    slug: z.ZodString;
    website: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodObject<{
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
    coordinates: z.ZodOptional<z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
    }, {
        latitude: number;
        longitude: number;
    }>>;
    logo: z.ZodOptional<z.ZodString>;
    coverImage: z.ZodOptional<z.ZodString>;
    brandColor: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<[string, string, string, string]>;
    settings: z.ZodAny;
    metadata: z.ZodOptional<z.ZodAny>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    stats: z.ZodOptional<z.ZodObject<{
        totalSpaces: z.ZodNumber;
        totalMembers: z.ZodNumber;
        totalBookings: z.ZodNumber;
        occupancyRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalBookings: number;
        occupancyRate: number;
        totalSpaces: number;
        totalMembers: number;
    }, {
        totalBookings: number;
        occupancyRate: number;
        totalSpaces: number;
        totalMembers: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    slug: string;
    address: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    phone?: string | undefined;
    metadata?: any;
    email?: string | undefined;
    logo?: string | undefined;
    description?: string | undefined;
    settings?: any;
    stats?: {
        totalBookings: number;
        occupancyRate: number;
        totalSpaces: number;
        totalMembers: number;
    } | undefined;
    website?: string | undefined;
    coordinates?: {
        latitude: number;
        longitude: number;
    } | undefined;
    coverImage?: string | undefined;
    brandColor?: string | undefined;
}, {
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    slug: string;
    address: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    phone?: string | undefined;
    metadata?: any;
    email?: string | undefined;
    logo?: string | undefined;
    description?: string | undefined;
    settings?: any;
    stats?: {
        totalBookings: number;
        occupancyRate: number;
        totalSpaces: number;
        totalMembers: number;
    } | undefined;
    website?: string | undefined;
    coordinates?: {
        latitude: number;
        longitude: number;
    } | undefined;
    coverImage?: string | undefined;
    brandColor?: string | undefined;
}>;
export declare const spaceResponseSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<[string, string, string, string, string, string, string, string, string]>;
    status: z.ZodEnum<[string, string, string, string, string]>;
    capacity: z.ZodNumber;
    area: z.ZodOptional<z.ZodNumber>;
    pricing: z.ZodAny;
    amenities: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        isPremium: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        isPremium: boolean;
        id?: string | undefined;
        description?: string | undefined;
        category?: string | undefined;
        icon?: string | undefined;
    }, {
        name: string;
        id?: string | undefined;
        description?: string | undefined;
        category?: string | undefined;
        icon?: string | undefined;
        isPremium?: boolean | undefined;
    }>, "many">>;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    location: z.ZodOptional<z.ZodAny>;
    equipment: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    accessibility: z.ZodOptional<z.ZodAny>;
    metadata: z.ZodOptional<z.ZodAny>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    stats: z.ZodOptional<z.ZodObject<{
        bookingCount: z.ZodNumber;
        occupancyRate: z.ZodNumber;
        revenue: z.ZodNumber;
        rating: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        revenue: number;
        occupancyRate: number;
        bookingCount: number;
        rating?: number | undefined;
    }, {
        revenue: number;
        occupancyRate: number;
        bookingCount: number;
        rating?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    type: string;
    capacity: number;
    metadata?: any;
    description?: string | undefined;
    amenities?: {
        name: string;
        isPremium: boolean;
        id?: string | undefined;
        description?: string | undefined;
        category?: string | undefined;
        icon?: string | undefined;
    }[] | undefined;
    location?: any;
    stats?: {
        revenue: number;
        occupancyRate: number;
        bookingCount: number;
        rating?: number | undefined;
    } | undefined;
    equipment?: string[] | undefined;
    area?: number | undefined;
    pricing?: any;
    images?: string[] | undefined;
    accessibility?: any;
}, {
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    type: string;
    capacity: number;
    metadata?: any;
    description?: string | undefined;
    amenities?: {
        name: string;
        id?: string | undefined;
        description?: string | undefined;
        category?: string | undefined;
        icon?: string | undefined;
        isPremium?: boolean | undefined;
    }[] | undefined;
    location?: any;
    stats?: {
        revenue: number;
        occupancyRate: number;
        bookingCount: number;
        rating?: number | undefined;
    } | undefined;
    equipment?: string[] | undefined;
    area?: number | undefined;
    pricing?: any;
    images?: string[] | undefined;
    accessibility?: any;
}>;
export declare const bookingResponseSchema: z.ZodObject<{
    id: z.ZodString;
    spaceId: z.ZodString;
    userId: z.ZodString;
    startTime: z.ZodString;
    endTime: z.ZodString;
    status: z.ZodEnum<[string, string, string, string, string, string]>;
    attendees: z.ZodOptional<z.ZodNumber>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    isRecurring: z.ZodBoolean;
    requirements: z.ZodOptional<z.ZodAny>;
    metadata: z.ZodOptional<z.ZodAny>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    space: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<[string, string, string, string, string, string, string, string, string]>;
        status: z.ZodEnum<[string, string, string, string, string]>;
        capacity: z.ZodNumber;
        area: z.ZodOptional<z.ZodNumber>;
        pricing: z.ZodAny;
        amenities: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            icon: z.ZodOptional<z.ZodString>;
            category: z.ZodOptional<z.ZodString>;
            isPremium: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            isPremium: boolean;
            id?: string | undefined;
            description?: string | undefined;
            category?: string | undefined;
            icon?: string | undefined;
        }, {
            name: string;
            id?: string | undefined;
            description?: string | undefined;
            category?: string | undefined;
            icon?: string | undefined;
            isPremium?: boolean | undefined;
        }>, "many">>;
        images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        location: z.ZodOptional<z.ZodAny>;
        equipment: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        accessibility: z.ZodOptional<z.ZodAny>;
        metadata: z.ZodOptional<z.ZodAny>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        stats: z.ZodOptional<z.ZodObject<{
            bookingCount: z.ZodNumber;
            occupancyRate: z.ZodNumber;
            revenue: z.ZodNumber;
            rating: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            revenue: number;
            occupancyRate: number;
            bookingCount: number;
            rating?: number | undefined;
        }, {
            revenue: number;
            occupancyRate: number;
            bookingCount: number;
            rating?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        type: string;
        capacity: number;
        metadata?: any;
        description?: string | undefined;
        amenities?: {
            name: string;
            isPremium: boolean;
            id?: string | undefined;
            description?: string | undefined;
            category?: string | undefined;
            icon?: string | undefined;
        }[] | undefined;
        location?: any;
        stats?: {
            revenue: number;
            occupancyRate: number;
            bookingCount: number;
            rating?: number | undefined;
        } | undefined;
        equipment?: string[] | undefined;
        area?: number | undefined;
        pricing?: any;
        images?: string[] | undefined;
        accessibility?: any;
    }, {
        id: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        type: string;
        capacity: number;
        metadata?: any;
        description?: string | undefined;
        amenities?: {
            name: string;
            id?: string | undefined;
            description?: string | undefined;
            category?: string | undefined;
            icon?: string | undefined;
            isPremium?: boolean | undefined;
        }[] | undefined;
        location?: any;
        stats?: {
            revenue: number;
            occupancyRate: number;
            bookingCount: number;
            rating?: number | undefined;
        } | undefined;
        equipment?: string[] | undefined;
        area?: number | undefined;
        pricing?: any;
        images?: string[] | undefined;
        accessibility?: any;
    }>>;
    user: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    }, {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    spaceId: string;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
    metadata?: any;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    } | undefined;
    space?: {
        id: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        type: string;
        capacity: number;
        metadata?: any;
        description?: string | undefined;
        amenities?: {
            name: string;
            isPremium: boolean;
            id?: string | undefined;
            description?: string | undefined;
            category?: string | undefined;
            icon?: string | undefined;
        }[] | undefined;
        location?: any;
        stats?: {
            revenue: number;
            occupancyRate: number;
            bookingCount: number;
            rating?: number | undefined;
        } | undefined;
        equipment?: string[] | undefined;
        area?: number | undefined;
        pricing?: any;
        images?: string[] | undefined;
        accessibility?: any;
    } | undefined;
    title?: string | undefined;
    description?: string | undefined;
    attendees?: number | undefined;
    requirements?: any;
}, {
    userId: string;
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    spaceId: string;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
    metadata?: any;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    } | undefined;
    space?: {
        id: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        type: string;
        capacity: number;
        metadata?: any;
        description?: string | undefined;
        amenities?: {
            name: string;
            id?: string | undefined;
            description?: string | undefined;
            category?: string | undefined;
            icon?: string | undefined;
            isPremium?: boolean | undefined;
        }[] | undefined;
        location?: any;
        stats?: {
            revenue: number;
            occupancyRate: number;
            bookingCount: number;
            rating?: number | undefined;
        } | undefined;
        equipment?: string[] | undefined;
        area?: number | undefined;
        pricing?: any;
        images?: string[] | undefined;
        accessibility?: any;
    } | undefined;
    title?: string | undefined;
    description?: string | undefined;
    attendees?: number | undefined;
    requirements?: any;
}>;
declare const _default: {
    workspaceStatusSchema: z.ZodEnum<[string, string, string, string]>;
    spaceTypeSchema: z.ZodEnum<[string, string, string, string, string, string, string, string, string]>;
    spaceStatusSchema: z.ZodEnum<[string, string, string, string, string]>;
    bookingStatusSchema: z.ZodEnum<[string, string, string, string, string, string]>;
    membershipTypeSchema: z.ZodEnum<[string, string, string, string, string]>;
    amenitySchema: z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        isPremium: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        isPremium: boolean;
        id?: string | undefined;
        description?: string | undefined;
        category?: string | undefined;
        icon?: string | undefined;
    }, {
        name: string;
        id?: string | undefined;
        description?: string | undefined;
        category?: string | undefined;
        icon?: string | undefined;
        isPremium?: boolean | undefined;
    }>;
    createWorkspaceSchema: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        slug: z.ZodString;
        website: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        address: z.ZodObject<{
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
        coordinates: z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            latitude: number;
            longitude: number;
        }, {
            latitude: number;
            longitude: number;
        }>>;
        logo: z.ZodOptional<z.ZodString>;
        coverImage: z.ZodOptional<z.ZodString>;
        brandColor: z.ZodOptional<z.ZodString>;
        settings: z.ZodObject<{
            currency: z.ZodDefault<z.ZodString>;
            timezone: z.ZodDefault<z.ZodString>;
            language: z.ZodDefault<z.ZodString>;
            businessHours: z.ZodObject<{
                monday: z.ZodObject<{
                    isOpen: z.ZodBoolean;
                    openTime: z.ZodOptional<z.ZodString>;
                    closeTime: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }>;
                tuesday: z.ZodObject<{
                    isOpen: z.ZodBoolean;
                    openTime: z.ZodOptional<z.ZodString>;
                    closeTime: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }>;
                wednesday: z.ZodObject<{
                    isOpen: z.ZodBoolean;
                    openTime: z.ZodOptional<z.ZodString>;
                    closeTime: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }>;
                thursday: z.ZodObject<{
                    isOpen: z.ZodBoolean;
                    openTime: z.ZodOptional<z.ZodString>;
                    closeTime: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }>;
                friday: z.ZodObject<{
                    isOpen: z.ZodBoolean;
                    openTime: z.ZodOptional<z.ZodString>;
                    closeTime: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }>;
                saturday: z.ZodObject<{
                    isOpen: z.ZodBoolean;
                    openTime: z.ZodOptional<z.ZodString>;
                    closeTime: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }>;
                sunday: z.ZodObject<{
                    isOpen: z.ZodBoolean;
                    openTime: z.ZodOptional<z.ZodString>;
                    closeTime: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }>;
            }, "strip", z.ZodTypeAny, {
                monday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                tuesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                wednesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                thursday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                friday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                saturday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                sunday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
            }, {
                monday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                tuesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                wednesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                thursday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                friday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                saturday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                sunday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
            }>;
            bookingPolicy: z.ZodObject<{
                maxAdvanceDays: z.ZodDefault<z.ZodNumber>;
                minBookingDuration: z.ZodDefault<z.ZodNumber>;
                maxBookingDuration: z.ZodDefault<z.ZodNumber>;
                cancellationHours: z.ZodDefault<z.ZodNumber>;
                autoConfirm: z.ZodDefault<z.ZodBoolean>;
                requireDeposit: z.ZodDefault<z.ZodBoolean>;
                depositPercentage: z.ZodDefault<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                maxAdvanceDays: number;
                minBookingDuration: number;
                maxBookingDuration: number;
                cancellationHours: number;
                autoConfirm: boolean;
                requireDeposit: boolean;
                depositPercentage: number;
            }, {
                maxAdvanceDays?: number | undefined;
                minBookingDuration?: number | undefined;
                maxBookingDuration?: number | undefined;
                cancellationHours?: number | undefined;
                autoConfirm?: boolean | undefined;
                requireDeposit?: boolean | undefined;
                depositPercentage?: number | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            currency: string;
            timezone: string;
            language: string;
            businessHours: {
                monday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                tuesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                wednesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                thursday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                friday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                saturday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                sunday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
            };
            bookingPolicy: {
                maxAdvanceDays: number;
                minBookingDuration: number;
                maxBookingDuration: number;
                cancellationHours: number;
                autoConfirm: boolean;
                requireDeposit: boolean;
                depositPercentage: number;
            };
        }, {
            businessHours: {
                monday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                tuesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                wednesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                thursday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                friday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                saturday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                sunday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
            };
            bookingPolicy: {
                maxAdvanceDays?: number | undefined;
                minBookingDuration?: number | undefined;
                maxBookingDuration?: number | undefined;
                cancellationHours?: number | undefined;
                autoConfirm?: boolean | undefined;
                requireDeposit?: boolean | undefined;
                depositPercentage?: number | undefined;
            };
            currency?: string | undefined;
            timezone?: string | undefined;
            language?: string | undefined;
        }>;
        metadata: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        slug: string;
        settings: {
            currency: string;
            timezone: string;
            language: string;
            businessHours: {
                monday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                tuesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                wednesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                thursday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                friday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                saturday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                sunday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
            };
            bookingPolicy: {
                maxAdvanceDays: number;
                minBookingDuration: number;
                maxBookingDuration: number;
                cancellationHours: number;
                autoConfirm: boolean;
                requireDeposit: boolean;
                depositPercentage: number;
            };
        };
        address: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        };
        phone?: string | undefined;
        metadata?: Record<string, any> | undefined;
        email?: string | undefined;
        logo?: string | undefined;
        description?: string | undefined;
        website?: string | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
        coverImage?: string | undefined;
        brandColor?: string | undefined;
    }, {
        name: string;
        slug: string;
        settings: {
            businessHours: {
                monday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                tuesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                wednesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                thursday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                friday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                saturday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                sunday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
            };
            bookingPolicy: {
                maxAdvanceDays?: number | undefined;
                minBookingDuration?: number | undefined;
                maxBookingDuration?: number | undefined;
                cancellationHours?: number | undefined;
                autoConfirm?: boolean | undefined;
                requireDeposit?: boolean | undefined;
                depositPercentage?: number | undefined;
            };
            currency?: string | undefined;
            timezone?: string | undefined;
            language?: string | undefined;
        };
        address: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        };
        phone?: string | undefined;
        metadata?: Record<string, any> | undefined;
        email?: string | undefined;
        logo?: string | undefined;
        description?: string | undefined;
        website?: string | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
        coverImage?: string | undefined;
        brandColor?: string | undefined;
    }>;
    updateWorkspaceSchema: z.ZodObject<Omit<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        slug: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        address: z.ZodOptional<z.ZodObject<{
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
        }>>;
        coordinates: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            latitude: number;
            longitude: number;
        }, {
            latitude: number;
            longitude: number;
        }>>>;
        logo: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        coverImage: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        brandColor: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        settings: z.ZodOptional<z.ZodObject<{
            currency: z.ZodDefault<z.ZodString>;
            timezone: z.ZodDefault<z.ZodString>;
            language: z.ZodDefault<z.ZodString>;
            businessHours: z.ZodObject<{
                monday: z.ZodObject<{
                    isOpen: z.ZodBoolean;
                    openTime: z.ZodOptional<z.ZodString>;
                    closeTime: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }>;
                tuesday: z.ZodObject<{
                    isOpen: z.ZodBoolean;
                    openTime: z.ZodOptional<z.ZodString>;
                    closeTime: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }>;
                wednesday: z.ZodObject<{
                    isOpen: z.ZodBoolean;
                    openTime: z.ZodOptional<z.ZodString>;
                    closeTime: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }>;
                thursday: z.ZodObject<{
                    isOpen: z.ZodBoolean;
                    openTime: z.ZodOptional<z.ZodString>;
                    closeTime: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }>;
                friday: z.ZodObject<{
                    isOpen: z.ZodBoolean;
                    openTime: z.ZodOptional<z.ZodString>;
                    closeTime: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }>;
                saturday: z.ZodObject<{
                    isOpen: z.ZodBoolean;
                    openTime: z.ZodOptional<z.ZodString>;
                    closeTime: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }>;
                sunday: z.ZodObject<{
                    isOpen: z.ZodBoolean;
                    openTime: z.ZodOptional<z.ZodString>;
                    closeTime: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }, {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                }>;
            }, "strip", z.ZodTypeAny, {
                monday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                tuesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                wednesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                thursday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                friday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                saturday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                sunday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
            }, {
                monday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                tuesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                wednesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                thursday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                friday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                saturday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                sunday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
            }>;
            bookingPolicy: z.ZodObject<{
                maxAdvanceDays: z.ZodDefault<z.ZodNumber>;
                minBookingDuration: z.ZodDefault<z.ZodNumber>;
                maxBookingDuration: z.ZodDefault<z.ZodNumber>;
                cancellationHours: z.ZodDefault<z.ZodNumber>;
                autoConfirm: z.ZodDefault<z.ZodBoolean>;
                requireDeposit: z.ZodDefault<z.ZodBoolean>;
                depositPercentage: z.ZodDefault<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                maxAdvanceDays: number;
                minBookingDuration: number;
                maxBookingDuration: number;
                cancellationHours: number;
                autoConfirm: boolean;
                requireDeposit: boolean;
                depositPercentage: number;
            }, {
                maxAdvanceDays?: number | undefined;
                minBookingDuration?: number | undefined;
                maxBookingDuration?: number | undefined;
                cancellationHours?: number | undefined;
                autoConfirm?: boolean | undefined;
                requireDeposit?: boolean | undefined;
                depositPercentage?: number | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            currency: string;
            timezone: string;
            language: string;
            businessHours: {
                monday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                tuesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                wednesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                thursday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                friday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                saturday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                sunday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
            };
            bookingPolicy: {
                maxAdvanceDays: number;
                minBookingDuration: number;
                maxBookingDuration: number;
                cancellationHours: number;
                autoConfirm: boolean;
                requireDeposit: boolean;
                depositPercentage: number;
            };
        }, {
            businessHours: {
                monday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                tuesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                wednesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                thursday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                friday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                saturday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                sunday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
            };
            bookingPolicy: {
                maxAdvanceDays?: number | undefined;
                minBookingDuration?: number | undefined;
                maxBookingDuration?: number | undefined;
                cancellationHours?: number | undefined;
                autoConfirm?: boolean | undefined;
                requireDeposit?: boolean | undefined;
                depositPercentage?: number | undefined;
            };
            currency?: string | undefined;
            timezone?: string | undefined;
            language?: string | undefined;
        }>>;
        metadata: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>>>;
    }, "slug">, "strip", z.ZodTypeAny, {
        phone?: string | undefined;
        metadata?: Record<string, any> | undefined;
        email?: string | undefined;
        name?: string | undefined;
        logo?: string | undefined;
        description?: string | undefined;
        settings?: {
            currency: string;
            timezone: string;
            language: string;
            businessHours: {
                monday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                tuesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                wednesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                thursday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                friday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                saturday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                sunday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
            };
            bookingPolicy: {
                maxAdvanceDays: number;
                minBookingDuration: number;
                maxBookingDuration: number;
                cancellationHours: number;
                autoConfirm: boolean;
                requireDeposit: boolean;
                depositPercentage: number;
            };
        } | undefined;
        address?: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        } | undefined;
        website?: string | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
        coverImage?: string | undefined;
        brandColor?: string | undefined;
    }, {
        phone?: string | undefined;
        metadata?: Record<string, any> | undefined;
        email?: string | undefined;
        name?: string | undefined;
        logo?: string | undefined;
        description?: string | undefined;
        settings?: {
            businessHours: {
                monday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                tuesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                wednesday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                thursday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                friday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                saturday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
                sunday: {
                    isOpen: boolean;
                    openTime?: string | undefined;
                    closeTime?: string | undefined;
                };
            };
            bookingPolicy: {
                maxAdvanceDays?: number | undefined;
                minBookingDuration?: number | undefined;
                maxBookingDuration?: number | undefined;
                cancellationHours?: number | undefined;
                autoConfirm?: boolean | undefined;
                requireDeposit?: boolean | undefined;
                depositPercentage?: number | undefined;
            };
            currency?: string | undefined;
            timezone?: string | undefined;
            language?: string | undefined;
        } | undefined;
        address?: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        } | undefined;
        website?: string | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
        coverImage?: string | undefined;
        brandColor?: string | undefined;
    }>;
    createSpaceSchema: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<[string, string, string, string, string, string, string, string, string]>;
        capacity: z.ZodNumber;
        area: z.ZodOptional<z.ZodNumber>;
        pricing: z.ZodObject<{
            hourly: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodDefault<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                currency: string;
                amount: number;
            }, {
                amount: number;
                currency?: string | undefined;
            }>>;
            daily: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodDefault<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                currency: string;
                amount: number;
            }, {
                amount: number;
                currency?: string | undefined;
            }>>;
            weekly: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodDefault<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                currency: string;
                amount: number;
            }, {
                amount: number;
                currency?: string | undefined;
            }>>;
            monthly: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodDefault<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                currency: string;
                amount: number;
            }, {
                amount: number;
                currency?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            daily?: {
                currency: string;
                amount: number;
            } | undefined;
            weekly?: {
                currency: string;
                amount: number;
            } | undefined;
            monthly?: {
                currency: string;
                amount: number;
            } | undefined;
            hourly?: {
                currency: string;
                amount: number;
            } | undefined;
        }, {
            daily?: {
                amount: number;
                currency?: string | undefined;
            } | undefined;
            weekly?: {
                amount: number;
                currency?: string | undefined;
            } | undefined;
            monthly?: {
                amount: number;
                currency?: string | undefined;
            } | undefined;
            hourly?: {
                amount: number;
                currency?: string | undefined;
            } | undefined;
        }>;
        amenities: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
        images: z.ZodOptional<z.ZodArray<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>, "many">>;
        location: z.ZodOptional<z.ZodObject<{
            floor: z.ZodOptional<z.ZodString>;
            building: z.ZodOptional<z.ZodString>;
            room: z.ZodOptional<z.ZodString>;
            coordinates: z.ZodOptional<z.ZodObject<{
                latitude: z.ZodNumber;
                longitude: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                latitude: number;
                longitude: number;
            }, {
                latitude: number;
                longitude: number;
            }>>;
        }, "strip", z.ZodTypeAny, {
            floor?: string | undefined;
            room?: string | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
            building?: string | undefined;
        }, {
            floor?: string | undefined;
            room?: string | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
            building?: string | undefined;
        }>>;
        equipment: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
        accessibility: z.ZodOptional<z.ZodObject<{
            wheelchairAccessible: z.ZodDefault<z.ZodBoolean>;
            hearingLoopAvailable: z.ZodDefault<z.ZodBoolean>;
            visualAidSupport: z.ZodDefault<z.ZodBoolean>;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            wheelchairAccessible: boolean;
            hearingLoopAvailable: boolean;
            visualAidSupport: boolean;
            notes?: string | undefined;
        }, {
            notes?: string | undefined;
            wheelchairAccessible?: boolean | undefined;
            hearingLoopAvailable?: boolean | undefined;
            visualAidSupport?: boolean | undefined;
        }>>;
        metadata: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: string;
        capacity: number;
        pricing: {
            daily?: {
                currency: string;
                amount: number;
            } | undefined;
            weekly?: {
                currency: string;
                amount: number;
            } | undefined;
            monthly?: {
                currency: string;
                amount: number;
            } | undefined;
            hourly?: {
                currency: string;
                amount: number;
            } | undefined;
        };
        metadata?: Record<string, any> | undefined;
        description?: string | undefined;
        amenities?: string[] | undefined;
        location?: {
            floor?: string | undefined;
            room?: string | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
            building?: string | undefined;
        } | undefined;
        equipment?: string[] | undefined;
        area?: number | undefined;
        images?: (string | undefined)[] | undefined;
        accessibility?: {
            wheelchairAccessible: boolean;
            hearingLoopAvailable: boolean;
            visualAidSupport: boolean;
            notes?: string | undefined;
        } | undefined;
    }, {
        name: string;
        type: string;
        capacity: number;
        pricing: {
            daily?: {
                amount: number;
                currency?: string | undefined;
            } | undefined;
            weekly?: {
                amount: number;
                currency?: string | undefined;
            } | undefined;
            monthly?: {
                amount: number;
                currency?: string | undefined;
            } | undefined;
            hourly?: {
                amount: number;
                currency?: string | undefined;
            } | undefined;
        };
        metadata?: Record<string, any> | undefined;
        description?: string | undefined;
        amenities?: string[] | undefined;
        location?: {
            floor?: string | undefined;
            room?: string | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
            building?: string | undefined;
        } | undefined;
        equipment?: string[] | undefined;
        area?: number | undefined;
        images?: (string | undefined)[] | undefined;
        accessibility?: {
            notes?: string | undefined;
            wheelchairAccessible?: boolean | undefined;
            hearingLoopAvailable?: boolean | undefined;
            visualAidSupport?: boolean | undefined;
        } | undefined;
    }>;
    updateSpaceSchema: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        type: z.ZodOptional<z.ZodEnum<[string, string, string, string, string, string, string, string, string]>>;
        capacity: z.ZodOptional<z.ZodNumber>;
        area: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        pricing: z.ZodOptional<z.ZodObject<{
            hourly: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodDefault<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                currency: string;
                amount: number;
            }, {
                amount: number;
                currency?: string | undefined;
            }>>;
            daily: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodDefault<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                currency: string;
                amount: number;
            }, {
                amount: number;
                currency?: string | undefined;
            }>>;
            weekly: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodDefault<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                currency: string;
                amount: number;
            }, {
                amount: number;
                currency?: string | undefined;
            }>>;
            monthly: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodDefault<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                currency: string;
                amount: number;
            }, {
                amount: number;
                currency?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            daily?: {
                currency: string;
                amount: number;
            } | undefined;
            weekly?: {
                currency: string;
                amount: number;
            } | undefined;
            monthly?: {
                currency: string;
                amount: number;
            } | undefined;
            hourly?: {
                currency: string;
                amount: number;
            } | undefined;
        }, {
            daily?: {
                amount: number;
                currency?: string | undefined;
            } | undefined;
            weekly?: {
                amount: number;
                currency?: string | undefined;
            } | undefined;
            monthly?: {
                amount: number;
                currency?: string | undefined;
            } | undefined;
            hourly?: {
                amount: number;
                currency?: string | undefined;
            } | undefined;
        }>>;
        amenities: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>>;
        images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>, "many">>>;
        location: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            floor: z.ZodOptional<z.ZodString>;
            building: z.ZodOptional<z.ZodString>;
            room: z.ZodOptional<z.ZodString>;
            coordinates: z.ZodOptional<z.ZodObject<{
                latitude: z.ZodNumber;
                longitude: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                latitude: number;
                longitude: number;
            }, {
                latitude: number;
                longitude: number;
            }>>;
        }, "strip", z.ZodTypeAny, {
            floor?: string | undefined;
            room?: string | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
            building?: string | undefined;
        }, {
            floor?: string | undefined;
            room?: string | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
            building?: string | undefined;
        }>>>;
        equipment: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>>;
        accessibility: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            wheelchairAccessible: z.ZodDefault<z.ZodBoolean>;
            hearingLoopAvailable: z.ZodDefault<z.ZodBoolean>;
            visualAidSupport: z.ZodDefault<z.ZodBoolean>;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            wheelchairAccessible: boolean;
            hearingLoopAvailable: boolean;
            visualAidSupport: boolean;
            notes?: string | undefined;
        }, {
            notes?: string | undefined;
            wheelchairAccessible?: boolean | undefined;
            hearingLoopAvailable?: boolean | undefined;
            visualAidSupport?: boolean | undefined;
        }>>>;
        metadata: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>>>;
    } & {
        status: z.ZodOptional<z.ZodEnum<[string, string, string, string, string]>>;
    }, "strip", z.ZodTypeAny, {
        metadata?: Record<string, any> | undefined;
        status?: string | undefined;
        name?: string | undefined;
        description?: string | undefined;
        type?: string | undefined;
        capacity?: number | undefined;
        amenities?: string[] | undefined;
        location?: {
            floor?: string | undefined;
            room?: string | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
            building?: string | undefined;
        } | undefined;
        equipment?: string[] | undefined;
        area?: number | undefined;
        pricing?: {
            daily?: {
                currency: string;
                amount: number;
            } | undefined;
            weekly?: {
                currency: string;
                amount: number;
            } | undefined;
            monthly?: {
                currency: string;
                amount: number;
            } | undefined;
            hourly?: {
                currency: string;
                amount: number;
            } | undefined;
        } | undefined;
        images?: (string | undefined)[] | undefined;
        accessibility?: {
            wheelchairAccessible: boolean;
            hearingLoopAvailable: boolean;
            visualAidSupport: boolean;
            notes?: string | undefined;
        } | undefined;
    }, {
        metadata?: Record<string, any> | undefined;
        status?: string | undefined;
        name?: string | undefined;
        description?: string | undefined;
        type?: string | undefined;
        capacity?: number | undefined;
        amenities?: string[] | undefined;
        location?: {
            floor?: string | undefined;
            room?: string | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
            building?: string | undefined;
        } | undefined;
        equipment?: string[] | undefined;
        area?: number | undefined;
        pricing?: {
            daily?: {
                amount: number;
                currency?: string | undefined;
            } | undefined;
            weekly?: {
                amount: number;
                currency?: string | undefined;
            } | undefined;
            monthly?: {
                amount: number;
                currency?: string | undefined;
            } | undefined;
            hourly?: {
                amount: number;
                currency?: string | undefined;
            } | undefined;
        } | undefined;
        images?: (string | undefined)[] | undefined;
        accessibility?: {
            notes?: string | undefined;
            wheelchairAccessible?: boolean | undefined;
            hearingLoopAvailable?: boolean | undefined;
            visualAidSupport?: boolean | undefined;
        } | undefined;
    }>;
    spaceFiltersSchema: z.ZodObject<{
        type: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
        status: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
        minCapacity: z.ZodOptional<z.ZodNumber>;
        maxCapacity: z.ZodOptional<z.ZodNumber>;
        amenities: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
        available: z.ZodOptional<z.ZodBoolean>;
        priceRange: z.ZodOptional<z.ZodObject<{
            min: z.ZodOptional<z.ZodNumber>;
            max: z.ZodOptional<z.ZodNumber>;
            period: z.ZodDefault<z.ZodEnum<["hourly", "daily", "weekly", "monthly"]>>;
        }, "strip", z.ZodTypeAny, {
            period: "daily" | "weekly" | "monthly" | "hourly";
            min?: number | undefined;
            max?: number | undefined;
        }, {
            period?: "daily" | "weekly" | "monthly" | "hourly" | undefined;
            min?: number | undefined;
            max?: number | undefined;
        }>>;
        floor: z.ZodOptional<z.ZodString>;
        building: z.ZodOptional<z.ZodString>;
        search: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        search?: string | undefined;
        status?: string[] | undefined;
        type?: string[] | undefined;
        amenities?: string[] | undefined;
        maxCapacity?: number | undefined;
        floor?: string | undefined;
        minCapacity?: number | undefined;
        building?: string | undefined;
        available?: boolean | undefined;
        priceRange?: {
            period: "daily" | "weekly" | "monthly" | "hourly";
            min?: number | undefined;
            max?: number | undefined;
        } | undefined;
    }, {
        search?: string | undefined;
        status?: string[] | undefined;
        type?: string[] | undefined;
        amenities?: string[] | undefined;
        maxCapacity?: number | undefined;
        floor?: string | undefined;
        minCapacity?: number | undefined;
        building?: string | undefined;
        available?: boolean | undefined;
        priceRange?: {
            period?: "daily" | "weekly" | "monthly" | "hourly" | undefined;
            min?: number | undefined;
            max?: number | undefined;
        } | undefined;
    }>;
    createBookingSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
        spaceId: z.ZodString;
        startTime: z.ZodString;
        endTime: z.ZodString;
        attendees: z.ZodOptional<z.ZodNumber>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        isRecurring: z.ZodDefault<z.ZodBoolean>;
        recurrencePattern: z.ZodOptional<z.ZodObject<{
            frequency: z.ZodEnum<["daily", "weekly", "monthly"]>;
            interval: z.ZodNumber;
            daysOfWeek: z.ZodOptional<z.ZodArray<z.ZodType<number, z.ZodTypeDef, number>, "many">>;
            endDate: z.ZodOptional<z.ZodString>;
            occurrences: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            frequency: "daily" | "weekly" | "monthly";
            interval: number;
            endDate?: string | undefined;
            daysOfWeek?: number[] | undefined;
            occurrences?: number | undefined;
        }, {
            frequency: "daily" | "weekly" | "monthly";
            interval: number;
            endDate?: string | undefined;
            daysOfWeek?: number[] | undefined;
            occurrences?: number | undefined;
        }>>;
        requirements: z.ZodOptional<z.ZodObject<{
            setup: z.ZodOptional<z.ZodString>;
            equipment: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
            catering: z.ZodOptional<z.ZodString>;
            specialRequests: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            equipment?: string[] | undefined;
            catering?: string | undefined;
            setup?: string | undefined;
            specialRequests?: string | undefined;
        }, {
            equipment?: string[] | undefined;
            catering?: string | undefined;
            setup?: string | undefined;
            specialRequests?: string | undefined;
        }>>;
        metadata: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>>;
    }, "strip", z.ZodTypeAny, {
        spaceId: string;
        startTime: string;
        endTime: string;
        isRecurring: boolean;
        metadata?: Record<string, any> | undefined;
        title?: string | undefined;
        description?: string | undefined;
        attendees?: number | undefined;
        requirements?: {
            equipment?: string[] | undefined;
            catering?: string | undefined;
            setup?: string | undefined;
            specialRequests?: string | undefined;
        } | undefined;
        recurrencePattern?: {
            frequency: "daily" | "weekly" | "monthly";
            interval: number;
            endDate?: string | undefined;
            daysOfWeek?: number[] | undefined;
            occurrences?: number | undefined;
        } | undefined;
    }, {
        spaceId: string;
        startTime: string;
        endTime: string;
        metadata?: Record<string, any> | undefined;
        title?: string | undefined;
        description?: string | undefined;
        attendees?: number | undefined;
        requirements?: {
            equipment?: string[] | undefined;
            catering?: string | undefined;
            setup?: string | undefined;
            specialRequests?: string | undefined;
        } | undefined;
        isRecurring?: boolean | undefined;
        recurrencePattern?: {
            frequency: "daily" | "weekly" | "monthly";
            interval: number;
            endDate?: string | undefined;
            daysOfWeek?: number[] | undefined;
            occurrences?: number | undefined;
        } | undefined;
    }>, {
        spaceId: string;
        startTime: string;
        endTime: string;
        isRecurring: boolean;
        metadata?: Record<string, any> | undefined;
        title?: string | undefined;
        description?: string | undefined;
        attendees?: number | undefined;
        requirements?: {
            equipment?: string[] | undefined;
            catering?: string | undefined;
            setup?: string | undefined;
            specialRequests?: string | undefined;
        } | undefined;
        recurrencePattern?: {
            frequency: "daily" | "weekly" | "monthly";
            interval: number;
            endDate?: string | undefined;
            daysOfWeek?: number[] | undefined;
            occurrences?: number | undefined;
        } | undefined;
    }, {
        spaceId: string;
        startTime: string;
        endTime: string;
        metadata?: Record<string, any> | undefined;
        title?: string | undefined;
        description?: string | undefined;
        attendees?: number | undefined;
        requirements?: {
            equipment?: string[] | undefined;
            catering?: string | undefined;
            setup?: string | undefined;
            specialRequests?: string | undefined;
        } | undefined;
        isRecurring?: boolean | undefined;
        recurrencePattern?: {
            frequency: "daily" | "weekly" | "monthly";
            interval: number;
            endDate?: string | undefined;
            daysOfWeek?: number[] | undefined;
            occurrences?: number | undefined;
        } | undefined;
    }>, {
        spaceId: string;
        startTime: string;
        endTime: string;
        isRecurring: boolean;
        metadata?: Record<string, any> | undefined;
        title?: string | undefined;
        description?: string | undefined;
        attendees?: number | undefined;
        requirements?: {
            equipment?: string[] | undefined;
            catering?: string | undefined;
            setup?: string | undefined;
            specialRequests?: string | undefined;
        } | undefined;
        recurrencePattern?: {
            frequency: "daily" | "weekly" | "monthly";
            interval: number;
            endDate?: string | undefined;
            daysOfWeek?: number[] | undefined;
            occurrences?: number | undefined;
        } | undefined;
    }, {
        spaceId: string;
        startTime: string;
        endTime: string;
        metadata?: Record<string, any> | undefined;
        title?: string | undefined;
        description?: string | undefined;
        attendees?: number | undefined;
        requirements?: {
            equipment?: string[] | undefined;
            catering?: string | undefined;
            setup?: string | undefined;
            specialRequests?: string | undefined;
        } | undefined;
        isRecurring?: boolean | undefined;
        recurrencePattern?: {
            frequency: "daily" | "weekly" | "monthly";
            interval: number;
            endDate?: string | undefined;
            daysOfWeek?: number[] | undefined;
            occurrences?: number | undefined;
        } | undefined;
    }>;
    updateBookingSchema: z.ZodEffects<z.ZodObject<{
        startTime: z.ZodOptional<z.ZodString>;
        endTime: z.ZodOptional<z.ZodString>;
        attendees: z.ZodOptional<z.ZodNumber>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<[string, string, string, string, string, string]>>;
        requirements: z.ZodOptional<z.ZodObject<{
            setup: z.ZodOptional<z.ZodString>;
            equipment: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
            catering: z.ZodOptional<z.ZodString>;
            specialRequests: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            equipment?: string[] | undefined;
            catering?: string | undefined;
            setup?: string | undefined;
            specialRequests?: string | undefined;
        }, {
            equipment?: string[] | undefined;
            catering?: string | undefined;
            setup?: string | undefined;
            specialRequests?: string | undefined;
        }>>;
        metadata: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>>;
    }, "strip", z.ZodTypeAny, {
        metadata?: Record<string, any> | undefined;
        title?: string | undefined;
        status?: string | undefined;
        description?: string | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
        attendees?: number | undefined;
        requirements?: {
            equipment?: string[] | undefined;
            catering?: string | undefined;
            setup?: string | undefined;
            specialRequests?: string | undefined;
        } | undefined;
    }, {
        metadata?: Record<string, any> | undefined;
        title?: string | undefined;
        status?: string | undefined;
        description?: string | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
        attendees?: number | undefined;
        requirements?: {
            equipment?: string[] | undefined;
            catering?: string | undefined;
            setup?: string | undefined;
            specialRequests?: string | undefined;
        } | undefined;
    }>, {
        metadata?: Record<string, any> | undefined;
        title?: string | undefined;
        status?: string | undefined;
        description?: string | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
        attendees?: number | undefined;
        requirements?: {
            equipment?: string[] | undefined;
            catering?: string | undefined;
            setup?: string | undefined;
            specialRequests?: string | undefined;
        } | undefined;
    }, {
        metadata?: Record<string, any> | undefined;
        title?: string | undefined;
        status?: string | undefined;
        description?: string | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
        attendees?: number | undefined;
        requirements?: {
            equipment?: string[] | undefined;
            catering?: string | undefined;
            setup?: string | undefined;
            specialRequests?: string | undefined;
        } | undefined;
    }>;
    bookingFiltersSchema: z.ZodObject<{
        spaceId: z.ZodOptional<z.ZodString>;
        userId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
        spaceType: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
        search: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        search?: string | undefined;
        userId?: string | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        status?: string[] | undefined;
        spaceId?: string | undefined;
        spaceType?: string[] | undefined;
    }, {
        search?: string | undefined;
        userId?: string | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        status?: string[] | undefined;
        spaceId?: string | undefined;
        spaceType?: string[] | undefined;
    }>;
    createMembershipSchema: z.ZodEffects<z.ZodObject<{
        userId: z.ZodString;
        type: z.ZodEnum<[string, string, string, string, string]>;
        startDate: z.ZodString;
        endDate: z.ZodOptional<z.ZodString>;
        pricing: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodDefault<z.ZodString>;
            billingCycle: z.ZodDefault<z.ZodEnum<["monthly", "quarterly", "yearly"]>>;
        }, "strip", z.ZodTypeAny, {
            currency: string;
            billingCycle: "monthly" | "quarterly" | "yearly";
            amount: number;
        }, {
            amount: number;
            currency?: string | undefined;
            billingCycle?: "monthly" | "quarterly" | "yearly" | undefined;
        }>;
        benefits: z.ZodObject<{
            includedHours: z.ZodOptional<z.ZodNumber>;
            discountPercentage: z.ZodOptional<z.ZodNumber>;
            accessLevels: z.ZodOptional<z.ZodArray<z.ZodType<string, z.ZodTypeDef, string>, "many">>;
            priorityBooking: z.ZodDefault<z.ZodBoolean>;
            guestPasses: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            priorityBooking: boolean;
            guestPasses: number;
            discountPercentage?: number | undefined;
            includedHours?: number | undefined;
            accessLevels?: string[] | undefined;
        }, {
            discountPercentage?: number | undefined;
            includedHours?: number | undefined;
            accessLevels?: string[] | undefined;
            priorityBooking?: boolean | undefined;
            guestPasses?: number | undefined;
        }>;
        metadata: z.ZodOptional<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>>;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        startDate: string;
        type: string;
        pricing: {
            currency: string;
            billingCycle: "monthly" | "quarterly" | "yearly";
            amount: number;
        };
        benefits: {
            priorityBooking: boolean;
            guestPasses: number;
            discountPercentage?: number | undefined;
            includedHours?: number | undefined;
            accessLevels?: string[] | undefined;
        };
        metadata?: Record<string, any> | undefined;
        endDate?: string | undefined;
    }, {
        userId: string;
        startDate: string;
        type: string;
        pricing: {
            amount: number;
            currency?: string | undefined;
            billingCycle?: "monthly" | "quarterly" | "yearly" | undefined;
        };
        benefits: {
            discountPercentage?: number | undefined;
            includedHours?: number | undefined;
            accessLevels?: string[] | undefined;
            priorityBooking?: boolean | undefined;
            guestPasses?: number | undefined;
        };
        metadata?: Record<string, any> | undefined;
        endDate?: string | undefined;
    }>, {
        userId: string;
        startDate: string;
        type: string;
        pricing: {
            currency: string;
            billingCycle: "monthly" | "quarterly" | "yearly";
            amount: number;
        };
        benefits: {
            priorityBooking: boolean;
            guestPasses: number;
            discountPercentage?: number | undefined;
            includedHours?: number | undefined;
            accessLevels?: string[] | undefined;
        };
        metadata?: Record<string, any> | undefined;
        endDate?: string | undefined;
    }, {
        userId: string;
        startDate: string;
        type: string;
        pricing: {
            amount: number;
            currency?: string | undefined;
            billingCycle?: "monthly" | "quarterly" | "yearly" | undefined;
        };
        benefits: {
            discountPercentage?: number | undefined;
            includedHours?: number | undefined;
            accessLevels?: string[] | undefined;
            priorityBooking?: boolean | undefined;
            guestPasses?: number | undefined;
        };
        metadata?: Record<string, any> | undefined;
        endDate?: string | undefined;
    }>;
    updateMembershipSchema: any;
    workspaceResponseSchema: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        slug: z.ZodString;
        website: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        address: z.ZodObject<{
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
        coordinates: z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            latitude: number;
            longitude: number;
        }, {
            latitude: number;
            longitude: number;
        }>>;
        logo: z.ZodOptional<z.ZodString>;
        coverImage: z.ZodOptional<z.ZodString>;
        brandColor: z.ZodOptional<z.ZodString>;
        status: z.ZodEnum<[string, string, string, string]>;
        settings: z.ZodAny;
        metadata: z.ZodOptional<z.ZodAny>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        stats: z.ZodOptional<z.ZodObject<{
            totalSpaces: z.ZodNumber;
            totalMembers: z.ZodNumber;
            totalBookings: z.ZodNumber;
            occupancyRate: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            totalBookings: number;
            occupancyRate: number;
            totalSpaces: number;
            totalMembers: number;
        }, {
            totalBookings: number;
            occupancyRate: number;
            totalSpaces: number;
            totalMembers: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        slug: string;
        address: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        };
        phone?: string | undefined;
        metadata?: any;
        email?: string | undefined;
        logo?: string | undefined;
        description?: string | undefined;
        settings?: any;
        stats?: {
            totalBookings: number;
            occupancyRate: number;
            totalSpaces: number;
            totalMembers: number;
        } | undefined;
        website?: string | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
        coverImage?: string | undefined;
        brandColor?: string | undefined;
    }, {
        id: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        slug: string;
        address: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        };
        phone?: string | undefined;
        metadata?: any;
        email?: string | undefined;
        logo?: string | undefined;
        description?: string | undefined;
        settings?: any;
        stats?: {
            totalBookings: number;
            occupancyRate: number;
            totalSpaces: number;
            totalMembers: number;
        } | undefined;
        website?: string | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
        coverImage?: string | undefined;
        brandColor?: string | undefined;
    }>;
    spaceResponseSchema: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<[string, string, string, string, string, string, string, string, string]>;
        status: z.ZodEnum<[string, string, string, string, string]>;
        capacity: z.ZodNumber;
        area: z.ZodOptional<z.ZodNumber>;
        pricing: z.ZodAny;
        amenities: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            icon: z.ZodOptional<z.ZodString>;
            category: z.ZodOptional<z.ZodString>;
            isPremium: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            isPremium: boolean;
            id?: string | undefined;
            description?: string | undefined;
            category?: string | undefined;
            icon?: string | undefined;
        }, {
            name: string;
            id?: string | undefined;
            description?: string | undefined;
            category?: string | undefined;
            icon?: string | undefined;
            isPremium?: boolean | undefined;
        }>, "many">>;
        images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        location: z.ZodOptional<z.ZodAny>;
        equipment: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        accessibility: z.ZodOptional<z.ZodAny>;
        metadata: z.ZodOptional<z.ZodAny>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        stats: z.ZodOptional<z.ZodObject<{
            bookingCount: z.ZodNumber;
            occupancyRate: z.ZodNumber;
            revenue: z.ZodNumber;
            rating: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            revenue: number;
            occupancyRate: number;
            bookingCount: number;
            rating?: number | undefined;
        }, {
            revenue: number;
            occupancyRate: number;
            bookingCount: number;
            rating?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        type: string;
        capacity: number;
        metadata?: any;
        description?: string | undefined;
        amenities?: {
            name: string;
            isPremium: boolean;
            id?: string | undefined;
            description?: string | undefined;
            category?: string | undefined;
            icon?: string | undefined;
        }[] | undefined;
        location?: any;
        stats?: {
            revenue: number;
            occupancyRate: number;
            bookingCount: number;
            rating?: number | undefined;
        } | undefined;
        equipment?: string[] | undefined;
        area?: number | undefined;
        pricing?: any;
        images?: string[] | undefined;
        accessibility?: any;
    }, {
        id: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        type: string;
        capacity: number;
        metadata?: any;
        description?: string | undefined;
        amenities?: {
            name: string;
            id?: string | undefined;
            description?: string | undefined;
            category?: string | undefined;
            icon?: string | undefined;
            isPremium?: boolean | undefined;
        }[] | undefined;
        location?: any;
        stats?: {
            revenue: number;
            occupancyRate: number;
            bookingCount: number;
            rating?: number | undefined;
        } | undefined;
        equipment?: string[] | undefined;
        area?: number | undefined;
        pricing?: any;
        images?: string[] | undefined;
        accessibility?: any;
    }>;
    bookingResponseSchema: z.ZodObject<{
        id: z.ZodString;
        spaceId: z.ZodString;
        userId: z.ZodString;
        startTime: z.ZodString;
        endTime: z.ZodString;
        status: z.ZodEnum<[string, string, string, string, string, string]>;
        attendees: z.ZodOptional<z.ZodNumber>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        isRecurring: z.ZodBoolean;
        requirements: z.ZodOptional<z.ZodAny>;
        metadata: z.ZodOptional<z.ZodAny>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        space: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            type: z.ZodEnum<[string, string, string, string, string, string, string, string, string]>;
            status: z.ZodEnum<[string, string, string, string, string]>;
            capacity: z.ZodNumber;
            area: z.ZodOptional<z.ZodNumber>;
            pricing: z.ZodAny;
            amenities: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodOptional<z.ZodString>;
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                icon: z.ZodOptional<z.ZodString>;
                category: z.ZodOptional<z.ZodString>;
                isPremium: z.ZodDefault<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                isPremium: boolean;
                id?: string | undefined;
                description?: string | undefined;
                category?: string | undefined;
                icon?: string | undefined;
            }, {
                name: string;
                id?: string | undefined;
                description?: string | undefined;
                category?: string | undefined;
                icon?: string | undefined;
                isPremium?: boolean | undefined;
            }>, "many">>;
            images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            location: z.ZodOptional<z.ZodAny>;
            equipment: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            accessibility: z.ZodOptional<z.ZodAny>;
            metadata: z.ZodOptional<z.ZodAny>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
            stats: z.ZodOptional<z.ZodObject<{
                bookingCount: z.ZodNumber;
                occupancyRate: z.ZodNumber;
                revenue: z.ZodNumber;
                rating: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                revenue: number;
                occupancyRate: number;
                bookingCount: number;
                rating?: number | undefined;
            }, {
                revenue: number;
                occupancyRate: number;
                bookingCount: number;
                rating?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            status: string;
            createdAt: string;
            updatedAt: string;
            name: string;
            type: string;
            capacity: number;
            metadata?: any;
            description?: string | undefined;
            amenities?: {
                name: string;
                isPremium: boolean;
                id?: string | undefined;
                description?: string | undefined;
                category?: string | undefined;
                icon?: string | undefined;
            }[] | undefined;
            location?: any;
            stats?: {
                revenue: number;
                occupancyRate: number;
                bookingCount: number;
                rating?: number | undefined;
            } | undefined;
            equipment?: string[] | undefined;
            area?: number | undefined;
            pricing?: any;
            images?: string[] | undefined;
            accessibility?: any;
        }, {
            id: string;
            status: string;
            createdAt: string;
            updatedAt: string;
            name: string;
            type: string;
            capacity: number;
            metadata?: any;
            description?: string | undefined;
            amenities?: {
                name: string;
                id?: string | undefined;
                description?: string | undefined;
                category?: string | undefined;
                icon?: string | undefined;
                isPremium?: boolean | undefined;
            }[] | undefined;
            location?: any;
            stats?: {
                revenue: number;
                occupancyRate: number;
                bookingCount: number;
                rating?: number | undefined;
            } | undefined;
            equipment?: string[] | undefined;
            area?: number | undefined;
            pricing?: any;
            images?: string[] | undefined;
            accessibility?: any;
        }>>;
        user: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            firstName: z.ZodString;
            lastName: z.ZodString;
            email: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        }, {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        id: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        spaceId: string;
        startTime: string;
        endTime: string;
        isRecurring: boolean;
        metadata?: any;
        user?: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | undefined;
        space?: {
            id: string;
            status: string;
            createdAt: string;
            updatedAt: string;
            name: string;
            type: string;
            capacity: number;
            metadata?: any;
            description?: string | undefined;
            amenities?: {
                name: string;
                isPremium: boolean;
                id?: string | undefined;
                description?: string | undefined;
                category?: string | undefined;
                icon?: string | undefined;
            }[] | undefined;
            location?: any;
            stats?: {
                revenue: number;
                occupancyRate: number;
                bookingCount: number;
                rating?: number | undefined;
            } | undefined;
            equipment?: string[] | undefined;
            area?: number | undefined;
            pricing?: any;
            images?: string[] | undefined;
            accessibility?: any;
        } | undefined;
        title?: string | undefined;
        description?: string | undefined;
        attendees?: number | undefined;
        requirements?: any;
    }, {
        userId: string;
        id: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        spaceId: string;
        startTime: string;
        endTime: string;
        isRecurring: boolean;
        metadata?: any;
        user?: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | undefined;
        space?: {
            id: string;
            status: string;
            createdAt: string;
            updatedAt: string;
            name: string;
            type: string;
            capacity: number;
            metadata?: any;
            description?: string | undefined;
            amenities?: {
                name: string;
                id?: string | undefined;
                description?: string | undefined;
                category?: string | undefined;
                icon?: string | undefined;
                isPremium?: boolean | undefined;
            }[] | undefined;
            location?: any;
            stats?: {
                revenue: number;
                occupancyRate: number;
                bookingCount: number;
                rating?: number | undefined;
            } | undefined;
            equipment?: string[] | undefined;
            area?: number | undefined;
            pricing?: any;
            images?: string[] | undefined;
            accessibility?: any;
        } | undefined;
        title?: string | undefined;
        description?: string | undefined;
        attendees?: number | undefined;
        requirements?: any;
    }>;
};
export default _default;
//# sourceMappingURL=workspace.d.ts.map