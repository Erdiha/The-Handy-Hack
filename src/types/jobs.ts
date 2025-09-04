export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget: string;
  budgetAmount?: string;
  urgency: string;
  postedBy: string;
  postedDate: string;
  responses: number;
  photos?: string[];
  customerId: string;

  acceptedBy?: string; // Handyman who accepted the job
  status: string; // Job status (open, accepted, completed)
  paymentStatus: string; // Payment status (unpaid, paid, released)
}
