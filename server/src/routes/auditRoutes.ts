import { Router } from 'express';
import { auditController } from '../controllers/auditController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';

const router = Router();

// Audit logs are strictly restricted to Owner
router.get('/', authMiddleware, roleGuard(['owner']), auditController.getLogs);

export default router;
