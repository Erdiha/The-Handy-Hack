
export interface Handyman {
  id: string;
  name: string;
  bio: string;
  services: string[];
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  distance: number;
  neighborhood: string;
  responseTime: string;
  isAvailable: boolean;
}

export interface HandymanProfile extends Handyman {
  email?: string;
  phone?: string;
  isVerified: boolean;
  joinedDate: string;
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