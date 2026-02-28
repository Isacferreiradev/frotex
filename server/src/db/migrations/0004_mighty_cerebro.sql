ALTER TABLE "tenants" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "asaas_api_key" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "asaas_wallet_id" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "stripe_secret_key" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "payment_provider" text DEFAULT 'none';