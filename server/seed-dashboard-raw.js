const { Pool } = require('pg');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const { subDays, addDays, startOfDay, endOfDay, subMonths } = require('date-fns');

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function seed() {
    const client = await pool.connect();
    try {
        console.log('🚀 Generating ULTRA-ELITE Dashboard Mock Data...');

        // 1. Get or Create Tenant
        console.log('--- Tenant Setup ---');
        const tenantRes = await client.query("SELECT id FROM tenants WHERE name = 'Locadora Elite Pro'");
        let tenantId;
        if (tenantRes.rows.length === 0) {
            const newTenant = await client.query(`
                INSERT INTO tenants (id, name, cnpj, contact_email, phone_number, address, plan)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `, [uuidv4(), 'Locadora Elite Pro', '45.123.789/0001-55', 'diretoria@locadoraelite.com.br', '(11) 98888-7777', 'Av. das Nações, 5000 - São Paulo, SP', 'pro']);
            tenantId = newTenant.rows[0].id;
        } else {
            tenantId = tenantRes.rows[0].id;
        }

        // --- Cleanup existing data for a clean mock --
        console.log('--- Cleaning up old mock data ---');
        await client.query("DELETE FROM payments WHERE tenant_id = $1", [tenantId]);
        await client.query("DELETE FROM rentals WHERE tenant_id = $1", [tenantId]);
        await client.query("DELETE FROM client_communications WHERE tenant_id = $1", [tenantId]);
        await client.query("DELETE FROM tools WHERE tenant_id = $1", [tenantId]);
        await client.query("DELETE FROM customers WHERE tenant_id = $1", [tenantId]);
        // Note: tool_categories can stay as they are unique on name, but we can update icons.

        // 2. Create User
        console.log('--- User Setup ---');
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash('elite123', 12);
        await client.query(`
            INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, has_onboarded, is_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (email) DO NOTHING
        `, [uuidv4(), tenantId, 'elite@frotex.com.br', passwordHash, 'Diretoria Elite', 'owner', true, true]);

        // 3. Categories
        console.log('--- Categories Setup ---');
        const categoriesData = [
            { name: 'Perfuração & Demolição', icon: 'hammer' },
            { name: 'Acesso & Elevação', icon: 'layers' },
            { name: 'Energia & Iluminação', icon: 'zap' },
            { name: 'Limpeza & Jateamento', icon: 'droplets' },
            { name: 'Compactação de Solo', icon: 'activity' },
            { name: 'Betoneiras & Mistura', icon: 'mixer' },
            { name: 'Terraplenagem', icon: 'truck' }
        ];

        const catIds = [];
        for (const cat of categoriesData) {
            const res = await client.query(`
                INSERT INTO tool_categories (id, tenant_id, name, icon_name)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (tenant_id, name) DO UPDATE SET icon_name = EXCLUDED.icon_name
                RETURNING id
            `, [uuidv4(), tenantId, cat.name, cat.icon]);
            catIds.push(res.rows[0].id);
        }

        // 4. Tools Setup
        console.log('--- Tools Setup (Brands: Makita, Bosch, DeWalt, Hilti) ---');
        const brands = ['Makita', 'Bosch', 'DeWalt', 'Hilti', 'Menegotti', 'Vonder'];

        async function createTools(count, status, prefix) {
            const ids = [];
            for (let i = 0; i < count; i++) {
                const catId = catIds[i % catIds.length];
                const brand = brands[i % brands.length];
                const rate = 80 + (Math.random() * 600);
                const res = await client.query(`
                    INSERT INTO tools (id, tenant_id, category_id, name, brand, model, daily_rate, status, asset_tag)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING id, daily_rate as rate
                `, [uuidv4(), tenantId, catId, `${prefix} ${i + 1}`, brand, `Pro-Series ${i + 100}`, rate.toFixed(2), status, `${prefix.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`]);
                ids.push(res.rows[0]);
            }
            return ids;
        }

        const availTools = await createTools(87, 'available', 'Equipamento');
        const maintTools = await createTools(6, 'maintenance', 'Ativo');
        const rentedTools = await createTools(71, 'rented', 'Ativo em Campo');

        // 5. Customers
        console.log('--- Customers Setup (High-End Constructoras) ---');
        const builders = ['Construtora Cyrela', 'Moura Dubeux', 'MRV Engenharia', 'Odebrecht', 'Camargo Corrêa', 'Tenda', 'Even', 'Gafisa'];
        const customerIds = [];
        for (let i = 0; i < 40; i++) {
            const isCompany = Math.random() > 0.3;
            const name = isCompany ? `${builders[i % builders.length]} - Obra ${i + 1}` : `Eng. Roberto Silva ${i + 1}`;
            const res = await client.query(`
                INSERT INTO customers (id, tenant_id, full_name, document_type, document_number, phone_number, email)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `, [uuidv4(), tenantId, name, isCompany ? 'CNPJ' : 'CPF', `00.000.123/0001-${i.toString().padStart(2, '0')}`, `(11) 9${Math.floor(7000 + Math.random() * 2000)}-${Math.floor(1000 + Math.random() * 9000)}`, `contato@obra${i}.com.br`]);
            customerIds.push(res.rows[0].id);
        }

        // 6. Rentals & Payments (History for Charts)
        console.log('--- Seeding 6 Months of Financial History ---');
        const today = new Date();
        for (let m = 0; m < 6; m++) {
            const monthDate = subMonths(today, m);
            console.log(`  Seeding history for month -${m}...`);
            for (let i = 0; i < 15; i++) {
                const tool = availTools[i % availTools.length];
                const custId = customerIds[i % customerIds.length];
                const start = subDays(monthDate, 20 + i);
                const end = subDays(monthDate, 10 + i);
                const total = parseFloat(tool.rate) * 10;

                const rentalId = uuidv4();
                await client.query(`
                    INSERT INTO rentals (id, tenant_id, tool_id, customer_id, rental_code, start_date, end_date_expected, end_date_actual, daily_rate_agreed, total_days_expected, total_amount_expected, total_amount_actual, status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `, [rentalId, tenantId, tool.id, custId, `HIST-${m}-${i}`, start, end, end, tool.rate, 10, total, total, 'returned']);

                await client.query(`
                    INSERT INTO payments (id, tenant_id, rental_id, amount, payment_date, payment_method, status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [uuidv4(), tenantId, rentalId, total, end, 'pix', 'completed']);
            }
        }

        // 7. Active, Overdue, Returns Today
        console.log('--- Current Active Operations ---');
        async function createCurrentRental(tool, custId, start, end, status) {
            const rentalId = uuidv4();
            const total = parseFloat(tool.rate) * 5;
            await client.query(`
                INSERT INTO rentals (id, tenant_id, tool_id, customer_id, rental_code, start_date, end_date_expected, daily_rate_agreed, total_days_expected, total_amount_expected, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [rentalId, tenantId, tool.id, custId, `ACT-${Math.random().toString(36).substring(7).toUpperCase()}`, start, end, tool.rate, 5, total, status]);
        }

        // 21 Returns Today
        for (let i = 0; i < 21; i++) await createCurrentRental(rentedTools[i], customerIds[i % 40], subDays(today, 5), endOfDay(today), 'active');
        // 4 Overdue
        for (let i = 21; i < 25; i++) await createCurrentRental(rentedTools[i], customerIds[i % 40], subDays(today, 10), subDays(today, 1), 'overdue');
        // 46 Active
        for (let i = 25; i < 71; i++) await createCurrentRental(rentedTools[i], customerIds[i % 40], subDays(today, 2), addDays(today, 10), 'active');

        // 8. Communications Log
        console.log('--- WhatsApp/Email Logs ---');
        const msgs = [
            "Contrato #8819 enviado para assinatura digital",
            "Lembrete: Devolução de Martelete 30kg hoje até 16h",
            "Fatura Pix gerada com sucesso para Construtora Moura",
            "Atenção: Locação em atraso (Betoneira 400L) - Obra 4",
            "Manutenção preventiva agendada para Gerador 55kVA"
        ];
        for (let i = 0; i < 15; i++) {
            await client.query(`
                INSERT INTO client_communications (id, tenant_id, customer_id, type, message, created_at)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [uuidv4(), tenantId, customerIds[i % 40], i % 2 === 0 ? 'whatsapp' : 'email', msgs[i % 5], subDays(today, i)]);
        }

        console.log('\n💎 DIAMOND-SEED COMPLETED!');
        console.log('Login: elite@frotex.com.br / elite123');

    } catch (err) {
        console.error('❌ Error during diamond seeding:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
