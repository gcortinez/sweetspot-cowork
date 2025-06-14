import {
  Space,
  Booking,
  Amenity,
  COMMON_AMENITIES,
  SpaceType,
  BookingStatus,
} from "@/types/spaces";

// Mock space images
const MOCK_IMAGES = {
  hotDesk: [
    {
      id: "1",
      url: "/images/spaces/hot-desk-1.jpg",
      alt: "Modern hot desk workspace",
      isPrimary: true,
      order: 1,
    },
    {
      id: "2",
      url: "/images/spaces/hot-desk-2.jpg",
      alt: "Hot desk with monitor",
      isPrimary: false,
      order: 2,
    },
  ],
  privateOffice: [
    {
      id: "3",
      url: "/images/spaces/private-office-1.jpg",
      alt: "Private office space",
      isPrimary: true,
      order: 1,
    },
    {
      id: "4",
      url: "/images/spaces/private-office-2.jpg",
      alt: "Private office interior",
      isPrimary: false,
      order: 2,
    },
  ],
  meetingRoom: [
    {
      id: "5",
      url: "/images/spaces/meeting-room-1.jpg",
      alt: "Meeting room with table",
      isPrimary: true,
      order: 1,
    },
    {
      id: "6",
      url: "/images/spaces/meeting-room-2.jpg",
      alt: "Meeting room setup",
      isPrimary: false,
      order: 2,
    },
  ],
  conferenceRoom: [
    {
      id: "7",
      url: "/images/spaces/conference-room-1.jpg",
      alt: "Large conference room",
      isPrimary: true,
      order: 1,
    },
    {
      id: "8",
      url: "/images/spaces/conference-room-2.jpg",
      alt: "Conference room with projector",
      isPrimary: false,
      order: 2,
    },
  ],
  phoneBooth: [
    {
      id: "9",
      url: "/images/spaces/phone-booth-1.jpg",
      alt: "Private phone booth",
      isPrimary: true,
      order: 1,
    },
  ],
  eventSpace: [
    {
      id: "10",
      url: "/images/spaces/event-space-1.jpg",
      alt: "Large event space",
      isPrimary: true,
      order: 1,
    },
    {
      id: "11",
      url: "/images/spaces/event-space-2.jpg",
      alt: "Event space setup",
      isPrimary: false,
      order: 2,
    },
  ],
};

// Generate time slots for today and next 7 days
const generateTimeSlots = (spaceId: string, isPopular = false) => {
  const slots = [];
  const today = new Date();

  for (let day = 0; day < 7; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);

    // Generate hourly slots from 8 AM to 8 PM
    for (let hour = 8; hour < 20; hour++) {
      const start = new Date(date);
      start.setHours(hour, 0, 0, 0);

      const end = new Date(start);
      end.setHours(hour + 1, 0, 0, 0);

      // Simulate some bookings for popular spaces
      const isBooked = isPopular && Math.random() < 0.3;

      slots.push({
        start: start.toISOString(),
        end: end.toISOString(),
        available: !isBooked,
        price: 25 + Math.floor(Math.random() * 20), // $25-45 per hour
        bookingId: isBooked
          ? `booking-${Math.random().toString(36).substr(2, 9)}`
          : undefined,
      });
    }
  }

  return slots;
};

