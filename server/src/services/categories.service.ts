import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { toolCategories } from '../db/schema';
import { AppError } from '../middleware/error.middleware';
import { z } from 'zod';

export const categorySchema = z.object({
    name: z.string().min(2, 'Nome obrigatório'),
    description: z.string().optional(),
    iconName: z.string().optional(),
});

export async function listCategories(tenantId: string) {
    return db.select().from(toolCategories).where(eq(toolCategories.tenantId, tenantId)).orderBy(toolCategories.name);
}

export async function createCategory(tenantId: string, data: z.infer<typeof categorySchema>) {
    const [cat] = await db.insert(toolCategories).values({ tenantId, ...data }).returning();
    return cat;
}

export async function updateCategory(tenantId: string, id: string, data: Partial<z.infer<typeof categorySchema>>) {
    const [cat] = await db
        .update(toolCategories)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(toolCategories.tenantId, tenantId), eq(toolCategories.id, id)))
        .returning();
    if (!cat) throw new AppError(404, 'Categoria não encontrada');
    return cat;
}

export async function deleteCategory(tenantId: string, id: string) {
    const [cat] = await db.delete(toolCategories).where(and(eq(toolCategories.tenantId, tenantId), eq(toolCategories.id, id))).returning();
    if (!cat) throw new AppError(404, 'Categoria não encontrada');
    return { success: true };
}
