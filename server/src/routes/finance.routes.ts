import { Router } from 'express';
import * as financeCtrl from '../controllers/finance.controller';

const router = Router();

router.get('/ping', (req, res) => res.json({ success: true, message: 'finance routes active' }));
router.get('/stats', financeCtrl.getStats);
router.get('/expenses', financeCtrl.listExpenses);
router.post('/expenses', financeCtrl.createExpense);
router.get('/other-revenues', financeCtrl.listOtherRevenues);
router.post('/other-revenues', financeCtrl.createOtherRevenue);

export default router;
