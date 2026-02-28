import { Router } from 'express';
import * as toolsCtrl from '../controllers/tools.controller';

const router = Router();

router.get('/', toolsCtrl.list);
router.get('/:id', toolsCtrl.get);
router.post('/', toolsCtrl.create);
router.put('/:id', toolsCtrl.update);
router.delete('/:id', toolsCtrl.remove);

export default router;
