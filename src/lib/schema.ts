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
  unique,
  json,
} from "drizzle-orm/pg-core";

// ================================
// CORE USER SYSTEM
// ================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"),
  isAvailable: boolean("is_available").default(true),

  // Stripe Integration
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeConnectAccountId: varchar("stripe_connect_account_id", { length: 255 }),
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(
    false
  ),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const neighborhoods = pgTable("neighborhoods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  city: text("city").notNull(),
  state: text("state").notNull(),
});

// ================================
// USER PROFILES
// ================================

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

export const customerProfiles = pgTable("customer_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  neighborhood: text("neighborhood"),
  bio: text("bio"),
  isAvailable: boolean("is_available").default(true),
  preferences: json("preferences"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ================================
// JOBS SYSTEM
// ================================

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

  // Job Assignment
  acceptedBy: integer("accepted_by").references(() => users.id),
  postedBy: integer("posted_by")
    .references(() => users.id)
    .notNull(),

  // Job Status
  status: text("status").notNull().default("open"),
  hiddenFromCustomer: boolean("hidden_from_customer").default(false),
  hiddenFromHandyman: boolean("hidden_from_handyman").default(false),

  // Payment Integration
  requiresPayment: boolean("requires_payment").default(true),
  paymentStatus: varchar("payment_status", { length: 50 }).default("unpaid"),

  // Timestamps
  acceptedAt: timestamp("accepted_at"),
  completedAt: timestamp("completed_at"),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobPhotos = pgTable("job_photos", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id")
    .notNull()
    .references(() => jobs.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// ================================
// PAYMENT SYSTEM
// ================================

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id")
    .references(() => jobs.id)
    .notNull(),
  customerId: integer("customer_id")
    .references(() => users.id)
    .notNull(),
  handymanId: integer("handyman_id")
    .references(() => users.id)
    .notNull(),

  // Stripe Integration
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeTransferId: varchar("stripe_transfer_id", { length: 255 }),

  // Amounts (in cents)
  jobAmount: integer("job_amount").notNull(),
  customerFee: integer("customer_fee").notNull(), // 8% fee
  handymanFee: integer("handyman_fee").notNull(), // 5% fee
  totalCharged: integer("total_charged").notNull(), // jobAmount + customerFee
  handymanPayout: integer("handyman_payout").notNull(), // jobAmount - handymanFee

  // Payment Status: pending, paid, escrowed, released, refunded, disputed
  status: varchar("status", { length: 50 }).notNull().default("pending"),

  // Timestamps
  paidAt: timestamp("paid_at"),
  releasedAt: timestamp("released_at"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ================================
// MESSAGING SYSTEM
// ================================

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id),
  participant1: integer("participant_1")
    .references(() => users.id)
    .notNull(),
  participant2: integer("participant_2")
    .references(() => users.id)
    .notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  hiddenForUsers: integer("hidden_for_users").array().default([]),
  serviceContext: text("service_context"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .references(() => conversations.id, { onDelete: "cascade" })
    .notNull(),
  senderId: integer("sender_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  hiddenForUsers: integer("hidden_for_users").array().default([]),
});

// ================================
// SERVICES & REVIEWS
// ================================

export const handymanServices = pgTable("handyman_services", {
  id: serial("id").primaryKey(),
  handymanId: integer("handyman_id")
    .notNull()
    .references(() => users.id),
  serviceName: varchar("service_name", { length: 100 }).notNull(),
  description: text("description"),
  basePrice: decimal("base_price", { precision: 8, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => users.id),
  handymanId: integer("handyman_id")
    .notNull()
    .references(() => users.id),
  jobId: integer("job_id").references(() => jobs.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  serviceType: varchar("service_type", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ================================
// NOTIFICATIONS
// ================================

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    conversationId: integer("conversation_id").references(
      () => conversations.id,
      { onDelete: "cascade" }
    ),
    jobId: integer("job_id").references(() => jobs.id),
    actionUrl: varchar("action_url", { length: 500 }),
    priority: varchar("priority", { length: 20 }).notNull().default("normal"),
    metadata: jsonb("metadata"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => ({
    uniqueConversationNotification: unique().on(
      table.userId,
      table.conversationId,
      table.type
    ),
  })
);

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

// ================================
// FUTURE FEATURES (Currently Unused)
// ================================

export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id")
    .notNull()
    .references(() => jobs.id),
  handymanId: integer("handyman_id")
    .notNull()
    .references(() => users.id),
  message: text("message"),
  proposedPrice: decimal("proposed_price", { precision: 8, scale: 2 }),
  estimatedDuration: varchar("estimated_duration", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
});

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
  completedAt: timestamp("completed_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
// Add these new tables to your existing schema.ts file

// ================================
// DISPUTES & REFUNDS SYSTEM
// ================================

export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id")
    .references(() => jobs.id)
    .notNull(),
  paymentId: integer("payment_id")
    .references(() => payments.id)
    .notNull(),

  // Who filed the dispute
  filedBy: integer("filed_by")
    .references(() => users.id)
    .notNull(),
  filedAgainst: integer("filed_against")
    .references(() => users.id)
    .notNull(),

  // Dispute details
  disputeType: text("dispute_type").notNull(), // "quality", "scope", "damage", "no_payment", "cancellation"
  title: text("title").notNull(),
  description: text("description").notNull(),
  requestedAmount: integer("requested_amount"), // Amount being disputed (in cents)

  // Dispute status
  status: text("status").notNull().default("open"), // "open", "under_review", "resolved", "closed"
  priority: text("priority").notNull().default("normal"), // "low", "normal", "high", "urgent"

  // Resolution
  resolution: text("resolution"), // "favor_customer", "favor_handyman", "partial_refund", "no_action"
  resolutionAmount: integer("resolution_amount"), // Final amount awarded (in cents)
  resolutionNote: text("resolution_note"),
  resolvedBy: integer("resolved_by").references(() => users.id), // Admin who resolved
  resolvedAt: timestamp("resolved_at"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const disputeEvidence = pgTable("dispute_evidence", {
  id: serial("id").primaryKey(),
  disputeId: integer("dispute_id")
    .references(() => disputes.id, { onDelete: "cascade" })
    .notNull(),
  submittedBy: integer("submitted_by")
    .references(() => users.id)
    .notNull(),

  // Evidence details
  evidenceType: text("evidence_type").notNull(), // "photo", "document", "message", "description"
  title: text("title").notNull(),
  description: text("description"),
  filePath: text("file_path"), // For uploaded files
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),

  // Evidence metadata
  isPublic: boolean("is_public").default(true), // Whether other party can see this
  isVerified: boolean("is_verified").default(false), // Admin verified authenticity

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const refunds = pgTable("refunds", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id")
    .references(() => payments.id)
    .notNull(),
  disputeId: integer("dispute_id").references(() => disputes.id), // If refund from dispute

  // Refund details
  requestedBy: integer("requested_by")
    .references(() => users.id)
    .notNull(),
  refundType: text("refund_type").notNull(), // "full", "partial", "cancellation", "dispute_resolution"
  refundReason: text("refund_reason").notNull(),

  // Amounts (in cents)
  originalAmount: integer("original_amount").notNull(),
  requestedAmount: integer("requested_amount").notNull(),
  approvedAmount: integer("approved_amount"),
  processingFee: integer("processing_fee").default(0),

  // Refund status
  status: text("status").notNull().default("pending"), // "pending", "approved", "processing", "completed", "rejected"
  approvedBy: integer("approved_by").references(() => users.id),

  // Stripe integration
  stripeRefundId: text("stripe_refund_id"),

  // Timestamps
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
});

export const disputeMessages = pgTable("dispute_messages", {
  id: serial("id").primaryKey(),
  disputeId: integer("dispute_id")
    .references(() => disputes.id, { onDelete: "cascade" })
    .notNull(),
  senderId: integer("sender_id")
    .references(() => users.id)
    .notNull(),

  // Message content
  message: text("message").notNull(),
  messageType: text("message_type").default("comment"), // "comment", "system", "resolution"
  isInternal: boolean("is_internal").default(false), // Only admins can see

  // Attachments
  attachments: jsonb("attachments"), // Array of file references

  createdAt: timestamp("created_at").defaultNow().notNull(),
  readBy: integer("read_by").array().default([]), // User IDs who have read this
});

// ================================
// UPDATE EXISTING PAYMENTS STATUS
// ================================

// Update your existing payments table status to include these new states:
// status: "pending" | "escrowed" | "released" | "disputed" | "refunding" | "refunded" | "failed"
