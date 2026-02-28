import { Router } from 'express';
import * as maintenanceCtrl from '../controllers/maintenance.controller';

const router = Router();

router.get('/logs', maintenanceCtrl.listLogs);
router.post('/logs', maintenanceCtrl.createLog);
router.get('/tools-due', maintenanceCtrl.toolsDue);

export default router;
