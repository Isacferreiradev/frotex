import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './index';
import { tenants, users, toolCategories, tools, customers, rentals, payments, expenses, otherRevenues } from './schema';
import { subDays, addDays } from 'date-fns';

async function seed() {
    try {
        console.log('🌱 Generating comprehensive dashboard mock data...');

        // 1. Get or Create Tenant
        console.log('Checking for tenant...');
        let tenant = await db.query.tenants.findFirst({
            where: (tenants, { eq }) => eq(tenants.name, 'Locadora Elite Pro')
        });

        if (!tenant) {
            console.log('Creating new tenant: Locadora Elite Pro');
            const [newTenant] = await db.insert(tenants).values({
                name: 'Locadora Elite Pro',
                cnpj: '45.123.789/0001-55',
                contactEmail: 'diretoria@locadoraelite.com.br',
                phoneNumber: '(11) 98888-7777',
                address: 'Av. das Nações, 5000 - São Paulo, SP',
                plan: 'pro',
                settings: {
                    currency: 'BRL',
                    locale: 'pt-BR',
                    contractTemplateId: null,
                    whatsappApiKey: null,
                    overdueFinePercentage: 10,
                },
            }).returning();
            tenant = newTenant;
        }

        const tenantId = tenant.id;
        console.log(`Using tenantId: ${tenantId}`);

        // 2. Categories
        console.log('Creating categories...');
        const catData = [
            { name: 'Equipamentos Pesados', iconName: 'truck', description: 'Retroescavadeiras e Bobcat' },
            { name: 'Ferramentas Elétricas', iconName: 'zap', description: 'Furadeiras, Serras e Lixadeiras' },
            { name: 'Acesso e Elevação', iconName: 'arrow-up', description: 'Plataformas e Escadas' },
            { name: 'Geradores e Motores', iconName: 'battery', description: 'Energia portátil' }
        ];

        for (const cat of catData) {
            await db.insert(toolCategories).values({ ...cat, tenantId }).onConflictDoNothing();
        }

        const allCats = await db.query.toolCategories.findMany({ where: (tc, { eq }) => eq(tc.tenantId, tenantId) });
        const catMap = Object.fromEntries(allCats.map(c => [c.name, c.id]));
        console.log('Categories mapped:', Object.keys(catMap));

        // 3. Tools
        console.log('Creating tools...');
        const toolValues = [
            { tenantId, categoryId: catMap['Equipamentos Pesados'], name: 'Mini Escavadeira Yanmar', brand: 'Yanmar', model: 'ViO17', dailyRate: '450.00', status: 'rented' as const, assetTag: 'PES-001' },
            { tenantId, categoryId: catMap['Equipamentos Pesados'], name: 'Mini Carregadeira Bobcat', brand: 'Bobcat', model: 'S450', dailyRate: '380.00', status: 'available' as const, assetTag: 'PES-002' },
            { tenantId, categoryId: catMap['Ferramentas Elétricas'], name: 'Martelete Demolidor Bosch', brand: 'Bosch', model: 'GSH 11 E', dailyRate: '120.00', status: 'maintenance' as const, assetTag: 'ELE-001' },
            { tenantId, categoryId: catMap['Ferramentas Elétricas'], name: 'Serra Circular DeWalt', brand: 'DeWalt', model: 'DWE560', dailyRate: '65.00', status: 'rented' as const, assetTag: 'ELE-002' },
            { tenantId, categoryId: catMap['Acesso e Elevação'], name: 'Plataforma Tesoura Haulotte', brand: 'Haulotte', model: 'Optimum 8', dailyRate: '250.00', status: 'available' as const, assetTag: 'ELE-003' },
            { tenantId, categoryId: catMap['Geradores e Motores'], name: 'Gerador 10kVA Toyama', brand: 'Toyama', model: 'TG12000', dailyRate: '180.00', status: 'rented' as const, assetTag: 'GER-001' }
        ];

        const insertedTools = [];
        for (const tool of toolValues) {
            if (tool.categoryId) {
                const [t] = await db.insert(tools).values(tool as any).onConflictDoNothing().returning();
                if (t) insertedTools.push(t);
            }
        }

        const allTools = insertedTools.length > 0 ? insertedTools : await db.query.tools.findMany({ where: (t, { eq }) => eq(t.tenantId, tenantId) });
        console.log(`Tools ready: ${allTools.length}`);

        // 4. Customers
        console.log('Creating customers...');
        const customerValues = [
            { tenantId, fullName: 'Construtora Horizonte', documentType: 'CNPJ' as const, documentNumber: '11.222.333/0001-44', phoneNumber: '(11) 4004-1000', email: 'obra@horizonte.com.br' },
            { tenantId, fullName: 'Ricardo Neves', documentType: 'CPF' as const, documentNumber: '123.456.789-01', phoneNumber: '(11) 97777-6666', email: 'ricardo@gmail.com' },
            { tenantId, fullName: 'Engenharia do Vale', documentType: 'CNPJ' as const, documentNumber: '44.555.666/0001-88', phoneNumber: '(11) 3222-1111', email: 'financeiro@vale.com.br' }
        ];

        const insertedCustomers = [];
        for (const cust of customerValues) {
            const [c] = await db.insert(customers).values(cust as any).onConflictDoNothing().returning();
            if (c) insertedCustomers.push(c);
        }
        const allCustomers = insertedCustomers.length > 0 ? insertedCustomers : await db.query.customers.findMany({ where: (c, { eq }) => eq(c.tenantId, tenantId) });
        console.log(`Customers ready: ${allCustomers.length}`);

        // 5. Rentals & Payments (The juicy part)
        console.log('Creating rentals and payments...');

        for (let i = 0; i < allTools.length; i++) {
            const tool = allTools[i];
            const customer = allCustomers[i % allCustomers.length];

            const startDate = subDays(new Date(), Math.floor(Math.random() * 30) + 5);
            const endDateExpected = addDays(startDate, 10);

            const [rental] = await db.insert(rentals).values({
                tenantId,
                toolId: tool.id,
                customerId: customer.id,
                rentalCode: `LOC-${Math.random().toString(36).substring(7).toUpperCase()}`,
                startDate,
                endDateExpected,
                dailyRateAgreed: tool.dailyRate,
                totalDaysExpected: 10,
                totalAmountExpected: (parseFloat(tool.dailyRate) * 10).toString(),
                status: i % 2 === 0 ? 'active' : 'returned',
                endDateActual: i % 2 === 0 ? null : addDays(startDate, 8),
                totalAmountActual: i % 2 === 0 ? null : (parseFloat(tool.dailyRate) * 8).toString(),
            }).returning();

            if (rental) {
                await db.insert(payments).values({
                    tenantId,
                    rentalId: rental.id,
                    amount: (parseFloat(tool.dailyRate) * 5).toString(),
                    paymentDate: addDays(startDate, 1),
                    paymentMethod: 'pix',
                    status: 'completed',
                    notes: 'Antecipação 50%'
                });

                if (rental.status === 'returned') {
                    await db.insert(payments).values({
                        tenantId,
                        rentalId: rental.id,
                        amount: (parseFloat(tool.dailyRate) * 3).toString(),
                        paymentDate: rental.endDateActual || new Date(),
                        paymentMethod: 'credit_card',
                        status: 'completed',
                        notes: 'Saldo final'
                    });
                }
            }
        }

        // 6. Expenses
        console.log('Creating expenses...');
        await db.insert(expenses).values([
            { tenantId, category: 'Manutenção', description: 'Troca de óleo mini escavadeira', amount: '450.00', date: subDays(new Date(), 10) },
            { tenantId, category: 'Marketing', description: 'Google Ads Fevereiro', amount: '1200.00', date: subDays(new Date(), 5) },
            { tenantId, category: 'Operacional', description: 'Aluguel Pátio', amount: '3500.00', date: subDays(new Date(), 15) }
        ]);

        console.log('✅ Success! Dashboard is now populated with rich data.');
        console.log('Tenant Name: Locadora Elite Pro');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}

seed().catch(err => {
    console.error('❌ Error seeding:', err);
    process.exit(1);
});
