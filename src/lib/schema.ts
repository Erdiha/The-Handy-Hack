import { pgTable, serial, text, timestamp, boolean, decimal, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  password: text('password').notNull(),
  role: text('role').notNull().default('customer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const neighborhoods = pgTable('neighborhoods', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  city: text('city').notNull(),
  state: text('state').notNull(),
});

export const handymanProfiles = pgTable('handyman_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  bio: text('bio'),
  hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }),
  isVerified: boolean('is_verified').default(false),
  neighborhoodId: integer('neighborhood_id').references(() => neighborhoods.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  urgency: text('urgency').notNull(), // 'asap', 'week', 'flexible', 'emergency'
  budget: text('budget').notNull(), // 'hour', 'fixed', 'quote'
  budgetAmount: decimal('budget_amount', { precision: 8, scale: 2 }),
  location: text('location').notNull(),
  postedBy: integer('posted_by').references(() => users.id).notNull(),
  status: text('status').notNull().default('open'), // 'open', 'in_progress', 'completed', 'cancelled'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ADD THESE - New messaging tables
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').references(() => jobs.id), // Optional - for job-related conversations
  participant1: integer('participant_1').references(() => users.id).notNull(),
  participant2: integer('participant_2').references(() => users.id).notNull(),
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').references(() => conversations.id).notNull(),
  senderId: integer('sender_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});