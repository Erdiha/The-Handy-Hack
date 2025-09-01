// types/notifications.ts - CREATE THIS NEW FILE

export interface NotificationData {
  id: string;
  type: "message" | "job_response" | "booking" | "system" | "error" | "success";
  title: string;
  body: string;
  userId: string;
  conversationId?: string;
  jobId?: string;
  actionUrl?: string;
  priority: "low" | "normal" | "high" | "urgent";
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  browser: boolean;
  sound: boolean;
  email: boolean;
  sms: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
  };
}
