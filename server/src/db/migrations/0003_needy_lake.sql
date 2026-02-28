CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"ref_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "gateway_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "gateway_status" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_link" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "pix_copy_paste" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "pix_qr_code" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "invoice_url" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_expenses_tenant_id" ON "expenses" USING btree ("tenant_id");