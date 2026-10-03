import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { receiveBatch, getBatchesByItem, updateBatchCost } from '../controllers/batchController.js';

const router = Router();

router.use(authenticate);

router.post('/receive', receiveBatch);
router.get('/by-item/:itemId', getBatchesByItem);
router.put('/:id/cost', roleGuard('owner'), updateBatchCost);

export default router;
