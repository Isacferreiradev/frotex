import { db } from '../db';
import { tools, rentals, maintenanceLogs, toolCategories } from '../db/schema';
import { eq, and, sql, sum } from 'drizzle-orm';

export interface RoiInsight {
    toolId: string;
    toolName: string;
    categoryName: string;
    revenue: number;
    maintenanceCost: number;
    acquisitionCost: number;
    roi: number; // Overall ROI
    roiPercent: number;
    utilizationRate: number; // % of days rented since acquisition
    daysOwned: number;
    daysRented: number;
    status: string;
    suggestion: {
        type: 'increase' | 'decrease' | 'maintain' | 'replace' | 'alert';
        text: string;
        action: string;
    };
}

export async function getRoiInsights(tenantId: string): Promise<RoiInsight[]> {
    // 1. Fetch all tools for the tenant
    const allTools = await db.query.tools.findMany({
        where: eq(tools.tenantId, tenantId),
        with: {
            category: true,
            maintenanceLogs: true,
            rentals: true,
        }
    });

    const insights: RoiInsight[] = allTools.map((tool) => {
        const acquisitionCost = parseFloat(tool.acquisitionCost || '0');

        // Sum revenue from actual rentals
        const revenue = tool.rentals.reduce((acc, r) => {
            return acc + parseFloat(r.totalAmountActual || '0');
        }, 0);

        // Sum maintenance costs
        const maintenanceCost = tool.maintenanceLogs.reduce((acc, m) => {
            return acc + parseFloat(m.cost || '0');
        }, 0);

        // Calculate days owned
        const start = tool.acquisitionDate ? new Date(tool.acquisitionDate) : tool.createdAt;
        const now = new Date();
        const daysOwned = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

        // Calculate days rented (sum of totalDaysActual)
        const daysRented = tool.rentals.reduce((acc, r) => {
            return acc + (r.totalDaysActual || 0);
        }, 0);

        const utilizationRate = Math.min(100, (daysRented / daysOwned) * 100);
        const totalCost = acquisitionCost + maintenanceCost;
        const roi = totalCost > 0 ? (revenue / totalCost) : 0;
        const roiPercent = roi * 100;

        // Dynamic Suggestion Logic
        let suggestion: RoiInsight['suggestion'] = {
            type: 'maintain',
            text: 'Desempenho Estável',
            action: 'Manter estratégia atual.'
        };

        if (maintenanceCost > (revenue * 0.4) && daysOwned > 90) {
            suggestion = {
                type: 'replace',
                text: 'Custo de Manutenção Crítico',
                action: 'Avaliar descarte ou substituição do ativo.'
            };
        } else if (utilizationRate > 80 && roi > 1.5) {
            suggestion = {
                type: 'increase',
                text: 'Alta Demanda e ROI',
                action: 'Aumentar diária em 10% a 15%.'
            };
        } else if (utilizationRate < 20 && daysOwned > 60) {
            suggestion = {
                type: 'decrease',
                text: 'Equipamento Zumbi (Ocioso)',
                action: 'Aplicar promoção ou revisar visibilidade.'
            };
        } else if (roi < 0.2 && daysOwned > 180) {
            suggestion = {
                type: 'alert',
                text: 'Retorno sobre Investimento Baixo',
                action: 'Rever precificação ou custo de aquisição.'
            };
        }

        return {
            toolId: tool.id,
            toolName: tool.name,
            categoryName: tool.category?.name || 'Geral',
            revenue,
            maintenanceCost,
            acquisitionCost,
            roi,
            roiPercent,
            utilizationRate,
            daysOwned,
            daysRented,
            status: tool.status,
            suggestion
        };
    });

    // Sort by ROI descending
    return insights.sort((a, b) => b.roi - a.roi);
}
