import mongoose, { Types } from 'mongoose';
import Decimal from 'decimal.js';
import { Invoice, IInvoice } from '../models/Invoice.js';
import { CreditNote, ICreditNote, ICreditNoteLineItem } from '../models/CreditNote.js';
import { Batch } from '../models/Batch.js';
import { StockMovement } from '../models/StockMovement.js';
import { getNextSequence } from '../models/Counter.js';
import {
  calculateLineItem,
  calculateRefundPricing,
  RefundLineInput,
} from '../utils/pricingEngine.js';

export interface SalesReturnItemInput {
  itemId: string;
  batchId: string;
  unit: 'piece' | 'strip' | 'box';
  quantity: number;
  destinationBucket: 'sellable' | 'damaged' | 'expired';
}

export interface ProcessSalesReturnInput {
  invoiceId: string;
  lines: SalesReturnItemInput[];
  refundMethod: 'cash' | 'original_payment';
  reasonCategory: string;
  reasonDetail: string;
  userId: string;
  userName: string;
}

export interface InvoiceLineReturnStatus {
  itemId: string;
  tradeName: string;
  genericName: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  unit: 'piece' | 'strip' | 'box';
  unitHierarchySnapshot: {
    piecesPerStrip: number;
    stripsPerBox: number;
  };
  soldQuantity: number;
  soldQuantityPieces: number;
  alreadyReturnedPieces: number;
  remainingReturnablePieces: number;
  unitPrice: string;
  unitPricePerPiece: string;
  lineTotal: string;
}

export interface InvoiceReturnSummary {
  invoice: any;
  lineStatuses: InvoiceLineReturnStatus[];
  pastCreditNotes: any[];
  canReturn: boolean;
}

export class ReturnService {
  /**
   * Fetches an invoice and computes remaining returnable quantities per line item.
   */
  async getInvoiceReturnSummary(invoiceId: string): Promise<InvoiceReturnSummary> {
    if (!Types.ObjectId.isValid(invoiceId)) {
      throw new Error('Invalid Invoice ID');
    }

    const invoice = await Invoice.findById(invoiceId).lean();
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const pastCreditNotes = await CreditNote.find({ invoiceId }).sort({ createdAt: -1 }).lean();

    // Map already returned pieces per batch
    const returnedPiecesMap = new Map<string, number>();
    for (const cn of pastCreditNotes) {
      for (const line of cn.lines) {
        const key = `${line.itemId.toString()}_${line.batchId.toString()}`;
        const prev = returnedPiecesMap.get(key) || 0;
        returnedPiecesMap.set(key, prev + line.returnedQuantityPieces);
      }
    }

    let hasAnyReturnable = false;

    const lineStatuses: InvoiceLineReturnStatus[] = invoice.lines.map((l: any) => {
      const key = `${l.itemId.toString()}_${l.batchId.toString()}`;
      const alreadyReturned = returnedPiecesMap.get(key) || 0;
      const remaining = Math.max(0, l.quantityPieces - alreadyReturned);

      if (remaining > 0) hasAnyReturnable = true;

      return {
        itemId: l.itemId.toString(),
        tradeName: l.tradeName,
        genericName: l.genericName,
        batchId: l.batchId.toString(),
        batchNumber: l.batchNumber,
        expiryDate: l.expiryDate ? new Date(l.expiryDate).toISOString() : '',
        unit: l.unit,
        unitHierarchySnapshot: l.unitHierarchySnapshot,
        soldQuantity: l.quantity,
        soldQuantityPieces: l.quantityPieces,
        alreadyReturnedPieces: alreadyReturned,
        remainingReturnablePieces: remaining,
        unitPrice: l.unitPrice ? l.unitPrice.toString() : '0.00',
        unitPricePerPiece: l.unitPricePerPiece ? l.unitPricePerPiece.toString() : '0.00',
        lineTotal: l.lineTotal ? l.lineTotal.toString() : '0.00',
      };
    });

    return {
      invoice,
      lineStatuses,
      pastCreditNotes,
      canReturn: hasAnyReturnable,
    };
  }

