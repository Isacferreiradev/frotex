import { Router } from 'express';
import * as paymentsCtrl from '../controllers/payments.controller';

const router = Router();

router.get('/', paymentsCtrl.list);
router.post('/', paymentsCtrl.create);
router.get('/:id', paymentsCtrl.get);

export default router;
