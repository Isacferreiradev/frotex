import { Request, Response, NextFunction } from 'express';
import * as maintenanceService from '../services/maintenance.service';

export async function listLogs(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await maintenanceService.listMaintenanceLogs(req.user!.tenantId, {});
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function createLog(req: Request, res: Response, next: NextFunction) {
    try {
        const body = maintenanceService.maintenanceLogSchema.parse(req.body);
        const data = await maintenanceService.createMaintenanceLog(req.user!.tenantId, req.user!.userId, body);
        res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
}

export async function toolsDue(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await maintenanceService.getToolsDueForMaintenance(req.user!.tenantId);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}
