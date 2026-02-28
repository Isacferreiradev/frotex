import { db } from '../db';
import { contractTemplates, NewContractTemplate } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AppError } from '../middleware/error.middleware';
import * as z from 'zod';

export const templateSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    content: z.string().min(1, 'Conteúdo é obrigatório'),
    isDefault: z.boolean().optional().default(false),
});

export async function listTemplates(tenantId: string) {
    return await db.select()
        .from(contractTemplates)
        .where(eq(contractTemplates.tenantId, tenantId))
        .orderBy(contractTemplates.createdAt);
}

export async function getTemplate(tenantId: string, id: string) {
    const [template] = await db.select()
        .from(contractTemplates)
        .where(and(eq(contractTemplates.tenantId, tenantId), eq(contractTemplates.id, id)));
    return template;
}

export async function createTemplate(tenantId: string, data: z.infer<typeof templateSchema>) {
    // If setting as default, unset others
    if (data.isDefault) {
        await db.update(contractTemplates)
            .set({ isDefault: false })
            .where(eq(contractTemplates.tenantId, tenantId));
    }

    const [newTemplate] = await db.insert(contractTemplates)
        .values({
            ...data,
            tenantId,
        })
        .returning();

    return newTemplate;
}

export async function updateTemplate(tenantId: string, id: string, data: Partial<z.infer<typeof templateSchema>>) {
    // Check ownership
    const existing = await getTemplate(tenantId, id);
    if (!existing) throw new AppError(404, 'Template não encontrado');

    // If setting as default, unset others
    if (data.isDefault) {
        await db.update(contractTemplates)
            .set({ isDefault: false })
            .where(eq(contractTemplates.tenantId, tenantId));
    }

    const [updated] = await db.update(contractTemplates)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(contractTemplates.tenantId, tenantId), eq(contractTemplates.id, id)))
        .returning();

    return updated;
}

export async function deleteTemplate(tenantId: string, id: string) {
    const existing = await getTemplate(tenantId, id);
    if (!existing) throw new AppError(404, 'Template não encontrado');

    if (existing.isDefault) {
        throw new AppError(400, 'Não é possível excluir o template padrão');
    }

    await db.delete(contractTemplates)
        .where(and(eq(contractTemplates.tenantId, tenantId), eq(contractTemplates.id, id)));
}
