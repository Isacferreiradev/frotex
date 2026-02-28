import { Request, Response, NextFunction } from 'express';
import * as communicationsService from '../services/communications.service';

export async function list(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await communicationsService.listCommunications(req.user!.tenantId, req.params.customerId);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
    try {
        const body = communicationsService.createCommunicationSchema.parse(req.body);
        const data = await communicationsService.createCommunication(req.user!.tenantId, req.user!.userId, body);
        res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
}
