import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { maintenanceLogs, tools } from '../db/schema';
import { AppError } from '../middleware/error.middleware';
import { z } from 'zod';

export const maintenanceLogSchema = z.object({
    toolId: z.string().uuid(),
    maintenanceDate: z.string().optional(),
    description: z.string().min(3, 'Descrição obrigatória'),
    cost: z.coerce.number().default(0),
    notes: z.string().optional(),
});

export async function listMaintenanceLogs(tenantId: string, filters: { toolId?: string }) {
    return db.query.maintenanceLogs.findMany({
        where: eq(maintenanceLogs.tenantId, tenantId),
        with: {
            tool: { columns: { id: true, name: true, serialNumber: true } },
        },
        orderBy: [desc(maintenanceLogs.maintenanceDate)],
    });
}

export async function createMaintenanceLog(tenantId: string, userId: string, data: z.infer<typeof maintenanceLogSchema>) {
    const [log] = await db.insert(maintenanceLogs).values({
        tenantId,
        toolId: data.toolId,
        maintenanceDate: data.maintenanceDate ? new Date(data.maintenanceDate) : new Date(),
        description: data.description,
        cost: String(data.cost),
        performedBy: userId,
        notes: data.notes,
    }).returning();

    // Update tool: set available + last_maintenance_at
    await db.update(tools).set({
        status: 'available',
        lastMaintenanceAt: new Date(),
        updatedAt: new Date(),
    }).where(and(eq(tools.tenantId, tenantId), eq(tools.id, data.toolId)));

    return log;
}

export async function getToolsDueForMaintenance(tenantId: string) {
    const allTools = await db.select().from(tools).where(eq(tools.tenantId, tenantId));
    return allTools.filter((t) => {
        if (t.status === 'maintenance') return true;
        if (t.nextMaintenanceDueHours && t.currentUsageHours) {
            return parseFloat(t.currentUsageHours) >= parseFloat(t.nextMaintenanceDueHours) * 0.9;
        }
        return false;
    });
}
