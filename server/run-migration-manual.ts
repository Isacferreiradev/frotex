import pg from 'pg';

async function run() {
    const DATABASE_URL = 'postgresql://aluga_admin:AlugaFacil@2026@localhost:5432/alugafacil';
    const pool = new pg.Pool({
        connectionString: DATABASE_URL,
    });

    try {
        console.log('Connecting to database...');
        const client = await pool.connect();
        console.log('Connected!');

        const statements = [
            `CREATE TABLE IF NOT EXISTS "client_communications" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "tenant_id" uuid NOT NULL,
                "customer_id" uuid NOT NULL,
                "user_id" uuid,
                "type" text NOT NULL,
                "message" text NOT NULL,
                "created_at" timestamp with time zone DEFAULT now() NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS "quotes" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "tenant_id" uuid NOT NULL,
                "tool_id" uuid NOT NULL,
                "customer_id" uuid NOT NULL,
                "status" text DEFAULT 'draft' NOT NULL,
                "start_date" timestamp with time zone NOT NULL,
                "end_date_expected" timestamp with time zone NOT NULL,
                "total_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
                "created_at" timestamp with time zone DEFAULT now() NOT NULL,
                "updated_at" timestamp with time zone DEFAULT now() NOT NULL
            )`,
            `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "tags" text[]`,
            `ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "maintenance_interval_days" integer`,
            `ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "maintenance_interval_rentals" integer`,
            `ALTER TABLE "client_communications" DROP CONSTRAINT IF EXISTS "client_communications_tenant_id_tenants_id_fk"`,
            `ALTER TABLE "client_communications" ADD CONSTRAINT "client_communications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action`,
            `ALTER TABLE "client_communications" DROP CONSTRAINT IF EXISTS "client_communications_customer_id_customers_id_fk"`,
            `ALTER TABLE "client_communications" ADD CONSTRAINT "client_communications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action`,
            `ALTER TABLE "client_communications" DROP CONSTRAINT IF EXISTS "client_communications_user_id_users_id_fk"`,
            `ALTER TABLE "client_communications" ADD CONSTRAINT "client_communications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action`,
            `ALTER TABLE "quotes" DROP CONSTRAINT IF EXISTS "quotes_tenant_id_tenants_id_fk"`,
            `ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action`,
            `ALTER TABLE "quotes" DROP CONSTRAINT IF EXISTS "quotes_tool_id_tools_id_fk"`,
            `ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action`,
            `ALTER TABLE "quotes" DROP CONSTRAINT IF EXISTS "quotes_customer_id_customers_id_fk"`,
            `ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action`
        ];

        console.log(`Executing ${statements.length} statements...`);
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i].trim();
            if (!stmt) continue;
            console.log(`Executing statement ${i + 1}/${statements.length}...`);
            try {
                await client.query(stmt);
            } catch (stmtErr: any) {
                console.warn(`Statement ${i + 1} failed:`, stmtErr.message);
            }
        }

        console.log('✅ Resilience check/migration complete!');
        client.release();
    } catch (err) {
        console.error('❌ Critical failure:', err);
    } finally {
        await pool.end();
    }
}

run();
