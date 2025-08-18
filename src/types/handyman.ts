export interface Handyman {
  id: string;
  name: string;
  bio: string;
  services: string[]; // ← Keep as strings for search page
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  distance: number;
  neighborhood: string;
  responseTime: string;
  isAvailable: boolean;
}

export interface HandymanProfile {
  // ← Remove "extends Handyman"
  id: string;
  name: string;
  bio: string;
  services: Service[]; // ← Objects for profile page
  hourlyRate: number;
  email?: string;
  phone?: string;
  isVerified: boolean;
  joinedDate: string;
  neighborhood: string;
  stats: {
    rating: number;
    reviewCount: number;
    completedJobs: number;
  };
  availability: {
    responseTime: string;
    workingHours: string;
    weekendAvailable: boolean;
  };
  reviews: Review[];
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  serviceType: string;
}

export interface Service {
  name: string;
  description: string;
  basePrice: number;
}
