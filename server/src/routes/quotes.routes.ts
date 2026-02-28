import { Router } from 'express';
import * as quotesCtrl from '../controllers/quotes.controller';

const router = Router();

router.get('/', quotesCtrl.list);
router.get('/:id', quotesCtrl.get);
router.post('/', quotesCtrl.create);
router.put('/:id/status', quotesCtrl.updateStatus);

router.post('/:id/convert', quotesCtrl.convert);

export default router;

