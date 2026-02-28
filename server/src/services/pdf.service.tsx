import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import { RentalContract } from './pdf.template';
import { db } from '../db';
import { tenants, rentals, tools, customers, contractTemplates } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AppError } from '../middleware/error.middleware';

export async function generateRentalPdf(tenantId: string, rentalId: string): Promise<NodeJS.ReadableStream> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    const rental = await db.query.rentals.findFirst({
        where: and(eq(rentals.tenantId, tenantId), eq(rentals.id, rentalId)),
        with: {
            tool: true,
            customer: true,
        }
    });

    if (!tenant || !rental) {
        throw new AppError(404, 'Locação ou locadora não encontrada');
    }

    const pdfData = {
        tenant: {
            name: tenant.name,
            cnpj: tenant.cnpj || undefined,
            address: tenant.address || undefined,
            phoneNumber: tenant.phoneNumber || undefined,
        },
        customer: {
            fullName: rental.customer.fullName,
            documentNumber: rental.customer.documentNumber,
            phoneNumber: rental.customer.phoneNumber,
            address: rental.customer.addressStreet ? `${rental.customer.addressStreet}, ${rental.customer.addressNumber}` : undefined,
        },
        tool: {
            name: rental.tool.name,
            brand: rental.tool.brand || undefined,
            model: rental.tool.model || undefined,
            serialNumber: rental.tool.serialNumber || undefined,
        },
        rental: {
            rentalCode: rental.rentalCode,
            startDate: rental.startDate.toISOString(),
            endDateExpected: rental.endDateExpected.toISOString(),
            dailyRate: rental.dailyRateAgreed,
            totalAmountExpected: rental.totalAmountExpected,
        }
    };

    let customContent: string | undefined = undefined;

    // Fetch template if assigned
    const templateId = (rental as any).templateId;
    if (templateId) {
        const [template] = await db.select().from(contractTemplates).where(and(eq(contractTemplates.tenantId, tenantId), eq(contractTemplates.id, templateId)));
        if (template) {
            customContent = processTemplateContent(template.content, pdfData);
        }
    } else {
        // Try fallback to default template
        const [defaultTemplate] = await db.select().from(contractTemplates).where(and(eq(contractTemplates.tenantId, tenantId), eq(contractTemplates.isDefault, true)));
        if (defaultTemplate) {
            customContent = processTemplateContent(defaultTemplate.content, pdfData);
        }
    }

    const stream = await ReactPDF.renderToStream(<RentalContract data={pdfData} customContent={customContent} />);
    return stream;
}

function processTemplateContent(content: string, data: any): string {
    const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const vars: Record<string, string> = {
        '{{empresa}}': data.tenant.name,
        '{{cliente}}': data.customer.fullName,
        '{{documento}}': data.customer.documentNumber || '',
        '{{ferramenta}}': data.tool.name,
        '{{valor_dia}}': formatter.format(parseFloat(data.rental.dailyRate)),
        '{{valor_total}}': formatter.format(parseFloat(data.rental.totalAmountExpected)),
        '{{data_inicio}}': new Date(data.rental.startDate).toLocaleDateString('pt-BR'),
        '{{data_fim}}': new Date(data.rental.endDateExpected).toLocaleDateString('pt-BR'),
    };

    let result = content;
    for (const [key, value] of Object.entries(vars)) {
        // Use a global regex for replacement
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        result = result.replace(regex, value);
    }
    return result;
}
