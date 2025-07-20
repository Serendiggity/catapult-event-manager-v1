CREATE TABLE "campaign_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"lead_group_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_campaigns" DROP CONSTRAINT "email_campaigns_lead_group_id_lead_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "email_campaigns" DROP CONSTRAINT "email_campaigns_event_id_events_id_fk";
--> statement-breakpoint
ALTER TABLE "email_drafts" DROP CONSTRAINT "email_drafts_campaign_id_email_campaigns_id_fk";
--> statement-breakpoint
ALTER TABLE "email_drafts" DROP CONSTRAINT "email_drafts_contact_id_contacts_id_fk";
--> statement-breakpoint
ALTER TABLE "contacts_to_lead_groups" DROP CONSTRAINT "contacts_to_lead_groups_contact_id_contacts_id_fk";
--> statement-breakpoint
ALTER TABLE "contacts_to_lead_groups" DROP CONSTRAINT "contacts_to_lead_groups_lead_group_id_lead_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "lead_groups" DROP CONSTRAINT "lead_groups_event_id_events_id_fk";
--> statement-breakpoint
ALTER TABLE "contacts_to_lead_groups" ADD CONSTRAINT "contacts_to_lead_groups_contact_id_lead_group_id_pk" PRIMARY KEY("contact_id","lead_group_id");--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "field_confidence_scores" jsonb;--> statement-breakpoint
ALTER TABLE "email_drafts" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "email_drafts" ADD COLUMN "ai_model" text DEFAULT 'gpt-4o-mini';--> statement-breakpoint
ALTER TABLE "email_drafts" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "email_drafts" ADD COLUMN "sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "lead_groups" ADD COLUMN "color" text DEFAULT '#3B82F6';--> statement-breakpoint
ALTER TABLE "lead_groups" ADD COLUMN "contact_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "campaign_groups" ADD CONSTRAINT "campaign_groups_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_groups" ADD CONSTRAINT "campaign_groups_lead_group_id_lead_groups_id_fk" FOREIGN KEY ("lead_group_id") REFERENCES "public"."lead_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts_to_lead_groups" ADD CONSTRAINT "contacts_to_lead_groups_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts_to_lead_groups" ADD CONSTRAINT "contacts_to_lead_groups_lead_group_id_lead_groups_id_fk" FOREIGN KEY ("lead_group_id") REFERENCES "public"."lead_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_groups" ADD CONSTRAINT "lead_groups_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" DROP COLUMN "lead_group_id";