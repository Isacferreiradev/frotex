import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db';
import { clientCommunications } from '../db/schema';
import { z } from 'zod';

export const createCommunicationSchema = z.object({
    customerId: z.string().uuid(),
    type: z.enum(['call', 'note', 'whatsapp']),
    message: z.string().min(1),
});

export async function listCommunications(tenantId: string, customerId: string) {
    return await db.query.clientCommunications.findMany({
        where: and(
            eq(clientCommunications.tenantId, tenantId),
            eq(clientCommunications.customerId, customerId)
        ),
        with: {
            user: { columns: { fullName: true, avatarUrl: true } }
        },
        orderBy: [desc(clientCommunications.createdAt)],
    });
}

export async function createCommunication(tenantId: string, userId: string, data: z.infer<typeof createCommunicationSchema>) {
    const [communication] = await db.insert(clientCommunications).values({
        tenantId,
        customerId: data.customerId,
        userId,
        type: data.type,
        message: data.message,
    }).returning();

    return communication;
}