export const MOCK_SPACES: Space[] = [
  {
    id: "space-1",
    name: "Productivity Pod A1",
    description:
      "A quiet, focused workspace perfect for individual productivity. Features ergonomic seating and excellent natural light.",
    type: "hot_desk",
    status: "available",
    capacity: 1,
    area: 25,
    floor: 1,
    location: {
      building: "SweetSpot Downtown",
      address: "123 Innovation Drive",
      city: "San Francisco, CA",
      coordinates: { lat: 37.7749, lng: -122.4194 },
    },
    images: MOCK_IMAGES.hotDesk,
    amenities: [
      COMMON_AMENITIES.find((a) => a.id === "wifi")!,
      COMMON_AMENITIES.find((a) => a.id === "monitor")!,
      COMMON_AMENITIES.find((a) => a.id === "coffee")!,
      COMMON_AMENITIES.find((a) => a.id === "natural_light")!,
    ],
    pricing: {
      id: "pricing-1",
      name: "Standard Hot Desk",
      hourlyRate: 25,
      dailyRate: 180,
      monthlyRate: 3200,
      description: "Flexible pricing for hot desk usage",
    },
    availability: {
      isAvailable: true,
      timeSlots: generateTimeSlots("space-1", false),
    },
    rules: [
      "Keep noise to a minimum",
      "Clean up after use",
      "No food at the desk",
      "Maximum 8 hours per day",
    ],
    maxBookingDuration: 8,
    minBookingDuration: 1,
    advanceBookingDays: 14,
    cancellationPolicy: "Free cancellation up to 2 hours before booking",
    rating: { average: 4.5, count: 23 },
    tags: ["quiet", "productive", "natural-light"],
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-06-10T15:30:00Z",
  },
  {
    id: "space-2",
    name: "Executive Office Suite",
    description:
      "Premium private office with city views, perfect for executives and senior professionals who need privacy and prestige.",
    type: "private_office",
    status: "available",
    capacity: 2,
    area: 120,
    floor: 15,
    location: {
      building: "SweetSpot Downtown",
      address: "123 Innovation Drive",
      city: "San Francisco, CA",
      coordinates: { lat: 37.7749, lng: -122.4194 },
    },
    images: MOCK_IMAGES.privateOffice,
    amenities: [
      COMMON_AMENITIES.find((a) => a.id === "wifi")!,
      COMMON_AMENITIES.find((a) => a.id === "monitor")!,
      COMMON_AMENITIES.find((a) => a.id === "coffee")!,
      COMMON_AMENITIES.find((a) => a.id === "printing")!,
      COMMON_AMENITIES.find((a) => a.id === "ac")!,
      COMMON_AMENITIES.find((a) => a.id === "security")!,
    ],
    pricing: {
      id: "pricing-2",
      name: "Executive Office",
      hourlyRate: 85,
      dailyRate: 650,
      monthlyRate: 12000,
      description: "Premium private office with full amenities",
    },
    availability: {
      isAvailable: true,
      timeSlots: generateTimeSlots("space-2", true),
    },
    rules: [
      "Professional attire required",
      "No smoking",
      "Visitors must be registered",
      "Maximum 2 occupants",
    ],
    maxBookingDuration: 12,
    minBookingDuration: 2,
    advanceBookingDays: 30,
    cancellationPolicy: "Free cancellation up to 24 hours before booking",
    rating: { average: 4.8, count: 45 },
    tags: ["premium", "private", "city-view", "executive"],
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-06-12T11:20:00Z",
  },
  {
    id: "space-3",
    name: "Collaboration Hub",
    description:
      "Modern meeting room designed for team collaboration with state-of-the-art AV equipment and comfortable seating.",
    type: "meeting_room",
    status: "available",
    capacity: 8,
    area: 200,
    floor: 3,
    location: {
      building: "SweetSpot Downtown",
      address: "123 Innovation Drive",
      city: "San Francisco, CA",
      coordinates: { lat: 37.7749, lng: -122.4194 },
    },
    images: MOCK_IMAGES.meetingRoom,
    amenities: [
      COMMON_AMENITIES.find((a) => a.id === "wifi")!,
      COMMON_AMENITIES.find((a) => a.id === "projector")!,
      COMMON_AMENITIES.find((a) => a.id === "whiteboard")!,
      COMMON_AMENITIES.find((a) => a.id === "coffee")!,
      COMMON_AMENITIES.find((a) => a.id === "ac")!,
    ],
    pricing: {
      id: "pricing-3",
      name: "Meeting Room",
      hourlyRate: 45,
      description: "Perfect for team meetings and presentations",
    },
    availability: {
      isAvailable: true,
      timeSlots: generateTimeSlots("space-3", true),
    },
    rules: [
      "Book in advance",
      "End meetings on time",
      "Clean whiteboard after use",
      "No food or drinks near equipment",
    ],
    maxBookingDuration: 4,
    minBookingDuration: 1,
    advanceBookingDays: 21,
    cancellationPolicy: "Free cancellation up to 4 hours before booking",
    rating: { average: 4.6, count: 67 },
    tags: ["collaboration", "av-equipment", "whiteboard"],
    createdAt: "2024-01-20T14:00:00Z",
    updatedAt: "2024-06-11T16:45:00Z",
  },
  {
    id: "space-4",
    name: "Boardroom Elite",
    description:
      "Prestigious conference room for important meetings, presentations, and client calls. Features premium furniture and advanced technology.",
    type: "conference_room",
    status: "available",
    capacity: 16,
    area: 400,
    floor: 20,
    location: {
      building: "SweetSpot Downtown",
      address: "123 Innovation Drive",
      city: "San Francisco, CA",
      coordinates: { lat: 37.7749, lng: -122.4194 },
    },
    images: MOCK_IMAGES.conferenceRoom,
    amenities: [
      COMMON_AMENITIES.find((a) => a.id === "wifi")!,
      COMMON_AMENITIES.find((a) => a.id === "projector")!,
      COMMON_AMENITIES.find((a) => a.id === "whiteboard")!,
      COMMON_AMENITIES.find((a) => a.id === "coffee")!,
      COMMON_AMENITIES.find((a) => a.id === "ac")!,
      COMMON_AMENITIES.find((a) => a.id === "security")!,
    ],
    pricing: {
      id: "pricing-4",
      name: "Conference Room",
      hourlyRate: 120,
      description: "Premium conference room for important meetings",
    },
    availability: {
      isAvailable: true,
      timeSlots: generateTimeSlots("space-4", true),
    },
    rules: [
      "Professional use only",
      "Advanced booking required",
      "No food or drinks",
      "Respect time limits",
    ],
    maxBookingDuration: 6,
    minBookingDuration: 2,
    advanceBookingDays: 30,
    cancellationPolicy: "Free cancellation up to 24 hours before booking",
    rating: { average: 4.9, count: 34 },
    tags: ["premium", "boardroom", "presentations", "client-meetings"],
    createdAt: "2024-01-05T08:00:00Z",
    updatedAt: "2024-06-13T09:15:00Z",
  },
  {
    id: "space-5",
    name: "Privacy Pod",
    description:
      "Soundproof phone booth perfect for private calls, video conferences, and focused work requiring complete privacy.",
    type: "phone_booth",
    status: "available",
    capacity: 1,
    area: 15,
    floor: 2,
    location: {
      building: "SweetSpot Downtown",
      address: "123 Innovation Drive",
      city: "San Francisco, CA",
      coordinates: { lat: 37.7749, lng: -122.4194 },
    },
    images: MOCK_IMAGES.phoneBooth,
    amenities: [
      COMMON_AMENITIES.find((a) => a.id === "wifi")!,
      COMMON_AMENITIES.find((a) => a.id === "ac")!,
    ],
    pricing: {
      id: "pricing-5",
      name: "Phone Booth",
      hourlyRate: 15,
      description: "Private space for calls and video conferences",
    },
    availability: {
      isAvailable: true,
      timeSlots: generateTimeSlots("space-5", false),
    },
    rules: [
      "Maximum 2 hours per booking",
      "Keep voice at normal level",
      "No eating inside",
      "Wipe down surfaces after use",
    ],
    maxBookingDuration: 2,
    minBookingDuration: 0.5,
    advanceBookingDays: 7,
    cancellationPolicy: "Free cancellation up to 1 hour before booking",
    rating: { average: 4.3, count: 89 },
    tags: ["private", "soundproof", "calls", "video-conference"],
    createdAt: "2024-02-01T12:00:00Z",
    updatedAt: "2024-06-12T14:30:00Z",
  },
  {
    id: "space-6",
    name: "Innovation Theater",
    description:
      "Large event space perfect for workshops, presentations, networking events, and company gatherings. Features stage and flexible seating.",
    type: "event_space",
    status: "available",
    capacity: 100,
    area: 1200,
    floor: 1,
    location: {
      building: "SweetSpot Downtown",
      address: "123 Innovation Drive",
      city: "San Francisco, CA",
      coordinates: { lat: 37.7749, lng: -122.4194 },
    },
    images: MOCK_IMAGES.eventSpace,
    amenities: [
      COMMON_AMENITIES.find((a) => a.id === "wifi")!,
      COMMON_AMENITIES.find((a) => a.id === "projector")!,
      COMMON_AMENITIES.find((a) => a.id === "coffee")!,
      COMMON_AMENITIES.find((a) => a.id === "ac")!,
      COMMON_AMENITIES.find((a) => a.id === "security")!,
      COMMON_AMENITIES.find((a) => a.id === "parking")!,
    ],
    pricing: {
      id: "pricing-6",
      name: "Event Space",
      hourlyRate: 300,
      dailyRate: 2000,
      description: "Large event space for workshops and gatherings",
    },
    availability: {
      isAvailable: true,
      timeSlots: generateTimeSlots("space-6", false),
    },
    rules: [
      "Event planning required",
      "Setup and cleanup included",
      "Catering allowed with approval",
      "Security deposit required",
    ],
    maxBookingDuration: 12,
    minBookingDuration: 4,
    advanceBookingDays: 60,
    cancellationPolicy: "Free cancellation up to 7 days before booking",
    rating: { average: 4.7, count: 12 },
    tags: ["events", "workshops", "presentations", "networking"],
    createdAt: "2024-01-25T10:00:00Z",
    updatedAt: "2024-06-10T13:20:00Z",
  },
];

