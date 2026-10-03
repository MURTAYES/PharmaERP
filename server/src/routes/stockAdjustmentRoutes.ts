import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import {
  transferStock,
  writeOffStock,
  getStockMovements,
} from '../controllers/stockAdjustmentController.js';

const router = Router();

router.use(authenticate);

router.post('/transfer', roleGuard('owner'), transferStock);
router.post('/write-off', roleGuard('owner'), writeOffStock);
router.get('/movements', getStockMovements);

export default router;
