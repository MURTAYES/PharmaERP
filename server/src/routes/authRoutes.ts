import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController, loginSchema } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 failed/successful attempts per window
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);

export default router;