// Generate mock bookings
export const MOCK_BOOKINGS: Booking[] = [
  {
    id: "booking-1",
    spaceId: "space-1",
    space: MOCK_SPACES[0],
    userId: "user-1",
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
    attendees: 1,
    purpose: "Focus work session",
    status: "confirmed",
    totalPrice: 100,
    paymentStatus: "paid",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "booking-2",
    spaceId: "space-3",
    space: MOCK_SPACES[2],
    userId: "user-1",
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(), // Tomorrow + 2 hours
    attendees: 6,
    purpose: "Team standup meeting",
    specialRequests: "Need whiteboard setup",
    status: "confirmed",
    totalPrice: 90,
    paymentStatus: "paid",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "booking-3",
    spaceId: "space-4",
    space: MOCK_SPACES[3],
    userId: "user-2",
    startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
    endTime: new Date(Date.now() + 51 * 60 * 60 * 1000).toISOString(), // Day after tomorrow + 3 hours
    attendees: 12,
    purpose: "Client presentation",
    specialRequests: "Need projector and catering setup",
    status: "pending",
    totalPrice: 360,
    paymentStatus: "pending",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper functions for filtering and searching
export const filterSpaces = (spaces: Space[], filters: any) => {
  return spaces.filter((space) => {
    if (
      filters.spaceType &&
      filters.spaceType !== "all" &&
      space.type !== filters.spaceType
    ) {
      return false;
    }

    if (filters.minCapacity && space.capacity < filters.minCapacity) {
      return false;
    }

    if (filters.maxCapacity && space.capacity > filters.maxCapacity) {
      return false;
    }

    if (filters.amenities && filters.amenities.length > 0) {
      const spaceAmenityIds = space.amenities.map((a) => a.id);
      if (
        !filters.amenities.every((amenityId: string) =>
          spaceAmenityIds.includes(amenityId)
        )
      ) {
        return false;
      }
    }

    if (filters.query) {
      const query = filters.query.toLowerCase();
      const searchText = `${space.name} ${space.description} ${space.tags.join(
        " "
      )}`.toLowerCase();
      if (!searchText.includes(query)) {
        return false;
      }
    }

    return true;
  });
};

export const getSpaceById = (id: string): Space | undefined => {
  return MOCK_SPACES.find((space) => space.id === id);
};

export const getBookingsByUserId = (userId: string): Booking[] => {
  return MOCK_BOOKINGS.filter((booking) => booking.userId === userId);
};

export const getBookingsBySpaceId = (spaceId: string): Booking[] => {
  return MOCK_BOOKINGS.filter((booking) => booking.spaceId === spaceId);
};
