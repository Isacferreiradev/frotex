import { Router } from 'express';
import * as catCtrl from '../controllers/categories.controller';

const router = Router();

router.get('/', catCtrl.list);
router.post('/', catCtrl.create);
router.put('/:id', catCtrl.update);
router.delete('/:id', catCtrl.remove);

export default router;
