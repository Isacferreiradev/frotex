CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"document_type" text DEFAULT 'CPF' NOT NULL,
	"document_number" text NOT NULL,
	"phone_number" text NOT NULL,
	"email" text,
	"address_street" text,
	"address_number" text,
	"address_complement" text,
	"address_neighborhood" text,
	"address_city" text,
	"address_state" text,
	"address_zip_code" text,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"maintenance_date" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text NOT NULL,
	"cost" numeric(10, 2) DEFAULT '0.00',
	"performed_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"rental_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" timestamp with time zone DEFAULT now() NOT NULL,
	"payment_method" text NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"notes" text,
	"received_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rentals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"rental_code" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date_expected" timestamp with time zone NOT NULL,
	"end_date_actual" timestamp with time zone,
	"daily_rate_agreed" numeric(10, 2) NOT NULL,
	"total_days_expected" integer NOT NULL,
	"total_days_actual" integer,
	"total_amount_expected" numeric(10, 2) NOT NULL,
	"total_amount_actual" numeric(10, 2),
	"overdue_fine_amount" numeric(10, 2) DEFAULT '0.00',
	"status" text DEFAULT 'active' NOT NULL,
	"contract_pdf_url" text,
	"checkout_by" uuid,
	"checkin_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cnpj" text,
	"contact_email" text,
	"phone_number" text,
	"address" text,
	"settings" jsonb DEFAULT '{"currency":"BRL","locale":"pt-BR","contractTemplateId":null,"whatsappApiKey":null,"overdueFinePercentage":10}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_name_unique" UNIQUE("name"),
	CONSTRAINT "tenants_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "tool_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"model" text,
	"serial_number" text,
	"asset_tag" text,
	"daily_rate" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"last_maintenance_at" timestamp with time zone,
	"next_maintenance_due_hours" numeric(10, 2),
	"current_usage_hours" numeric(10, 2) DEFAULT '0.00',
	"image_url" text,
	"notes" text,
	"acquisition_date" date,
	"acquisition_cost" numeric(10, 2) DEFAULT '0.00',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"role" text DEFAULT 'employee' NOT NULL,
	"avatar_url" text,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_checkout_by_users_id_fk" FOREIGN KEY ("checkout_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_checkin_by_users_id_fk" FOREIGN KEY ("checkin_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_categories" ADD CONSTRAINT "tool_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_category_id_tool_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tool_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_customers_tenant_id" ON "customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_customers_document_number" ON "customers" USING btree ("document_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_customers_tenant_doc" ON "customers" USING btree ("tenant_id","document_type","document_number");--> statement-breakpoint
CREATE INDEX "idx_maintenance_logs_tenant_id" ON "maintenance_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_maintenance_logs_tool_id" ON "maintenance_logs" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "idx_payments_tenant_id" ON "payments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_payments_rental_id" ON "payments" USING btree ("rental_id");--> statement-breakpoint
CREATE INDEX "idx_rentals_tenant_id" ON "rentals" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_rentals_tool_id" ON "rentals" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "idx_rentals_customer_id" ON "rentals" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_rentals_status" ON "rentals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_rentals_end_date_expected" ON "rentals" USING btree ("end_date_expected");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_rentals_tenant_code" ON "rentals" USING btree ("tenant_id","rental_code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tool_categories_tenant_name" ON "tool_categories" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "idx_tools_tenant_id" ON "tools" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_tools_category_id" ON "tools" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_tools_status" ON "tools" USING btree ("status");