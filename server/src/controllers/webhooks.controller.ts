import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { payments } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function asaasWebhook(req: Request, res: Response, next: NextFunction) {
    try {
        const { event, payment } = req.body;

        console.log(`[ASAAS WEBHOOK] Event: ${event}, PaymentID: ${payment.id}`);

        // Eventos de interesse:
        // PAYMENT_RECEIVED: Pago (dinheiro na conta)
        // PAYMENT_CONFIRMED: Confirmado (cartão ou boleto liquidado)
        // PAYMENT_OVERDUE: Vencido
        // PAYMENT_REFUNDED: Estornado

        let newStatus: 'completed' | 'pending' | 'failed' | 'refunded' = 'pending';
        let gatewayStatus = payment.status;

        if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
            newStatus = 'completed';
        } else if (event === 'PAYMENT_OVERDUE') {
            newStatus = 'failed';
        } else if (event === 'PAYMENT_REFUNDED') {
            newStatus = 'refunded';
        } else {
            // Ignora outros eventos por enquanto
            return res.json({ success: true });
        }

        // Atualiza o pagamento no banco
        await db.update(payments)
            .set({
                status: newStatus,
                gatewayStatus: gatewayStatus,
                paymentDate: payment.confirmedDate ? new Date(payment.confirmedDate) : new Date(),
            })
            .where(eq(payments.gatewayId, payment.id));

        res.json({ success: true });
    } catch (err) {
        console.error('Webhook Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
