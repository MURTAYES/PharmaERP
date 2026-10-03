import { Request, Response } from 'express';
import { returnService } from '../services/returnService.js';
import { supplierReturnService } from '../services/supplierReturnService.js';
import { Invoice } from '../models/Invoice.js';
import { CreditNote } from '../models/CreditNote.js';

export class ReturnController {
  /**
   * Search past invoices for customer returns.
   */
  async searchInvoicesForReturn(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;
      const queryStr = (search as string)?.trim() || '';

      if (!queryStr) {
        res.status(200).json({ invoices: [] });
        return;
      }

      const filter: any = {
        $or: [
          { invoiceNumber: { $regex: queryStr, $options: 'i' } },
          { customerPhone: { $regex: queryStr, $options: 'i' } },
          { customerName: { $regex: queryStr, $options: 'i' } },
        ],
      };

      const invoices = await Invoice.find(filter)
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      res.status(200).json({ invoices });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to search invoices' });
    }
  }

  /**
   * Get return summary and remaining returnable pieces for an invoice.
   */
  async getInvoiceReturnSummary(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const summary = await returnService.getInvoiceReturnSummary(id);
      res.status(200).json(summary);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to fetch invoice return summary' });
    }
  }

  /**
   * Process a customer sales return and issue a Credit Note.
   */
  async processSalesReturn(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { invoiceId, lines, refundMethod, reasonCategory, reasonDetail } = req.body;

      const result = await returnService.processSalesReturn({
        invoiceId,
        lines,
        refundMethod,
        reasonCategory,
        reasonDetail,
        userId: user.id || user._id,
        userName: user.fullName || user.username,
      });

      res.status(201).json({
        message: 'Sales return processed successfully',
        creditNote: result.creditNote,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to process sales return' });
    }
  }

  /**
   * List all credit notes with pagination.
   */
  async getCreditNotes(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
      const search = (req.query.search as string)?.trim();
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (search) {
        filter.$or = [
          { creditNoteNumber: { $regex: search, $options: 'i' } },
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { customerPhone: { $regex: search, $options: 'i' } },
          { customerName: { $regex: search, $options: 'i' } },
        ];
      }

      const [creditNotes, total] = await Promise.all([
        CreditNote.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        CreditNote.countDocuments(filter),
      ]);

      res.status(200).json({
        creditNotes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch credit notes' });
    }
  }

  /**
   * Get single credit note detail for receipt printing.
   */
  async getCreditNoteById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const creditNote = await CreditNote.findById(id).lean();
      if (!creditNote) {
        res.status(404).json({ error: 'Credit Note not found' });
        return;
      }
      res.status(200).json({ creditNote });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to fetch credit note' });
    }
  }

  /**
   * Process a supplier return voucher (Owner only).
   */
  async createSupplierReturn(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { supplierName, supplierInvoiceRef, lines, reasonCategory, reasonDetail } = req.body;

      const result = await supplierReturnService.createSupplierReturn({
        supplierName,
        supplierInvoiceRef,
        lines,
        reasonCategory,
        reasonDetail,
        userId: user.id || user._id,
        userName: user.fullName || user.username,
      });

      res.status(201).json({
        message: 'Supplier return processed successfully',
        supplierReturn: result.supplierReturn,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to process supplier return' });
    }
  }

  /**
   * List supplier returns (Owner only).
   */
  async getSupplierReturns(req: Request, res: Response): Promise<void> {
    try {
      const result = await supplierReturnService.getSupplierReturns(req.query);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch supplier returns' });
    }
  }
}

export const returnController = new ReturnController();
