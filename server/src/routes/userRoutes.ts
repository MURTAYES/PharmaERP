import { Router } from 'express';
import {
  userController,
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

// All user management routes require authentication and Owner role
router.use(authMiddleware);
router.use(roleGuard(['owner']));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', validateBody(createUserSchema), userController.createUser);
router.put('/:id', validateBody(updateUserSchema), userController.updateUser);
router.post('/:id/reset-password', validateBody(resetPasswordSchema), userController.resetPassword);

export default router;
