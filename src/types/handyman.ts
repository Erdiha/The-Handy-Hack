export interface HandymanProfile {
  id: number;
  name: string;
  bio: string;
  hourlyRate: string;
  neighborhood: string;
  phone: string;
  email: string;
  isVerified: boolean;
  joinedDate: string;
  services: Array<{
    name: string;
    description: string;
    basePrice: string;
  }>;
  availability: {
    isAvailable: boolean;
    responseTime: string;
    workingHours: string;
    weekendAvailable: boolean;
  };
  stats: {
    rating: number;
    reviewCount: number;
    completedJobs: number;
    responseRate: string;
    onTimeRate: string;
  };
  reviews: Array<{
    id: number;
    customerName: string;
    rating: number;
    comment: string;
    date: string;
    serviceType: string;
  }>;
}
export interface Handyman {
  id: number;
  name: string;
  bio: string;
  hourlyRate: string;
  neighborhood: string;
  services: string[];
  isAvailable: boolean;
  distance: number;
  rating: number;
  reviewCount: number;
  responseTime: string;
}
