import { Request, Response } from 'express';
import * as intelligenceService from '../services/intelligence.service';

export async function getRoiInsights(req: Request, res: Response) {
    try {
        const tenantId = req.user!.tenantId; // Set by middleware
        const insights = await intelligenceService.getRoiInsights(tenantId);

        res.json({
            success: true,
            data: insights
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao buscar insights de inteligência'
        });
    }
}
