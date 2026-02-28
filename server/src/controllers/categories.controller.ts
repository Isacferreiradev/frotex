import { Request, Response, NextFunction } from 'express';
import * as catService from '../services/categories.service';

export async function list(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await catService.listCategories(req.user!.tenantId);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
    try {
        const body = catService.categorySchema.parse(req.body);
        const data = await catService.createCategory(req.user!.tenantId, body);
        res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
    try {
        const body = catService.categorySchema.partial().parse(req.body);
        const data = await catService.updateCategory(req.user!.tenantId, req.params.id, body);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
    try {
        await catService.deleteCategory(req.user!.tenantId, req.params.id);
        res.json({ success: true });
    } catch (err) { next(err); }
}
