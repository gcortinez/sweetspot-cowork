"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingResponseSchema = exports.spaceResponseSchema = exports.workspaceResponseSchema = exports.updateMembershipSchema = exports.createMembershipSchema = exports.bookingFiltersSchema = exports.updateBookingSchema = exports.createBookingSchema = exports.spaceFiltersSchema = exports.updateSpaceSchema = exports.createSpaceSchema = exports.updateWorkspaceSchema = exports.createWorkspaceSchema = exports.amenitySchema = exports.membershipTypeSchema = exports.bookingStatusSchema = exports.spaceStatusSchema = exports.spaceTypeSchema = exports.workspaceStatusSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.workspaceStatusSchema = (0, common_1.createEnumSchema)([
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED",
    "MAINTENANCE"
], "Invalid workspace status");
exports.spaceTypeSchema = (0, common_1.createEnumSchema)([
    "PRIVATE_OFFICE",
    "MEETING_ROOM",
    "HOT_DESK",
    "CONFERENCE_ROOM",
    "PHONE_BOOTH",
    "EVENT_SPACE",
    "LOUNGE",
    "KITCHEN",
    "OTHER"
], "Invalid space type");
exports.spaceStatusSchema = (0, common_1.createEnumSchema)([
    "AVAILABLE",
    "OCCUPIED",
    "MAINTENANCE",
    "DISABLED",
    "RESERVED"
], "Invalid space status");
exports.bookingStatusSchema = (0, common_1.createEnumSchema)([
    "PENDING",
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW"
], "Invalid booking status");
exports.membershipTypeSchema = (0, common_1.createEnumSchema)([
    "BASIC",
    "PREMIUM",
    "ENTERPRISE",
    "DAY_PASS",
    "CUSTOM"
], "Invalid membership type");
exports.amenitySchema = zod_1.z.object({
    id: common_1.idSchema.optional(),
    name: zod_1.z.string().min(1, "Amenity name is required").max(100, "Amenity name too long"),
    description: zod_1.z.string().max(500, "Description too long").optional(),
    icon: zod_1.z.string().max(50, "Icon name too long").optional(),
    category: zod_1.z.string().max(50, "Category too long").optional(),
    isPremium: zod_1.z.boolean().default(false),
});
exports.createWorkspaceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Workspace name is required").max(100, "Workspace name too long"),
    description: zod_1.z.string().max(1000, "Description too long").optional(),
    slug: zod_1.z.string()
        .min(3, "Slug must be at least 3 characters")
        .max(50, "Slug too long")
        .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
    website: common_1.urlSchema,
    email: common_1.emailSchema.optional(),
    phone: common_1.phoneSchema,
    address: common_1.addressSchema,
    coordinates: common_1.coordinatesSchema.optional(),
    logo: common_1.urlSchema,
    coverImage: common_1.urlSchema,
    brandColor: common_1.colorSchema,
    settings: zod_1.z.object({
        currency: zod_1.z.string().length(3, "Currency must be 3 characters").default("USD"),
        timezone: zod_1.z.string().min(1, "Timezone is required").default("UTC"),
        language: zod_1.z.string().length(2, "Language must be 2 characters").default("en"),
        businessHours: zod_1.z.object({
            monday: zod_1.z.object({
                isOpen: zod_1.z.boolean(),
                openTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
                closeTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
            }),
            tuesday: zod_1.z.object({
                isOpen: zod_1.z.boolean(),
                openTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
                closeTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
            }),
            wednesday: zod_1.z.object({
                isOpen: zod_1.z.boolean(),
                openTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
                closeTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
            }),
            thursday: zod_1.z.object({
                isOpen: zod_1.z.boolean(),
                openTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
                closeTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
            }),
            friday: zod_1.z.object({
                isOpen: zod_1.z.boolean(),
                openTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
                closeTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
            }),
            saturday: zod_1.z.object({
                isOpen: zod_1.z.boolean(),
                openTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
                closeTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
            }),
            sunday: zod_1.z.object({
                isOpen: zod_1.z.boolean(),
                openTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
                closeTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
            }),
        }),
        bookingPolicy: zod_1.z.object({
            maxAdvanceDays: zod_1.z.number().min(1, "Must allow at least 1 day advance").max(365, "Cannot exceed 365 days").default(30),
            minBookingDuration: zod_1.z.number().min(0.5, "Minimum duration is 30 minutes").default(1),
            maxBookingDuration: zod_1.z.number().min(1, "Maximum duration must be at least 1 hour").default(8),
            cancellationHours: zod_1.z.number().min(0, "Cancellation hours cannot be negative").default(24),
            autoConfirm: zod_1.z.boolean().default(true),
            requireDeposit: zod_1.z.boolean().default(false),
            depositPercentage: zod_1.z.number().min(0, "Deposit percentage cannot be negative").max(100, "Deposit cannot exceed 100%").default(0),
        }),
    }),
    metadata: common_1.metadataSchema,
});
exports.updateWorkspaceSchema = exports.createWorkspaceSchema.partial().omit({ slug: true });
exports.createSpaceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Space name is required").max(100, "Space name too long"),
    description: zod_1.z.string().max(1000, "Description too long").optional(),
    type: exports.spaceTypeSchema,
    capacity: zod_1.z.number().min(1, "Capacity must be at least 1").max(100, "Capacity too large"),
    area: zod_1.z.number().positive("Area must be positive").optional(),
    pricing: zod_1.z.object({
        hourly: common_1.moneySchema.optional(),
        daily: common_1.moneySchema.optional(),
        weekly: common_1.moneySchema.optional(),
        monthly: common_1.moneySchema.optional(),
    }),
    amenities: (0, common_1.createArraySchema)(common_1.idSchema, { maxLength: 50 }).optional(),
    images: (0, common_1.createArraySchema)(common_1.urlSchema, { maxLength: 10 }).optional(),
    location: zod_1.z.object({
        floor: zod_1.z.string().max(20, "Floor identifier too long").optional(),
        building: zod_1.z.string().max(50, "Building name too long").optional(),
        room: zod_1.z.string().max(50, "Room identifier too long").optional(),
        coordinates: common_1.coordinatesSchema.optional(),
    }).optional(),
    equipment: (0, common_1.createArraySchema)(zod_1.z.string().max(100, "Equipment name too long"), { maxLength: 20 }).optional(),
    accessibility: zod_1.z.object({
        wheelchairAccessible: zod_1.z.boolean().default(false),
        hearingLoopAvailable: zod_1.z.boolean().default(false),
        visualAidSupport: zod_1.z.boolean().default(false),
        notes: zod_1.z.string().max(500, "Accessibility notes too long").optional(),
    }).optional(),
    metadata: common_1.metadataSchema,
});
exports.updateSpaceSchema = exports.createSpaceSchema.partial().extend({
    status: exports.spaceStatusSchema.optional(),
});
exports.spaceFiltersSchema = zod_1.z.object({
    type: (0, common_1.createArraySchema)(exports.spaceTypeSchema).optional(),
    status: (0, common_1.createArraySchema)(exports.spaceStatusSchema).optional(),
    minCapacity: zod_1.z.number().min(1, "Minimum capacity must be at least 1").optional(),
    maxCapacity: zod_1.z.number().min(1, "Maximum capacity must be at least 1").optional(),
    amenities: (0, common_1.createArraySchema)(common_1.idSchema).optional(),
    available: zod_1.z.boolean().optional(),
    priceRange: zod_1.z.object({
        min: zod_1.z.number().nonnegative("Minimum price cannot be negative").optional(),
        max: zod_1.z.number().positive("Maximum price must be positive").optional(),
        period: zod_1.z.enum(["hourly", "daily", "weekly", "monthly"]).default("hourly"),
    }).optional(),
    floor: zod_1.z.string().optional(),
    building: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
});
exports.createBookingSchema = zod_1.z.object({
    spaceId: common_1.idSchema,
    startTime: zod_1.z.string().datetime("Invalid start time format"),
    endTime: zod_1.z.string().datetime("Invalid end time format"),
    attendees: zod_1.z.number().min(1, "Must have at least 1 attendee").optional(),
    title: zod_1.z.string().min(1, "Booking title is required").max(200, "Title too long").optional(),
    description: zod_1.z.string().max(1000, "Description too long").optional(),
    isRecurring: zod_1.z.boolean().default(false),
    recurrencePattern: zod_1.z.object({
        frequency: zod_1.z.enum(["daily", "weekly", "monthly"]),
        interval: zod_1.z.number().min(1, "Interval must be at least 1").max(12, "Interval too large"),
        daysOfWeek: (0, common_1.createArraySchema)(zod_1.z.number().min(0).max(6)).optional(),
        endDate: zod_1.z.string().datetime().optional(),
        occurrences: zod_1.z.number().min(1, "Must have at least 1 occurrence").max(100, "Too many occurrences").optional(),
    }).optional(),
    requirements: zod_1.z.object({
        setup: zod_1.z.string().max(500, "Setup requirements too long").optional(),
        equipment: (0, common_1.createArraySchema)(zod_1.z.string().max(100)).optional(),
        catering: zod_1.z.string().max(500, "Catering requirements too long").optional(),
        specialRequests: zod_1.z.string().max(500, "Special requests too long").optional(),
    }).optional(),
    metadata: common_1.metadataSchema,
}).refine(data => new Date(data.startTime) < new Date(data.endTime), {
    message: "Start time must be before end time",
    path: ["endTime"],
}).refine(data => new Date(data.startTime) > new Date(), {
    message: "Start time must be in the future",
    path: ["startTime"],
});
exports.updateBookingSchema = zod_1.z.object({
    startTime: zod_1.z.string().datetime("Invalid start time format").optional(),
    endTime: zod_1.z.string().datetime("Invalid end time format").optional(),
    attendees: zod_1.z.number().min(1, "Must have at least 1 attendee").optional(),
    title: zod_1.z.string().min(1, "Booking title is required").max(200, "Title too long").optional(),
    description: zod_1.z.string().max(1000, "Description too long").optional(),
    status: exports.bookingStatusSchema.optional(),
    requirements: zod_1.z.object({
        setup: zod_1.z.string().max(500, "Setup requirements too long").optional(),
        equipment: (0, common_1.createArraySchema)(zod_1.z.string().max(100)).optional(),
        catering: zod_1.z.string().max(500, "Catering requirements too long").optional(),
        specialRequests: zod_1.z.string().max(500, "Special requests too long").optional(),
    }).optional(),
    metadata: common_1.metadataSchema,
}).refine(data => {
    if (data.startTime && data.endTime) {
        return new Date(data.startTime) < new Date(data.endTime);
    }
    return true;
}, {
    message: "Start time must be before end time",
    path: ["endTime"],
});
exports.bookingFiltersSchema = zod_1.z.object({
    spaceId: common_1.idSchema.optional(),
    userId: common_1.idSchema.optional(),
    status: (0, common_1.createArraySchema)(exports.bookingStatusSchema).optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    spaceType: (0, common_1.createArraySchema)(exports.spaceTypeSchema).optional(),
    search: zod_1.z.string().optional(),
});
exports.createMembershipSchema = zod_1.z.object({
    userId: common_1.idSchema,
    type: exports.membershipTypeSchema,
    startDate: zod_1.z.string().datetime("Invalid start date"),
    endDate: zod_1.z.string().datetime("Invalid end date").optional(),
    pricing: zod_1.z.object({
        amount: zod_1.z.number().nonnegative("Amount cannot be negative"),
        currency: zod_1.z.string().length(3, "Currency must be 3 characters").default("USD"),
        billingCycle: zod_1.z.enum(["monthly", "quarterly", "yearly"]).default("monthly"),
    }),
    benefits: zod_1.z.object({
        includedHours: zod_1.z.number().nonnegative("Included hours cannot be negative").optional(),
        discountPercentage: zod_1.z.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%").optional(),
        accessLevels: (0, common_1.createArraySchema)(zod_1.z.string().max(50)).optional(),
        priorityBooking: zod_1.z.boolean().default(false),
        guestPasses: zod_1.z.number().nonnegative("Guest passes cannot be negative").default(0),
    }),
    metadata: common_1.metadataSchema,
}).refine(data => {
    if (data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
}, {
    message: "Start date must be before end date",
    path: ["endDate"],
});
exports.updateMembershipSchema = exports.createMembershipSchema.partial().omit({ userId: true });
exports.workspaceResponseSchema = zod_1.z.object({
    id: common_1.idSchema,
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    slug: zod_1.z.string(),
    website: zod_1.z.string().optional(),
    email: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    address: common_1.addressSchema,
    coordinates: common_1.coordinatesSchema.optional(),
    logo: zod_1.z.string().optional(),
    coverImage: zod_1.z.string().optional(),
    brandColor: zod_1.z.string().optional(),
    status: exports.workspaceStatusSchema,
    settings: zod_1.z.any(),
    metadata: zod_1.z.any().optional(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    stats: zod_1.z.object({
        totalSpaces: zod_1.z.number(),
        totalMembers: zod_1.z.number(),
        totalBookings: zod_1.z.number(),
        occupancyRate: zod_1.z.number(),
    }).optional(),
});
exports.spaceResponseSchema = zod_1.z.object({
    id: common_1.idSchema,
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    type: exports.spaceTypeSchema,
    status: exports.spaceStatusSchema,
    capacity: zod_1.z.number(),
    area: zod_1.z.number().optional(),
    pricing: zod_1.z.any(),
    amenities: zod_1.z.array(exports.amenitySchema).optional(),
    images: zod_1.z.array(zod_1.z.string()).optional(),
    location: zod_1.z.any().optional(),
    equipment: zod_1.z.array(zod_1.z.string()).optional(),
    accessibility: zod_1.z.any().optional(),
    metadata: zod_1.z.any().optional(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    stats: zod_1.z.object({
        bookingCount: zod_1.z.number(),
        occupancyRate: zod_1.z.number(),
        revenue: zod_1.z.number(),
        rating: zod_1.z.number().optional(),
    }).optional(),
});
exports.bookingResponseSchema = zod_1.z.object({
    id: common_1.idSchema,
    spaceId: common_1.idSchema,
    userId: common_1.idSchema,
    startTime: zod_1.z.string().datetime(),
    endTime: zod_1.z.string().datetime(),
    status: exports.bookingStatusSchema,
    attendees: zod_1.z.number().optional(),
    title: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    isRecurring: zod_1.z.boolean(),
    requirements: zod_1.z.any().optional(),
    metadata: zod_1.z.any().optional(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    space: exports.spaceResponseSchema.optional(),
    user: zod_1.z.object({
        id: common_1.idSchema,
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
        email: zod_1.z.string(),
    }).optional(),
});
exports.default = {
    workspaceStatusSchema: exports.workspaceStatusSchema,
    spaceTypeSchema: exports.spaceTypeSchema,
    spaceStatusSchema: exports.spaceStatusSchema,
    bookingStatusSchema: exports.bookingStatusSchema,
    membershipTypeSchema: exports.membershipTypeSchema,
    amenitySchema: exports.amenitySchema,
    createWorkspaceSchema: exports.createWorkspaceSchema,
    updateWorkspaceSchema: exports.updateWorkspaceSchema,
    createSpaceSchema: exports.createSpaceSchema,
    updateSpaceSchema: exports.updateSpaceSchema,
    spaceFiltersSchema: exports.spaceFiltersSchema,
    createBookingSchema: exports.createBookingSchema,
    updateBookingSchema: exports.updateBookingSchema,
    bookingFiltersSchema: exports.bookingFiltersSchema,
    createMembershipSchema: exports.createMembershipSchema,
    updateMembershipSchema: exports.updateMembershipSchema,
    workspaceResponseSchema: exports.workspaceResponseSchema,
    spaceResponseSchema: exports.spaceResponseSchema,
    bookingResponseSchema: exports.bookingResponseSchema,
};
//# sourceMappingURL=workspace.js.map