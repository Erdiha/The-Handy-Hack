import { pgTable, serial, text, timestamp, boolean, decimal, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  password: text('password').notNull(), // ADD THIS
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