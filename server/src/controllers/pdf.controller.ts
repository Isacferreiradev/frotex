import { Request, Response, NextFunction } from 'express';
import * as pdfService from '../services/pdf.service';

export async function downloadContract(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = req.user!.tenantId;
        const { id } = req.params;

        const stream = await pdfService.generateRentalPdf(tenantId, id);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=contrato-locacao-${id}.pdf`);

        stream.pipe(res);
    } catch (err) {
        next(err);
    }
}
