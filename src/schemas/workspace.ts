import { z } from "zod";
import { 
  idSchema, 
  emailSchema, 
  phoneSchema, 
  urlSchema, 
  addressSchema, 
  coordinatesSchema,
  colorSchema,
  metadataSchema,
  moneySchema,
  createEnumSchema,
  createArraySchema
} from "./common";

// Workspace status enum
export const workspaceStatusSchema = createEnumSchema([
  "ACTIVE",
  "INACTIVE", 
  "SUSPENDED",
  "MAINTENANCE"
], "Invalid workspace status");

// Space type enum
export const spaceTypeSchema = createEnumSchema([
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

// Space status enum  
export const spaceStatusSchema = createEnumSchema([
  "AVAILABLE",
  "OCCUPIED",
  "MAINTENANCE",
  "DISABLED",
  "RESERVED"
], "Invalid space status");

// Booking status enum
export const bookingStatusSchema = createEnumSchema([
  "PENDING",
  "CONFIRMED", 
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW"
], "Invalid booking status");

// Membership type enum
export const membershipTypeSchema = createEnumSchema([
  "BASIC",
  "PREMIUM", 
  "ENTERPRISE",
  "DAY_PASS",
  "CUSTOM"
], "Invalid membership type");

// Amenity schemas
export const amenitySchema = z.object({
  id: idSchema.optional(),
  name: z.string().min(1, "Amenity name is required").max(100, "Amenity name too long"),
  description: z.string().max(500, "Description too long").optional(),
  icon: z.string().max(50, "Icon name too long").optional(),
  category: z.string().max(50, "Category too long").optional(),
  isPremium: z.boolean().default(false),
});

// Create workspace schema
export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100, "Workspace name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  slug: z.string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug too long")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  website: urlSchema,
  email: emailSchema.optional(),
  phone: phoneSchema,
  address: addressSchema,
  coordinates: coordinatesSchema.optional(),
  logo: urlSchema,
  coverImage: urlSchema,
  brandColor: colorSchema,
  settings: z.object({
    currency: z.string().length(3, "Currency must be 3 characters").default("USD"),
    timezone: z.string().min(1, "Timezone is required").default("UTC"),
    language: z.string().length(2, "Language must be 2 characters").default("en"),
    businessHours: z.object({
      monday: z.object({
        isOpen: z.boolean(),
        openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
        closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
      }),
      tuesday: z.object({
        isOpen: z.boolean(),
        openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
        closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
      }),
      wednesday: z.object({
        isOpen: z.boolean(),
        openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
        closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
      }),
      thursday: z.object({
        isOpen: z.boolean(),
        openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
        closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
      }),
      friday: z.object({
        isOpen: z.boolean(),
        openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
        closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
      }),
      saturday: z.object({
        isOpen: z.boolean(),
        openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
        closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
      }),
      sunday: z.object({
        isOpen: z.boolean(),
        openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
        closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
      }),
    }),
    bookingPolicy: z.object({
      maxAdvanceDays: z.number().min(1, "Must allow at least 1 day advance").max(365, "Cannot exceed 365 days").default(30),
      minBookingDuration: z.number().min(0.5, "Minimum duration is 30 minutes").default(1), // hours
      maxBookingDuration: z.number().min(1, "Maximum duration must be at least 1 hour").default(8), // hours
      cancellationHours: z.number().min(0, "Cancellation hours cannot be negative").default(24),
      autoConfirm: z.boolean().default(true),
      requireDeposit: z.boolean().default(false),
      depositPercentage: z.number().min(0, "Deposit percentage cannot be negative").max(100, "Deposit cannot exceed 100%").default(0),
    }),
  }),
  metadata: metadataSchema,
});

// Update workspace schema
export const updateWorkspaceSchema = createWorkspaceSchema.partial().omit({ slug: true });

