CREATE TABLE "customer_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"neighborhood" text,
	"bio" text,
	"is_available" boolean DEFAULT true,
	"preferences" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversation_id_conversations_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "hidden_for_users" integer[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "handyman_profiles" ADD COLUMN "is_available" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "handyman_profiles" ADD COLUMN "availability_schedule" jsonb;--> statement-breakpoint
ALTER TABLE "handyman_profiles" ADD COLUMN "use_scheduled_availability" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "handyman_profiles" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "photos" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "accepted_by" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "hidden_from_customer" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "hidden_from_handyman" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "hidden_for_users" integer[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_available" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_conversation_id_type_unique" UNIQUE("user_id","conversation_id","type");