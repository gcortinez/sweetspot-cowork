export type SpaceType =
  | "hot_desk"
  | "private_office"
  | "meeting_room"
  | "conference_room"
  | "phone_booth"
  | "event_space";

export type SpaceStatus = "available" | "occupied" | "maintenance" | "reserved";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: "technology" | "comfort" | "accessibility" | "security" | "food";
}

export interface SpaceImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface PricingTier {
  id: string;
  name: string;
  hourlyRate: number;
  dailyRate?: number;
  monthlyRate?: number;
  description?: string;
}

export interface TimeSlot {
  start: string; // ISO string
  end: string; // ISO string
  available: boolean;
  price: number;
  bookingId?: string;
}

export interface Space {
  id: string;
  name: string;
  description: string;
  type: SpaceType;
  status: SpaceStatus;
  capacity: number;
  area: number; // in square feet
  floor: number;
  location: {
    building: string;
    address: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  images: SpaceImage[];
  amenities: Amenity[];
  pricing: PricingTier;
  availability: {
    isAvailable: boolean;
    nextAvailable?: string; // ISO string
    timeSlots: TimeSlot[];
  };
  rules: string[];
  maxBookingDuration: number; // in hours
  minBookingDuration: number; // in hours
  advanceBookingDays: number;
  cancellationPolicy: string;
  rating: {
    average: number;
    count: number;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BookingRequest {
  spaceId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  attendees: number;
  purpose?: string;
  specialRequests?: string;
}

export interface Booking {
  id: string;
  spaceId: string;
  space: Space;
  userId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  attendees: number;
  purpose?: string;
  specialRequests?: string;
  status: BookingStatus;
  totalPrice: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  checkInTime?: string; // ISO string
  checkOutTime?: string; // ISO string
  createdAt: string;
  updatedAt: string;
}

export interface SearchFilters {
  query?: string;
  spaceTypes?: SpaceType[];
  minCapacity?: number;
  maxCapacity?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  floor?: number[];
  availableFrom?: string; // ISO string
  availableTo?: string; // ISO string
  tags?: string[];
  rating?: number;
}

export interface SearchResult {
  spaces: Space[];
  total: number;
  page: number;
  limit: number;
  filters: SearchFilters;
}

export interface BookingCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  spaceId: string;
  spaceName: string;
  status: BookingStatus;
  isCurrentUser: boolean;
}

// Utility types for forms
export interface SpaceSearchForm {
  query: string;
  spaceType: SpaceType | "all";
  capacity: number;
  date: Date;
  startTime: string;
  endTime: string;
  amenities: string[];
}

export interface BookingForm {
  spaceId: string;
  date: Date;
  startTime: string;
  endTime: string;
  attendees: number;
  purpose: string;
  specialRequests: string;
}

// Constants
export const SPACE_TYPES: Record<
  SpaceType,
  { label: string; description: string; icon: string }
> = {
  hot_desk: {
    label: "Hot Desk",
    description: "Flexible workspace for daily use",
    icon: "laptop",
  },
  private_office: {
    label: "Private Office",
    description: "Dedicated private workspace",
    icon: "building",
  },
  meeting_room: {
    label: "Meeting Room",
    description: "Small meeting space for teams",
    icon: "users",
  },
  conference_room: {
    label: "Conference Room",
    description: "Large meeting space with AV equipment",
    icon: "presentation",
  },
  phone_booth: {
    label: "Phone Booth",
    description: "Private space for calls",
    icon: "phone",
  },
  event_space: {
    label: "Event Space",
    description: "Large space for events and workshops",
    icon: "calendar",
  },
};

export const COMMON_AMENITIES: Amenity[] = [
  { id: "wifi", name: "High-Speed WiFi", icon: "wifi", category: "technology" },
  {
    id: "monitor",
    name: "External Monitor",
    icon: "monitor",
    category: "technology",
  },
  {
    id: "projector",
    name: "Projector",
    icon: "projector",
    category: "technology",
  },
  {
    id: "whiteboard",
    name: "Whiteboard",
    icon: "edit",
    category: "technology",
  },
  { id: "coffee", name: "Coffee/Tea", icon: "coffee", category: "food" },
  {
    id: "printing",
    name: "Printing Access",
    icon: "printer",
    category: "technology",
  },
  { id: "parking", name: "Parking", icon: "car", category: "accessibility" },
  {
    id: "ac",
    name: "Air Conditioning",
    icon: "thermometer",
    category: "comfort",
  },
  {
    id: "natural_light",
    name: "Natural Light",
    icon: "sun",
    category: "comfort",
  },
  {
    id: "security",
    name: "24/7 Security",
    icon: "shield",
    category: "security",
  },
];
