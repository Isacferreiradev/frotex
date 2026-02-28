import { Request, Response, NextFunction } from 'express';
import * as paymentsService from '../services/payments.service';

export async function list(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await paymentsService.listPayments(req.user!.tenantId);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
    try {
        const body = paymentsService.paymentSchema.parse(req.body);
        const data = await paymentsService.createPayment(req.user!.tenantId, req.user!.userId, body);
        res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await paymentsService.getPayment(req.user!.tenantId, req.params.id);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}