// Create space schema
export const createSpaceSchema = z.object({
  name: z.string().min(1, "Space name is required").max(100, "Space name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  type: spaceTypeSchema,
  capacity: z.number().min(1, "Capacity must be at least 1").max(100, "Capacity too large"),
  area: z.number().positive("Area must be positive").optional(), // square meters/feet
  pricing: z.object({
    hourly: moneySchema.optional(),
    daily: moneySchema.optional(),
    weekly: moneySchema.optional(),
    monthly: moneySchema.optional(),
  }),
  amenities: createArraySchema(idSchema, { maxLength: 50 }).optional(),
  images: createArraySchema(urlSchema, { maxLength: 10 }).optional(),
  location: z.object({
    floor: z.string().max(20, "Floor identifier too long").optional(),
    building: z.string().max(50, "Building name too long").optional(),
    room: z.string().max(50, "Room identifier too long").optional(),
    coordinates: coordinatesSchema.optional(),
  }).optional(),
  equipment: createArraySchema(z.string().max(100, "Equipment name too long"), { maxLength: 20 }).optional(),
  accessibility: z.object({
    wheelchairAccessible: z.boolean().default(false),
    hearingLoopAvailable: z.boolean().default(false),
    visualAidSupport: z.boolean().default(false),
    notes: z.string().max(500, "Accessibility notes too long").optional(),
  }).optional(),
  metadata: metadataSchema,
});

// Update space schema
export const updateSpaceSchema = createSpaceSchema.partial().extend({
  status: spaceStatusSchema.optional(),
});

// Space filters schema
export const spaceFiltersSchema = z.object({
  type: createArraySchema(spaceTypeSchema).optional(),
  status: createArraySchema(spaceStatusSchema).optional(),
  minCapacity: z.number().min(1, "Minimum capacity must be at least 1").optional(),
  maxCapacity: z.number().min(1, "Maximum capacity must be at least 1").optional(),
  amenities: createArraySchema(idSchema).optional(),
  available: z.boolean().optional(),
  priceRange: z.object({
    min: z.number().nonnegative("Minimum price cannot be negative").optional(),
    max: z.number().positive("Maximum price must be positive").optional(),
    period: z.enum(["hourly", "daily", "weekly", "monthly"]).default("hourly"),
  }).optional(),
  floor: z.string().optional(),
  building: z.string().optional(),
  search: z.string().optional(),
});

// Create booking schema
export const createBookingSchema = z.object({
  spaceId: idSchema,
  startTime: z.string().datetime("Invalid start time format"),
  endTime: z.string().datetime("Invalid end time format"),
  attendees: z.number().min(1, "Must have at least 1 attendee").optional(),
  title: z.string().min(1, "Booking title is required").max(200, "Title too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.object({
    frequency: z.enum(["daily", "weekly", "monthly"]),
    interval: z.number().min(1, "Interval must be at least 1").max(12, "Interval too large"),
    daysOfWeek: createArraySchema(z.number().min(0).max(6)).optional(), // 0 = Sunday, 6 = Saturday
    endDate: z.string().datetime().optional(),
    occurrences: z.number().min(1, "Must have at least 1 occurrence").max(100, "Too many occurrences").optional(),
  }).optional(),
  requirements: z.object({
    setup: z.string().max(500, "Setup requirements too long").optional(),
    equipment: createArraySchema(z.string().max(100)).optional(),
    catering: z.string().max(500, "Catering requirements too long").optional(),
    specialRequests: z.string().max(500, "Special requests too long").optional(),
  }).optional(),
  metadata: metadataSchema,
}).refine(data => new Date(data.startTime) < new Date(data.endTime), {
  message: "Start time must be before end time",
  path: ["endTime"],
}).refine(data => new Date(data.startTime) > new Date(), {
  message: "Start time must be in the future",
  path: ["startTime"],
});

