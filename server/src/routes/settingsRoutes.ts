import { Router } from 'express';
import { settingsController, updateSettingsSchema } from '../controllers/settingsController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

// GET is accessible by any authenticated user (pharmacist or owner)
router.get('/', authMiddleware, settingsController.getSettings);

// PUT is restricted to Owner only
router.put(
  '/',
  authMiddleware,
  roleGuard(['owner']),
  validateBody(updateSettingsSchema),
  settingsController.updateSettings
);

export default router;
