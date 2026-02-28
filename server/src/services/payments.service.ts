import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { payments, tenants, rentals, customers } from '../db/schema';
import { AppError } from '../middleware/error.middleware';
import { z } from 'zod';
import { AsaasService } from './asaas.service';

export const paymentSchema = z.object({
    rentalId: z.string().uuid(),
    amount: z.coerce.number().min(0),
    paymentMethod: z.enum(['cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer']),
    paymentDate: z.string().optional(),
    status: z.enum(['completed', 'pending', 'failed', 'refunded']).default('completed'),
    notes: z.string().optional(),
});

export async function listPayments(tenantId: string) {
    return db.query.payments.findMany({
        where: eq(payments.tenantId, tenantId),
        with: {
            rental: { columns: { rentalCode: true } },
        },
        orderBy: [desc(payments.paymentDate)],
    });
}

export async function createPayment(tenantId: string, userId: string, data: z.infer<typeof paymentSchema>) {
    // 1. Verificar se o tenant tem gateway configurado
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));

    let gatewayData = null;

    // 2. Se for PIX ou Boleto e tiver API Key, gerar no Asaas
    if (tenant?.asaasApiKey && (data.paymentMethod === 'pix' || data.paymentMethod === 'bank_transfer')) {
        const asaas = new AsaasService(tenant.asaasApiKey);

        // Buscar dados da locação e cliente
        const rental = await db.query.rentals.findFirst({
            where: and(eq(rentals.tenantId, tenantId), eq(rentals.id, data.rentalId)),
            with: { customer: true }
        });

        if (rental) {
            const asaasCustomerId = await asaas.findOrCreateCustomer({
                name: rental.customer.fullName,
                document: rental.customer.documentNumber,
                email: rental.customer.email || undefined,
                phone: rental.customer.phoneNumber,
            });

            const asaasPayment = await asaas.createPayment({
                customer: asaasCustomerId,
                billingType: data.paymentMethod === 'pix' ? 'PIX' : 'BOLETO',
                value: data.amount,
                dueDate: new Date().toISOString().split('T')[0], // Hoje
                description: `Locação #${rental.rentalCode}`,
                externalReference: rental.id,
            });

            gatewayData = {
                gatewayId: asaasPayment.id,
                gatewayStatus: asaasPayment.status,
                paymentLink: asaasPayment.paymentLink,
                status: 'pending' as const, // Força pendente até confirmação do gateway
            };

            // Se for PIX, buscar dados do QR Code
            if (data.paymentMethod === 'pix') {
                const pixData = await asaas.getPixData(asaasPayment.id);
                if (pixData) {
                    gatewayData = {
                        ...gatewayData,
                        pixCopyPaste: pixData.copyPaste,
                        pixQrCode: pixData.qrCode,
                    };
                }
            }
        }
    }

    const [payment] = await db.insert(payments).values({
        tenantId,
        rentalId: data.rentalId,
        amount: String(data.amount),
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        status: gatewayData?.status || data.status,
        notes: data.notes,
        receivedBy: userId,
        ...gatewayData,
    }).returning();

    return payment;
}

export async function getPayment(tenantId: string, id: string) {
    const payment = await db.query.payments.findFirst({
        where: and(eq(payments.tenantId, tenantId), eq(payments.id, id)),
        with: { rental: true },
    });
    if (!payment) throw new AppError(404, 'Pagamento não encontrado');
    return payment;
}
