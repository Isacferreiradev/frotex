import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { checklists, rentals } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { storageService } from '../services/storage.service';

export async function createChecklist(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = (req.user as any).tenantId;
        const inspectorId = (req.user as any).userId || (req.user as any).id;
        const { rentalId, type, condition, items, photos, notes, signatureUrl } = req.body;

        const [checklist] = await db.insert(checklists).values({
            tenantId,
            rentalId,
            type,
            condition,
            items: items || [],
            photos: photos || [],
            notes,
            signatureUrl,
            inspectorId,
        }).returning();

        res.status(201).json({ success: true, data: checklist });
    } catch (err) { next(err); }
}

export async function getChecklistsByRental(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = (req.user as any).tenantId;
        const { rentalId } = req.params;

        const data = await db.query.checklists.findMany({
            where: and(eq(checklists.tenantId, tenantId), eq(checklists.rentalId, rentalId)),
            orderBy: (c, { desc }) => [desc(c.createdAt)],
        });

        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function uploadEvidence(req: Request, res: Response, next: NextFunction) {
    try {
        const file = (req as any).file;
        if (!file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const url = await storageService.upload(
            file.buffer,
            file.originalname,
            file.mimetype
        );

        res.json({ success: true, url });
    } catch (err) { next(err); }
}


