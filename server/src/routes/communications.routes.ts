import { Router } from 'express';
import * as communicationsController from '../controllers/communications.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/:customerId', communicationsController.list);
router.post('/', communicationsController.create);

export default router;
