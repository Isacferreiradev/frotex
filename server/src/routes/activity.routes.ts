import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as activityService from '../services/activity.service';

const router = Router();

router.get('/logs', authenticate, async (req: any, res: Response) => {
    const { entityId, entityType } = req.query as Record<string, string>;
    const logs = await activityService.getLogs(req.user.tenantId, { entityId, entityType });
    res.json({ success: true, data: logs });
});

export default router;
