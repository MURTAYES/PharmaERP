import { Router } from 'express';
import { returnController } from '../controllers/returnController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';

const router = Router();

// Protect all return routes with auth
router.use(requireAuth);

// Sales Return Endpoints (Pharmacist + Owner)
router.get('/invoices/search', returnController.searchInvoicesForReturn.bind(returnController));
router.get('/invoices/:id/return-summary', returnController.getInvoiceReturnSummary.bind(returnController));
router.post('/sales', returnController.processSalesReturn.bind(returnController));
router.get('/credit-notes', returnController.getCreditNotes.bind(returnController));
router.get('/credit-notes/:id', returnController.getCreditNoteById.bind(returnController));

// Supplier Return Endpoints (Owner Only)
router.post('/supplier', requireRole(['owner']), returnController.createSupplierReturn.bind(returnController));
router.get('/supplier', requireRole(['owner']), returnController.getSupplierReturns.bind(returnController));

export const returnRoutes = router;
