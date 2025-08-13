export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'handyman';
}

export interface UserProfile {
  hasCompletedOnboarding: boolean;
  neighborhood?: string;
  phone?: string;
  bio?: string;
  services?: string[];
  hourlyRate?: string;
}

export interface UpcomingJob {
  id: number;
  customer: string;
  service: string;
  time: string;
  address: string;
  phone: string;
  payment: string;
  status: 'confirmed' | 'pending' | 'in-progress';
}

export interface RecentActivity {
  action: string;
  customer?: string;
  handyman?: string;
  time: string;
  amount?: string;
  rating?: number;
}

export interface CurrentBooking {
  id: number;
  handyman: string;
  service: string;
  date: string;
  status: 'confirmed' | 'pending' | 'completed';
  address: string;
  price: string;
}

export interface FavoriteHandyman {
  id: number;
  name: string;
  service: string;
  rating: number;
  lastUsed: string;
  available: boolean;
}