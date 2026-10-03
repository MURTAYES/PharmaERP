import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getAlertSummary, getExpiringBatches, getLowStockItems } from '../controllers/alertController';

const router = Router();

router.use(authenticate);

router.get('/summary', getAlertSummary);
router.get('/expiring', getExpiringBatches);
router.get('/low-stock', getLowStockItems);

export default router;