  /**
   * Processes a sales return atomically inside a MongoDB transaction.
   */
  async processSalesReturn(input: ProcessSalesReturnInput): Promise<{ creditNote: ICreditNote }> {
    if (!input.lines || input.lines.length === 0) {
      throw new Error('At least one line item must be returned');
    }

    if (!input.reasonCategory || !input.reasonDetail?.trim()) {
      throw new Error('Mandatory reason category and explanation note are required');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const invoice = await Invoice.findById(input.invoiceId).session(session);
      if (!invoice) {
        throw new Error('Target invoice not found');
      }

      // Fetch all past credit notes for this invoice within transaction
      const pastCreditNotes = await CreditNote.find({ invoiceId: invoice._id }).session(session);
      const returnedPiecesMap = new Map<string, number>();
      for (const cn of pastCreditNotes) {
        for (const line of cn.lines) {
          const key = `${line.itemId.toString()}_${line.batchId.toString()}`;
          const prev = returnedPiecesMap.get(key) || 0;
          returnedPiecesMap.set(key, prev + line.returnedQuantityPieces);
        }
      }

      const creditNoteLines: ICreditNoteLineItem[] = [];
      const refundLineInputs: RefundLineInput[] = [];

      let totalReturnedInThisTx = 0;

      for (const itemInput of input.lines) {
        const matchingInvoiceLine = invoice.lines.find(
          (l: any) =>
            l.itemId.toString() === itemInput.itemId &&
            l.batchId.toString() === itemInput.batchId
        );

        if (!matchingInvoiceLine) {
          throw new Error(
            `Medicine (Item: ${itemInput.itemId}, Batch: ${itemInput.batchId}) was not part of this invoice`
          );
        }

        // Calculate piece conversion for the returned quantity
        const calc = calculateLineItem({
          unitPrice: matchingInvoiceLine.unitPrice.toString(),
          quantity: itemInput.quantity,
          unit: itemInput.unit,
          unitHierarchy: matchingInvoiceLine.unitHierarchySnapshot,
        });

        const key = `${itemInput.itemId}_${itemInput.batchId}`;
        const alreadyReturned = returnedPiecesMap.get(key) || 0;
        const availableToReturn = matchingInvoiceLine.quantityPieces - alreadyReturned;

        if (calc.quantityPieces > availableToReturn) {
          throw new Error(
            `Cannot return ${calc.quantityPieces} pcs of ${matchingInvoiceLine.tradeName}. Max returnable: ${availableToReturn} pcs.`
          );
        }

        // Update returned map for duplicate lines inside same request
        returnedPiecesMap.set(key, alreadyReturned + calc.quantityPieces);
        totalReturnedInThisTx += calc.quantityPieces;

        // Calculate returned line total using sold unit price
        const unitPricePerPieceDec = new Decimal(matchingInvoiceLine.unitPricePerPiece.toString());
        const returnedLineTotalDec = unitPricePerPieceDec.times(calc.quantityPieces);

        creditNoteLines.push({
          itemId: matchingInvoiceLine.itemId,
          tradeName: matchingInvoiceLine.tradeName,
          genericName: matchingInvoiceLine.genericName,
          batchId: matchingInvoiceLine.batchId,
          batchNumber: matchingInvoiceLine.batchNumber,
          expiryDate: matchingInvoiceLine.expiryDate,
          unit: itemInput.unit,
          unitHierarchySnapshot: matchingInvoiceLine.unitHierarchySnapshot,
          returnedQuantity: calc.quantity,
          returnedQuantityPieces: calc.quantityPieces,
          originalUnitPrice: Types.Decimal128.fromString(matchingInvoiceLine.unitPrice.toString()),
          originalUnitPricePerPiece: Types.Decimal128.fromString(
            matchingInvoiceLine.unitPricePerPiece.toString()
          ),
          returnedLineTotal: Types.Decimal128.fromString(returnedLineTotalDec.toFixed(2)),
          destinationBucket: itemInput.destinationBucket || 'sellable',
        });

        refundLineInputs.push({
          unitPricePerPiece: matchingInvoiceLine.unitPricePerPiece.toString(),
          returnedQuantityPieces: calc.quantityPieces,
        });

        // Atomically increment batch bucket
        const bucketField =
          itemInput.destinationBucket === 'damaged'
            ? 'qtyDamaged'
            : itemInput.destinationBucket === 'expired'
            ? 'qtyExpired'
            : 'qtySellable';

        const updatedBatch = await Batch.findByIdAndUpdate(
          matchingInvoiceLine.batchId,
          { $inc: { [bucketField]: calc.quantityPieces } },
          { new: true, session }
        );

        if (!updatedBatch) {
          throw new Error(`Batch ${matchingInvoiceLine.batchNumber} not found for stock restoration`);
        }

        // Record stock movement ledger entry
        await StockMovement.create(
          [
            {
              batchId: matchingInvoiceLine.batchId,
              itemId: matchingInvoiceLine.itemId,
              type: 'RETURN_RESTOCK',
              qtyChangePieces: calc.quantityPieces,
              bucketFrom: undefined,
              bucketTo: itemInput.destinationBucket || 'sellable',
              reasonCategory: 'Customer Return Quarantine',
              reasonDetail: `Sales Return on Invoice ${invoice.invoiceNumber}. Note: ${input.reasonDetail}`,
              userId: new Types.ObjectId(input.userId),
              timestamp: new Date(),
            },
          ],
          { session }
        );
      }

      // Compute proportional refund math
      const originalCharges = (invoice.charges || []).map((c: any) => ({
        name: c.name,
        type: c.type,
        rate: c.rate.toString(),
      }));

      const refundPricing = calculateRefundPricing(
        refundLineInputs,
        invoice.subtotal.toString(),
        invoice.discountAmount.toString(),
        originalCharges
      );

      // Generate sequential Credit Note Number
      const creditNoteNumber = await getNextSequence('creditNoteNumber', 'CN', 6, session);

      // Create Credit Note
      const [creditNote] = await CreditNote.create(
        [
          {
            creditNoteNumber,
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customerName,
            customerPhone: invoice.customerPhone,
            processedBy: new Types.ObjectId(input.userId),
            processedByName: input.userName,
            lines: creditNoteLines,
            subtotalRefund: Types.Decimal128.fromString(refundPricing.subtotalRefund),
            discountRefund: Types.Decimal128.fromString(refundPricing.discountRefund),
            chargesRefund: refundPricing.chargesRefund.map((c: any) => ({
              name: c.name,
              type: c.type,
              rate: Types.Decimal128.fromString(c.rate),
              refundAmount: Types.Decimal128.fromString(c.refundAmount),
            })),
            totalChargesRefund: Types.Decimal128.fromString(refundPricing.totalChargesRefund),
            grandTotalRefund: Types.Decimal128.fromString(refundPricing.grandTotalRefund),
            refundMethod: input.refundMethod || 'cash',
            reasonCategory: input.reasonCategory,
            reasonDetail: input.reasonDetail,
          },
        ],
        { session }
      );

      // Check total returned vs invoice total pieces to set status
      let totalSoldPieces = 0;
      invoice.lines.forEach((l: any) => (totalSoldPieces += l.quantityPieces));

      let totalReturnedAllTime = 0;
      for (const val of returnedPiecesMap.values()) {
        totalReturnedAllTime += val;
      }

      if (totalReturnedAllTime >= totalSoldPieces) {
        invoice.status = 'RETURNED_FULL';
      } else {
        invoice.status = 'RETURNED_PARTIAL';
      }

      await invoice.save({ session });

      await session.commitTransaction();
      return { creditNote };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export const returnService = new ReturnService();
