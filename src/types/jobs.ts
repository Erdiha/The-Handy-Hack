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
  customerId: string; // ADD THIS - real customer ID
}