// /src/lib/services.ts
// Centralized services configuration for TheHandyHack platform

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  services: Service[];
}

export interface Service {
  name: string;
  description?: string;
  requiresVerification?: boolean;
  suggestedRate?: string;
}

// Flat list for search dropdown and general use
export const allServices = [
  "All Services",

  // Traditional Home Services
  "Plumbing",
  "Electrical",
  "Painting",
  "Carpentry",
  "Appliance Repair",
  "Furniture Assembly",
  "Home Cleaning",
  "Landscaping",
  "Tile Work",
  "Drywall Repair",
  "General Repair",

  // NEW: Pet Care Services
  "Dog Walking",
  "Pet Sitting",
  "Cat Care",
  "Pet Grooming",
  "Pet Transportation",

  // NEW: Home & Property Care
  "House Sitting",
  "Plant Care",
  "Property Maintenance",
  "Lawn Care",
  "Snow Removal",

  // NEW: Personal & Elder Care
  "Elderly Companionship",
  "Senior Care",
  "Medication Reminders",
  "Grocery Shopping",
  "Errand Running",
  "Personal Assistant",

  // NEW: Specialized Services
  "Moving Help",
  "Organization Services",
  "Tech Support",
  "Tutoring",
  "Event Setup",

  // Fallback
  "Other",
];

// Categorized services for post-job page with enhanced metadata
export const serviceCategories: ServiceCategory[] = [
  {
    id: "home-repair",
    name: "Home Repair & Maintenance",
    icon: "🔧",
    color: "blue",
    services: [
      {
        name: "Plumbing",
        description: "Pipes, faucets, water heater repairs",
        suggestedRate: "$75/hr",
      },
      {
        name: "Electrical",
        description: "Outlets, switches, lighting installation",
        suggestedRate: "$85/hr",
      },
      {
        name: "Painting",
        description: "Interior/exterior painting, touch-ups",
        suggestedRate: "$50/hr",
      },
      {
        name: "Carpentry",
        description: "Custom builds, repairs, installations",
        suggestedRate: "$70/hr",
      },
      {
        name: "Appliance Repair",
        description: "Fix washers, dryers, refrigerators",
        suggestedRate: "$80/hr",
      },
      {
        name: "Furniture Assembly",
        description: "IKEA, moving furniture, mounting",
        suggestedRate: "$45/hr",
      },
      {
        name: "Drywall Repair",
        description: "Holes, cracks, texture matching",
        suggestedRate: "$60/hr",
      },
      {
        name: "Tile Work",
        description: "Bathroom, kitchen, floor installations",
        suggestedRate: "$65/hr",
      },
      {
        name: "General Repair",
        description: "Various household fixes",
        suggestedRate: "$55/hr",
      },
    ],
  },
  {
    id: "outdoor-property",
    name: "Outdoor & Property",
    icon: "🌱",
    color: "green",
    services: [
      {
        name: "Landscaping",
        description: "Garden design, planting, maintenance",
        suggestedRate: "$50/hr",
      },
      {
        name: "Lawn Care",
        description: "Mowing, edging, fertilizing",
        suggestedRate: "$40/hr",
      },
      {
        name: "Snow Removal",
        description: "Driveway, walkway snow clearing",
        suggestedRate: "$45/hr",
      },
      {
        name: "Property Maintenance",
        description: "General upkeep, seasonal tasks",
        suggestedRate: "$50/hr",
      },
      {
        name: "Plant Care",
        description: "Watering, pruning, plant sitting",
        suggestedRate: "$30/hr",
      },
    ],
  },
  {
    id: "pet-care",
    name: "Pet Care",
    icon: "🐕",
    color: "orange",
    services: [
      {
        name: "Dog Walking",
        description: "Daily walks, exercise, socialization",
        suggestedRate: "$25/walk",
      },
      {
        name: "Pet Sitting",
        description: "In-home pet care while you're away",
        suggestedRate: "$40/day",
      },
      {
        name: "Cat Care",
        description: "Feeding, litter, companionship",
        suggestedRate: "$30/visit",
      },
      {
        name: "Pet Grooming",
        description: "Bathing, brushing, nail trimming",
        suggestedRate: "$50/session",
      },
      {
        name: "Pet Transportation",
        description: "Vet visits, grooming appointments",
        suggestedRate: "$35/trip",
      },
    ],
  },
  {
    id: "home-personal",
    name: "Home & Personal Care",
    icon: "🏠",
    color: "purple",
    services: [
      {
        name: "House Sitting",
        description: "Home security, mail, plants while away",
        requiresVerification: true,
        suggestedRate: "$50/day",
      },
      {
        name: "Home Cleaning",
        description: "Deep cleaning, regular maintenance",
        suggestedRate: "$40/hr",
      },
      {
        name: "Elderly Companionship",
        description: "Social visits, light assistance",
        requiresVerification: true,
        suggestedRate: "$35/hr",
      },
      {
        name: "Senior Care",
        description: "Personal care, mobility assistance",
        requiresVerification: true,
        suggestedRate: "$45/hr",
      },
      {
        name: "Medication Reminders",
        description: "Ensure proper medication timing",
        requiresVerification: true,
        suggestedRate: "$30/visit",
      },
    ],
  },
  {
    id: "personal-services",
    name: "Personal Services",
    icon: "🛍️",
    color: "pink",
    services: [
      {
        name: "Grocery Shopping",
        description: "Shopping, delivery, meal prep help",
        suggestedRate: "$25/hr",
      },
      {
        name: "Errand Running",
        description: "Post office, pharmacy, appointments",
        suggestedRate: "$30/hr",
      },
      {
        name: "Personal Assistant",
        description: "Scheduling, organization, admin tasks",
        suggestedRate: "$35/hr",
      },
      {
        name: "Moving Help",
        description: "Packing, loading, furniture moving",
        suggestedRate: "$45/hr",
      },
      {
        name: "Organization Services",
        description: "Decluttering, storage solutions",
        suggestedRate: "$40/hr",
      },
    ],
  },
  {
    id: "specialized",
    name: "Specialized Services",
    icon: "💡",
    color: "gray",
    services: [
      {
        name: "Tech Support",
        description: "Computer help, device setup",
        suggestedRate: "$60/hr",
      },
      {
        name: "Tutoring",
        description: "Academic support, skill teaching",
        requiresVerification: true,
        suggestedRate: "$50/hr",
      },
      {
        name: "Event Setup",
        description: "Party setup, decorations, coordination",
        suggestedRate: "$40/hr",
      },
      {
        name: "Other",
        description: "Describe your unique service need",
        suggestedRate: "$40/hr",
      },
    ],
  },
];

// Helper functions
export function getServiceByName(serviceName: string): Service | undefined {
  for (const category of serviceCategories) {
    const service = category.services.find((s) => s.name === serviceName);
    if (service) return service;
  }
  return undefined;
}

export function getServiceCategory(
  serviceName: string
): ServiceCategory | undefined {
  return serviceCategories.find((category) =>
    category.services.some((service) => service.name === serviceName)
  );
}

export function getServicesRequiringVerification(): string[] {
  const verificationServices: string[] = [];
  serviceCategories.forEach((category) => {
    category.services.forEach((service) => {
      if (service.requiresVerification) {
        verificationServices.push(service.name);
      }
    });
  });
  return verificationServices;
}

// Export legacy format for backward compatibility
export const services = allServices;
