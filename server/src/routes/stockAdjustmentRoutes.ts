import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import {
  transferStock,
  writeOffStock,
  getStockMovements,
} from '../controllers/stockAdjustmentController';

const router = Router();

router.use(authenticate);

router.post('/transfer', roleGuard('owner'), transferStock);
router.post('/write-off', roleGuard('owner'), writeOffStock);
router.get('/movements', getStockMovements);

export default router;
