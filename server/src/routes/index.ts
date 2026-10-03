import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import auditRoutes from './auditRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/settings', settingsRoutes);
router.use('/audit', auditRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'PharmaERP API' });
});

export default router;
