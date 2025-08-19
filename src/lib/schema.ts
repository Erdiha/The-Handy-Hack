import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  decimal,
} from "drizzle-orm/pg-core";

// ADD THESE TWO TABLES to your existing schema.ts file
export const handymanProfiles = pgTable("handyman_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  bio: text("bio"),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  isVerified: boolean("is_verified").default(false),
  isAvailable: boolean("is_available").default(true),
  availabilitySchedule: jsonb("availability_schedule"),
  useScheduledAvailability: boolean("use_scheduled_availability").default(
    false
  ),
  neighborhoodId: integer("neighborhood_id").references(() => neighborhoods.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // 'message', 'job_response', 'booking', 'system'
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  jobId: integer("job_id").references(() => jobs.id),
  actionUrl: varchar("action_url", { length: 500 }),
  priority: varchar("priority", { length: 20 }).notNull().default("normal"), // 'low', 'normal', 'high', 'urgent'
  metadata: jsonb("metadata"), // Additional data as JSON
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});
// Add these tables to your existing schema.ts file

// Reviews system
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => users.id),
  handymanId: integer("handyman_id")
    .notNull()
    .references(() => users.id),
  jobId: integer("job_id").references(() => jobs.id), // Optional - can review without specific job
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  serviceType: varchar("service_type", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Services that handymen offer
export const handymanServices = pgTable("handyman_services", {
  id: serial("id").primaryKey(),
  handymanId: integer("handyman_id")
    .notNull()
    .references(() => users.id),
  serviceName: varchar("service_name", { length: 100 }).notNull(),
  description: text("description"),
  basePrice: decimal("base_price", { precision: 8, scale: 2 }), // Optional base price
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Job photos/attachments
export const jobPhotos = pgTable("job_photos", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id")
    .notNull()
    .references(() => jobs.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: integer("file_size"), // in bytes
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Track job applications/responses
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id")
    .notNull()
    .references(() => jobs.id),
  handymanId: integer("handyman_id")
    .notNull()
    .references(() => users.id),
  message: text("message"), // Their response message
  proposedPrice: decimal("proposed_price", { precision: 8, scale: 2 }),
  estimatedDuration: varchar("estimated_duration", { length: 100 }), // "2-3 hours"
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, accepted, rejected
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
});

// Track actual bookings/hires
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id")
    .notNull()
    .references(() => jobs.id),
  customerId: integer("customer_id")
    .notNull()
    .references(() => users.id),
  handymanId: integer("handyman_id")
    .notNull()
    .references(() => users.id),
  applicationId: integer("application_id").references(() => jobApplications.id),
  agreedPrice: decimal("agreed_price", { precision: 8, scale: 2 }).notNull(),
  scheduledDate: timestamp("scheduled_date"),
  status: varchar("status", { length: 50 }).notNull().default("confirmed"),
  // confirmed, in_progress, completed, cancelled, disputed
  completedAt: timestamp("completed_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  browser: boolean("browser").notNull().default(true),
  sound: boolean("sound").notNull().default(true),
  email: boolean("email").notNull().default(true),
  sms: boolean("sms").notNull().default(false),
  quietHoursEnabled: boolean("quiet_hours_enabled").notNull().default(false),
  quietHoursStart: varchar("quiet_hours_start", { length: 5 }).default("22:00"),
  quietHoursEnd: varchar("quiet_hours_end", { length: 5 }).default("08:00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const neighborhoods = pgTable("neighborhoods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  city: text("city").notNull(),
  state: text("state").notNull(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  urgency: text("urgency").notNull(),
  budget: text("budget").notNull(),
  budgetAmount: decimal("budget_amount", { precision: 8, scale: 2 }),
  location: text("location").notNull(),
  photos: text("photos"),
  acceptedBy: integer("accepted_by").references(() => users.id),
  postedBy: integer("posted_by")
    .references(() => users.id)
    .notNull(),
  hiddenFromCustomer: boolean("hidden_from_customer").default(false),
  hiddenFromHandyman: boolean("hidden_from_handyman").default(false),
  status: text("status").notNull().default("open"),
  acceptedAt: timestamp("accepted_at"),
  completedAt: timestamp("completed_at"),
  archivedAt: timestamp("archived_at"), // ADD THIS LINE
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ADD THESE - New messaging tables
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id), // Optional - for job-related conversations
  participant1: integer("participant_1")
    .references(() => users.id)
    .notNull(),
  participant2: integer("participant_2")
    .references(() => users.id)
    .notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .references(() => conversations.id)
    .notNull(),
  senderId: integer("sender_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
