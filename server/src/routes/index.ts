import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import auditRoutes from './auditRoutes.js';
import itemRoutes from './itemRoutes.js';
import batchRoutes from './batchRoutes.js';
import stockAdjustmentRoutes from './stockAdjustmentRoutes.js';
import alertRoutes from './alertRoutes.js';
import { posRouter } from './posRoutes.js';
import { returnRoutes } from './returnRoutes.js';
import { reportRoutes } from './reportRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/settings', settingsRoutes);
router.use('/audit', auditRoutes);
router.use('/items', itemRoutes);
router.use('/batches', batchRoutes);
router.use('/stock-adjustments', stockAdjustmentRoutes);
router.use('/alerts', alertRoutes);
router.use('/pos', posRouter);
router.use('/returns', returnRoutes);
router.use('/reports', reportRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'PharmaERP API' });
});

export default router;
