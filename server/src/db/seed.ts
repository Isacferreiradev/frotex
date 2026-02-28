import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './index';
import { tenants, users, toolCategories, tools, customers } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
    console.log('🌱 Seeding demo data...');

    // Create demo tenant
    const [tenant] = await db.insert(tenants).values({
        name: 'Locadora Demo',
        cnpj: '12.345.678/0001-90',
        contactEmail: 'contato@locadorademo.com.br',
        phoneNumber: '(11) 99999-0000',
        address: 'Rua das Ferramentas, 100 - São Paulo, SP',
        settings: {
            currency: 'BRL',
            locale: 'pt-BR',
            contractTemplateId: null,
            whatsappApiKey: null,
            overdueFinePercentage: 10,
        },
    }).onConflictDoNothing().returning();

    if (!tenant) {
        console.log('✅ Demo tenant already exists, skipping seed.');
        process.exit(0);
    }

    // Create owner user
    const passwordHash = await bcrypt.hash('demo123', 12);
    await db.insert(users).values({
        tenantId: tenant.id,
        email: 'demo@locafacil.com',
        passwordHash,
        fullName: 'Admin Demo',
        role: 'owner',
    }).onConflictDoNothing();

    // Create categories
    const categoryData = [
        { name: 'Betoneiras', iconName: 'mixer', description: 'Betoneiras e misturadores de concreto' },
        { name: 'Marteletes', iconName: 'hammer', description: 'Marteletes e perfuradoras' },
        { name: 'Andaimes', iconName: 'layers', description: 'Andaimes e plataformas' },
        { name: 'Compactadores', iconName: 'activity', description: 'Compactadores de solo e placa vibratória' },
        { name: 'Geradores', iconName: 'zap', description: 'Geradores de energia portáteis' },
        { name: 'Lavadoras', iconName: 'droplets', description: 'Lavadoras de alta pressão' },
    ];

    const insertedCategories = await db.insert(toolCategories).values(
        categoryData.map((c) => ({ ...c, tenantId: tenant.id }))
    ).returning();

    const catMap = Object.fromEntries(insertedCategories.map((c: { name: string; id: string }) => [c.name, c.id]));

    // Create tools
    await db.insert(tools).values([
        {
            tenantId: tenant.id,
            categoryId: catMap['Betoneiras'],
            name: 'Betoneira 120L CSM',
            brand: 'CSM',
            model: 'B-120L',
            serialNumber: 'CSM-001',
            assetTag: 'BET-001',
            dailyRate: '80.00',
            status: 'available',
            currentUsageHours: '245.00',
            nextMaintenanceDueHours: '500.00',
        },
        {
            tenantId: tenant.id,
            categoryId: catMap['Betoneiras'],
            name: 'Betoneira 160L CSM',
            brand: 'CSM',
            model: 'B-160L',
            serialNumber: 'CSM-002',
            assetTag: 'BET-002',
            dailyRate: '100.00',
            status: 'rented',
            currentUsageHours: '430.00',
            nextMaintenanceDueHours: '500.00',
        },
        {
            tenantId: tenant.id,
            categoryId: catMap['Marteletes'],
            name: 'Martelete Bosch GBH 2-28',
            brand: 'Bosch',
            model: 'GBH 2-28',
            serialNumber: 'BSH-MAR-001',
            assetTag: 'MAR-001',
            dailyRate: '50.00',
            status: 'available',
            currentUsageHours: '120.00',
            nextMaintenanceDueHours: '300.00',
        },
        {
            tenantId: tenant.id,
            categoryId: catMap['Marteletes'],
            name: 'Martelete Makita HR2470',
            brand: 'Makita',
            model: 'HR2470',
            serialNumber: 'MKT-MAR-001',
            assetTag: 'MAR-002',
            dailyRate: '55.00',
            status: 'maintenance',
            currentUsageHours: '298.00',
            nextMaintenanceDueHours: '300.00',
        },
        {
            tenantId: tenant.id,
            categoryId: catMap['Lavadoras'],
            name: 'Lavadora Alta Pressão Karcher K5',
            brand: 'Karcher',
            model: 'K5 Premium',
            serialNumber: 'KAR-LAV-001',
            assetTag: 'LAV-001',
            dailyRate: '70.00',
            status: 'available',
            currentUsageHours: '89.00',
            nextMaintenanceDueHours: '400.00',
        },
        {
            tenantId: tenant.id,
            categoryId: catMap['Geradores'],
            name: 'Gerador 5kVA Branco',
            brand: 'Branco',
            model: 'B4T-5000',
            serialNumber: 'BRC-GER-001',
            assetTag: 'GER-001',
            dailyRate: '120.00',
            status: 'available',
            currentUsageHours: '312.00',
            nextMaintenanceDueHours: '600.00',
        },
        {
            tenantId: tenant.id,
            categoryId: catMap['Compactadores'],
            name: 'Compactador de Solo Wacker',
            brand: 'Wacker',
            model: 'BS60-2',
            serialNumber: 'WCK-COM-001',
            assetTag: 'COM-001',
            dailyRate: '90.00',
            status: 'available',
            currentUsageHours: '156.00',
            nextMaintenanceDueHours: '400.00',
        },
        {
            tenantId: tenant.id,
            categoryId: catMap['Andaimes'],
            name: 'Andaime Tubular 5m',
            brand: 'Altrad',
            model: 'T-5M',
            serialNumber: 'ALT-AND-001',
            assetTag: 'AND-001',
            dailyRate: '40.00',
            status: 'available',
            currentUsageHours: '0.00',
            nextMaintenanceDueHours: null,
        },
    ]);

    // Create customers
    await db.insert(customers).values([
        {
            tenantId: tenant.id,
            fullName: 'João da Silva',
            documentType: 'CPF',
            documentNumber: '123.456.789-00',
            phoneNumber: '(11) 98765-4321',
            email: 'joao.silva@email.com',
            addressStreet: 'Rua das Flores',
            addressNumber: '123',
            addressCity: 'São Paulo',
            addressState: 'SP',
            addressZipCode: '01310-100',
            isBlocked: false,
        },
        {
            tenantId: tenant.id,
            fullName: 'Maria Construções Ltda',
            documentType: 'CNPJ',
            documentNumber: '98.765.432/0001-10',
            phoneNumber: '(11) 3456-7890',
            email: 'contato@mariaconstrucoes.com.br',
            addressStreet: 'Av. Paulista',
            addressNumber: '1000',
            addressCity: 'São Paulo',
            addressState: 'SP',
            addressZipCode: '01310-200',
            isBlocked: false,
        },
        {
            tenantId: tenant.id,
            fullName: 'Pedro Inadimplente',
            documentType: 'CPF',
            documentNumber: '999.888.777-66',
            phoneNumber: '(11) 91111-2222',
            isBlocked: true,
            notes: 'Deveu R$300 em março/2025. Bloqueado até regularização.',
        },
        {
            tenantId: tenant.id,
            fullName: 'Construtora ABC',
            documentType: 'CNPJ',
            documentNumber: '11.222.333/0001-44',
            phoneNumber: '(11) 4000-5000',
            email: 'obras@construtorabc.com.br',
            addressStreet: 'Rua da Obra',
            addressNumber: '50',
            addressCity: 'São Paulo',
            addressState: 'SP',
            addressZipCode: '04001-000',
            isBlocked: false,
        },
    ]);

    console.log('✅ Seed completed successfully!');
    console.log('📧 Login: demo@locafacil.com');
    console.log('🔑 Password: demo123');
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
