import { Router } from 'express';
import { reportController } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';

const router = Router();

router.use(requireAuth);

// Dashboard KPIs (Accessible to all authenticated staff)
router.get('/dashboard-kpis', reportController.getDashboardKPIs.bind(reportController));

// Owner-Only Detailed Reports
router.get('/sales-summary', requireRole(['owner']), reportController.getSalesSummary.bind(reportController));
router.get('/sales-by-item', requireRole(['owner']), reportController.getSalesByItem.bind(reportController));
router.get('/profit-loss', requireRole(['owner']), reportController.getProfitAndLoss.bind(reportController));
router.get('/price-overrides', requireRole(['owner']), reportController.getPriceOverrides.bind(reportController));
router.get('/non-fefo', requireRole(['owner']), reportController.getNonFefo.bind(reportController));
router.get('/stock-valuation', requireRole(['owner']), reportController.getStockValuation.bind(reportController));
router.get('/returns', requireRole(['owner']), reportController.getReturnsReport.bind(reportController));
router.get('/stock-ledger', requireRole(['owner']), reportController.getStockMovementLedger.bind(reportController));

export const reportRoutes = router;
