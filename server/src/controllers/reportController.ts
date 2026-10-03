import { Request, Response } from 'express';
import { reportService } from '../services/reportService.js';

export class ReportController {
  async getDashboardKPIs(_req: Request, res: Response): Promise<void> {
    try {
      const data = await reportService.getDashboardKPIs();
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate dashboard KPIs' });
    }
  }

  async getSalesSummary(req: Request, res: Response): Promise<void> {
    try {
      const data = await reportService.getSalesSummary(req.query);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate sales summary' });
    }
  }

  async getSalesByItem(req: Request, res: Response): Promise<void> {
    try {
      const data = await reportService.getSalesByItem(req.query);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate sales by item report' });
    }
  }

  async getProfitAndLoss(req: Request, res: Response): Promise<void> {
    try {
      const data = await reportService.getProfitAndLoss(req.query);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate profit and loss report' });
    }
  }

  async getPriceOverrides(req: Request, res: Response): Promise<void> {
    try {
      const data = await reportService.getPriceOverrides(req.query);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate price overrides report' });
    }
  }

  async getNonFefo(req: Request, res: Response): Promise<void> {
    try {
      const data = await reportService.getNonFefo(req.query);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate non-FEFO report' });
    }
  }

  async getStockValuation(_req: Request, res: Response): Promise<void> {
    try {
      const data = await reportService.getStockValuation();
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate stock valuation report' });
    }
  }

  async getReturnsReport(req: Request, res: Response): Promise<void> {
    try {
      const data = await reportService.getReturnsReport(req.query);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate returns report' });
    }
  }

  async getStockMovementLedger(req: Request, res: Response): Promise<void> {
    try {
      const data = await reportService.getStockMovementLedger(req.query);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate stock movement ledger' });
    }
  }
}

export const reportController = new ReportController();
