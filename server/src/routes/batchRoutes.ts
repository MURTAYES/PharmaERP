import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { receiveBatch, getBatchesByItem, updateBatchCost } from '../controllers/batchController';

const router = Router();

router.use(authenticate);

router.post('/receive', receiveBatch);
router.get('/by-item/:itemId', getBatchesByItem);
router.put('/:id/cost', roleGuard('owner'), updateBatchCost);

export default router;
