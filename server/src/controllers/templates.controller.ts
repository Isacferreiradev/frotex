import { Request, Response, NextFunction } from 'express';
import * as templatesService from '../services/templates.service';

export async function list(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await templatesService.listTemplates(req.user!.tenantId);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await templatesService.getTemplate(req.user!.tenantId, req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Template não encontrado' });
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
    try {
        const body = templatesService.templateSchema.parse(req.body);
        const data = await templatesService.createTemplate(req.user!.tenantId, body);
        res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
    try {
        const body = templatesService.templateSchema.partial().parse(req.body);
        const data = await templatesService.updateTemplate(req.user!.tenantId, req.params.id, body);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
    try {
        await templatesService.deleteTemplate(req.user!.tenantId, req.params.id);
        res.json({ success: true, message: 'Template excluído com sucesso' });
    } catch (err) { next(err); }
}
