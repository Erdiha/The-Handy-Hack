export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}
export interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    role: 'customer' | 'handyman';
  }[];
  lastMessage: Message;
  isActive: boolean;
  jobContext?: JobContext; // ADD THIS - make it optional
}
export interface JobContext {
  jobId: string;
  customer: string;
  jobTitle: string;
  category?: string;
}