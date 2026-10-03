import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getBatchesForItem,
  checkout,
  getInvoices,
  getInvoiceById,
} from '../controllers/posController.js';
import {
  saveHeldBill,
  getHeldBills,
  getHeldBillById,
  deleteHeldBill,
} from '../controllers/heldBillController.js';

export const posRouter = Router();

// Protect all POS endpoints with authentication
posRouter.use(requireAuth);

// FEFO Batches & Availability
posRouter.get('/items/:itemId/batches', getBatchesForItem);

// Atomic Checkout
posRouter.post('/checkout', checkout);

// Invoice Lookups
posRouter.get('/invoices', getInvoices);
posRouter.get('/invoices/:id', getInvoiceById);

// Held Bills
posRouter.post('/held-bills', saveHeldBill);
posRouter.get('/held-bills', getHeldBills);
posRouter.get('/held-bills/:id', getHeldBillById);
posRouter.delete('/held-bills/:id', deleteHeldBill);