// Update booking schema
export const updateBookingSchema = z.object({
  startTime: z.string().datetime("Invalid start time format").optional(),
  endTime: z.string().datetime("Invalid end time format").optional(),
  attendees: z.number().min(1, "Must have at least 1 attendee").optional(),
  title: z.string().min(1, "Booking title is required").max(200, "Title too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  status: bookingStatusSchema.optional(),
  requirements: z.object({
    setup: z.string().max(500, "Setup requirements too long").optional(),
    equipment: createArraySchema(z.string().max(100)).optional(),
    catering: z.string().max(500, "Catering requirements too long").optional(),
    specialRequests: z.string().max(500, "Special requests too long").optional(),
  }).optional(),
  metadata: metadataSchema,
}).refine(data => {
  if (data.startTime && data.endTime) {
    return new Date(data.startTime) < new Date(data.endTime);
  }
  return true;
}, {
  message: "Start time must be before end time",
  path: ["endTime"],
});

// Booking filters schema
export const bookingFiltersSchema = z.object({
  spaceId: idSchema.optional(),
  userId: idSchema.optional(),
  status: createArraySchema(bookingStatusSchema).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  spaceType: createArraySchema(spaceTypeSchema).optional(),
  search: z.string().optional(),
});

// Membership schemas
export const createMembershipSchema = z.object({
  userId: idSchema,
  type: membershipTypeSchema,
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date").optional(),
  pricing: z.object({
    amount: z.number().nonnegative("Amount cannot be negative"),
    currency: z.string().length(3, "Currency must be 3 characters").default("USD"),
    billingCycle: z.enum(["monthly", "quarterly", "yearly"]).default("monthly"),
  }),
  benefits: z.object({
    includedHours: z.number().nonnegative("Included hours cannot be negative").optional(),
    discountPercentage: z.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%").optional(),
    accessLevels: createArraySchema(z.string().max(50)).optional(),
    priorityBooking: z.boolean().default(false),
    guestPasses: z.number().nonnegative("Guest passes cannot be negative").default(0),
  }),
  metadata: metadataSchema,
}).refine(data => {
  if (data.endDate) {
    return new Date(data.startDate) < new Date(data.endDate);
  }
  return true;
}, {
  message: "Start date must be before end date",
  path: ["endDate"],
});

// Update membership schema
export const updateMembershipSchema = createMembershipSchema.partial().omit({ userId: true });

// Response schemas
export const workspaceResponseSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string().optional(),
  slug: z.string(),
  website: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: addressSchema,
  coordinates: coordinatesSchema.optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  brandColor: z.string().optional(),
  status: workspaceStatusSchema,
  settings: z.any(),
  metadata: z.any().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  stats: z.object({
    totalSpaces: z.number(),
    totalMembers: z.number(),
    totalBookings: z.number(),
    occupancyRate: z.number(),
  }).optional(),
});

export const spaceResponseSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string().optional(),
  type: spaceTypeSchema,
  status: spaceStatusSchema,
  capacity: z.number(),
  area: z.number().optional(),
  pricing: z.any(),
  amenities: z.array(amenitySchema).optional(),
  images: z.array(z.string()).optional(),
  location: z.any().optional(),
  equipment: z.array(z.string()).optional(),
  accessibility: z.any().optional(),
  metadata: z.any().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  stats: z.object({
    bookingCount: z.number(),
    occupancyRate: z.number(),
    revenue: z.number(),
    rating: z.number().optional(),
  }).optional(),
});

export const bookingResponseSchema = z.object({
  id: idSchema,
  spaceId: idSchema,
  userId: idSchema,
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  status: bookingStatusSchema,
  attendees: z.number().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  isRecurring: z.boolean(),
  requirements: z.any().optional(),
  metadata: z.any().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  space: spaceResponseSchema.optional(),
  user: z.object({
    id: idSchema,
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }).optional(),
});

export default {
  workspaceStatusSchema,
  spaceTypeSchema,
  spaceStatusSchema,
  bookingStatusSchema,
  membershipTypeSchema,
  amenitySchema,
  createWorkspaceSchema,
  updateWorkspaceSchema,
  createSpaceSchema,
  updateSpaceSchema,
  spaceFiltersSchema,
  createBookingSchema,
  updateBookingSchema,
  bookingFiltersSchema,
  createMembershipSchema,
  updateMembershipSchema,
  workspaceResponseSchema,
  spaceResponseSchema,
  bookingResponseSchema,
};