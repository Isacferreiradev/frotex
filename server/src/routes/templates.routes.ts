import { Router } from 'express';
import * as templatesCtrl from '../controllers/templates.controller';

const router = Router();

router.get('/', templatesCtrl.list);
router.post('/', templatesCtrl.create);
router.get('/:id', templatesCtrl.get);
router.put('/:id', templatesCtrl.update);
router.delete('/:id', templatesCtrl.remove);

export default router;
