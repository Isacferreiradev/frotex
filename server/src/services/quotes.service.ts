import { db } from '../db';
import { quotes, tools, customers, NewQuote, rentals } from '../db/schema';

import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

export const createQuoteSchema = z.object({
    toolId: z.string().uuid(),
    customerId: z.string().uuid(),
    startDate: z.string().pipe(z.coerce.date()),
    endDateExpected: z.string().pipe(z.coerce.date()),
    totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

export const updateQuoteStatusSchema = z.object({
    status: z.enum(['draft', 'sent', 'accepted', 'rejected']),
});

export const listQuotes = async (tenantId: string) => {
    return await db.query.quotes.findMany({
        where: eq(quotes.tenantId, tenantId),
        with: {
            tool: true,
            customer: true,
        },
        orderBy: [desc(quotes.createdAt)],
    });
};

export const createQuote = async (tenantId: string, data: any) => {
    const validated = createQuoteSchema.parse(data);

    const [newQuote] = await db.insert(quotes).values({
        tenantId,
        ...validated,
    }).returning();

    return newQuote;
};

export const updateQuoteStatus = async (tenantId: string, id: string, status: string) => {
    const [updated] = await db.update(quotes)
        .set({ status: status as any, updatedAt: new Date() })
        .where(and(eq(quotes.id, id), eq(quotes.tenantId, tenantId)))
        .returning();

    return updated;
};

export const getQuote = async (tenantId: string, id: string) => {
    return await db.query.quotes.findFirst({
        where: and(eq(quotes.id, id), eq(quotes.tenantId, tenantId)),
        with: {
            tool: true,
            customer: true,
        },
    });
};

export const convertToRental = async (tenantId: string, quoteId: string, userId: string) => {
    return await db.transaction(async (tx) => {
        const quote = await tx.query.quotes.findFirst({
            where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
        });

        if (!quote) throw new Error('Orçamento não encontrado');
        if (quote.status !== 'accepted') throw new Error('Apenas orçamentos aprovados podem ser convertidos');

        const [newRental] = await tx.insert(rentals).values({
            tenantId,
            toolId: quote.toolId,
            customerId: quote.customerId,
            rentalCode: `Q-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            startDate: quote.startDate,
            endDateExpected: quote.endDateExpected,
            dailyRateAgreed: '0', // This should normally come from tool dailyRate
            totalAmountExpected: quote.totalAmount,
            totalDaysExpected: 1,
            status: 'active',
            checkoutBy: userId,
        }).returning();

        await tx.update(tools)
            .set({ status: 'rented', updatedAt: new Date() })
            .where(eq(tools.id, quote.toolId));

        await tx.update(quotes)
            .set({ status: 'accepted', updatedAt: new Date() })
            .where(eq(quotes.id, quoteId));

        return newRental;
    });
};
