import { Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Item } from '../models/Item.js';
import { Batch } from '../models/Batch.js';
import { Invoice, IInvoiceLineItem } from '../models/Invoice.js';
import { StockMovement } from '../models/StockMovement.js';
import { AuditLog } from '../models/AuditLog.js';
import { Counter, getNextSequence } from '../models/Counter.js';
import { Settings } from '../models/Settings.js';
import { calculateLineItem, calculateInvoiceTotals } from '../utils/pricingEngine.js';

// Validation schema for checkout line items
const checkoutLineItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  batchId: z.string().min(1, 'Batch ID is required'),
  unit: z.enum(['piece', 'strip', 'box']),
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
  unitPrice: z.union([z.string(), z.number()]).optional(), // Overridden price if provided
});

// Validation schema for checkout payload
const checkoutSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  lines: z.array(checkoutLineItemSchema).min(1, 'At least one line item is required'),
  discountPercent: z.union([z.string(), z.number()]).default('0.00'),
  payment: z.object({
    method: z.enum(['cash', 'card', 'mfs', 'split']),
    cashTendered: z.union([z.string(), z.number()]).optional(),
    changeDue: z.union([z.string(), z.number()]).optional(),
    mfsProvider: z.enum(['bkash', 'nagad', 'rocket', 'upay']).optional(),
    mfsTransactionId: z.string().optional(),
    cardLast4: z.string().optional(),
    cardType: z.string().optional(),
    splitDetails: z
      .object({
        cashAmount: z.union([z.string(), z.number()]).optional(),
        cardAmount: z.union([z.string(), z.number()]).optional(),
        mfsAmount: z.union([z.string(), z.number()]).optional(),
      })
      .optional(),
  }),
});

/**
 * GET /api/pos/items/:itemId/batches
 * Fetches available sellable batches for an item sorted by expiry date ascending (FEFO).
 * Marks the first active batch as isFefo: true.
 */
export async function getBatchesForItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { itemId } = req.params;
    if (!Types.ObjectId.isValid(itemId)) {
      res.status(400).json({ error: 'Invalid item ID' });
      return;
    }

    const batches = await Batch.find({
      itemId,
      qtySellable: { $gt: 0 },
    })
      .sort({ expiryDate: 1 })
      .lean();

    const formatted = batches.map((b, idx) => ({
      ...b,
      isFefo: idx === 0,
    }));

    res.json({ batches: formatted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch batches for item' });
  }
}

/**
 * POST /api/pos/checkout
 * Executes an atomic multi-document transaction to create an invoice and deduct inventory.
 */
export async function checkout(req: AuthenticatedRequest, res: Response): Promise<void> {
  const parseResult = checkoutSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid checkout data',
      details: parseResult.error.format(),
    });
    return;
  }

  const { customerName, customerPhone, lines: requestedLines, discountPercent, payment } =
    parseResult.data;

  // Retrieve global pharmacy settings for active invoice charges
  const settings = await Settings.findOne();
  const activeCharges = settings?.charges?.filter((c) => c.isActive) || [];

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const invoiceLines: IInvoiceLineItem[] = [];
    let hasAnyPriceOverride = false;
    let hasAnyNonFefo = false;

    // Process and validate each line item
    for (const reqLine of requestedLines) {
      const item = await Item.findById(reqLine.itemId).session(session);
      if (!item || !item.isActive) {
        throw new Error(`Medicine item not found or inactive: ${reqLine.itemId}`);
      }

      const batch = await Batch.findById(reqLine.batchId).session(session);
      if (!batch) {
        throw new Error(`Batch not found: ${reqLine.batchId}`);
      }

      // Check FEFO status against earlier expiring sellable batches
      const earlierBatches = await Batch.find({
        itemId: item._id,
        _id: { $ne: batch._id },
        qtySellable: { $gt: 0 },
        expiryDate: { $lt: batch.expiryDate },
      })
        .sort({ expiryDate: 1 })
        .session(session);

      const isNonFefo = earlierBatches.length > 0;
      if (isNonFefo) hasAnyNonFefo = true;

      // Determine standard catalog unit price
      const standardMrpPerPiece = item.mrpPerPiece.toString();
      const pcsPerStrip = item.unitHierarchy.piecesPerStrip || 1;
      const stripsPerBox = item.unitHierarchy.stripsPerBox || 1;
      const totalPcsBox = pcsPerStrip * stripsPerBox;

      let catalogUnitPrice = standardMrpPerPiece;
      if (reqLine.unit === 'strip') {
        catalogUnitPrice = (parseFloat(standardMrpPerPiece) * pcsPerStrip).toFixed(2);
      } else if (reqLine.unit === 'box') {
        catalogUnitPrice = (parseFloat(standardMrpPerPiece) * totalPcsBox).toFixed(2);
      }

      // Check if price was overridden
      const chargedUnitPrice = reqLine.unitPrice !== undefined ? String(reqLine.unitPrice) : catalogUnitPrice;
      const isPriceOverridden =
        parseFloat(chargedUnitPrice) !== parseFloat(catalogUnitPrice);
      if (isPriceOverridden) hasAnyPriceOverride = true;

      const priceOverrideVariance = isPriceOverridden
        ? (parseFloat(chargedUnitPrice) - parseFloat(catalogUnitPrice)).toFixed(2)
        : '0.00';

      // Calculate converted piece quantity and line total
      const calculatedLine = calculateLineItem({
        unitPrice: chargedUnitPrice,
        quantity: reqLine.quantity,
        unit: reqLine.unit,
        unitHierarchy: {
          piecesPerStrip: pcsPerStrip,
          stripsPerBox: stripsPerBox,
        },
      });

      // Conditional atomic stock deduction ($gte guard)
      const updatedBatch = await Batch.findOneAndUpdate(
        {
          _id: batch._id,
          qtySellable: { $gte: calculatedLine.quantityPieces },
        },
        {
          $inc: { qtySellable: -calculatedLine.quantityPieces },
        },
        { session, new: true }
      );

      if (!updatedBatch) {
        throw new Error(
          `Insufficient sellable stock for ${item.tradeName} (Batch ${batch.batchNumber}). Requested ${calculatedLine.quantityPieces} pcs, but only ${batch.qtySellable} pcs available.`
        );
      }

      // Prepare snapshot line item
      invoiceLines.push({
        itemId: item._id,
        tradeName: item.tradeName,
        genericName: item.genericName,
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        unit: reqLine.unit,
        unitHierarchySnapshot: {
          piecesPerStrip: pcsPerStrip,
          stripsPerBox: stripsPerBox,
        },
        quantity: calculatedLine.quantity,
        quantityPieces: calculatedLine.quantityPieces,
        unitPrice: Types.Decimal128.fromString(calculatedLine.unitPrice),
        unitPricePerPiece: Types.Decimal128.fromString(calculatedLine.unitPricePerPiece),
        lineTotal: Types.Decimal128.fromString(calculatedLine.lineTotal),
        purchaseCostPerPiece: batch.purchasePricePerPiece,
        isPriceOverridden,
        originalUnitPrice: Types.Decimal128.fromString(catalogUnitPrice),
        priceOverrideVariance: Types.Decimal128.fromString(priceOverrideVariance),
        isNonFefo,
        suggestedFefoBatchNumber: isNonFefo ? earlierBatches[0].batchNumber : undefined,
      });

      // Record StockMovement entry
      await StockMovement.create(
        [
          {
            batchId: batch._id,
            itemId: item._id,
            type: 'SALE_DEDUCT',
            qtyChangePieces: -calculatedLine.quantityPieces,
            bucketFrom: 'sellable',
            reasonDetail: `POS Invoice checkout: ${calculatedLine.quantity} ${reqLine.unit}(s)`,
            userId: new Types.ObjectId(req.user!.userId),
            timestamp: new Date(),
          },
        ],
        { session }
      );
    }

    // Compute invoice grand totals
    const calculatedTotals = calculateInvoiceTotals(
      invoiceLines.map((l) => ({ lineTotal: l.lineTotal.toString() })),
      discountPercent,
      activeCharges.map((c: any) => ({
        name: c.name,
        type: c.type,
        rate: c.rate.toString(),
        isActive: c.isActive,
      }))
    );

    // Get next sequential invoice number
    const invoiceNumber = await getNextSequence('invoiceNumber', 'INV', 6, session);

    // Format payment information
    const formattedPayment: any = {
      method: payment.method,
      cashTendered: payment.cashTendered
        ? Types.Decimal128.fromString(String(payment.cashTendered))
        : undefined,
      changeDue: payment.changeDue
        ? Types.Decimal128.fromString(String(payment.changeDue))
        : undefined,
      mfsProvider: payment.mfsProvider,
      mfsTransactionId: payment.mfsTransactionId,
      cardLast4: payment.cardLast4,
      cardType: payment.cardType,
    };

    if (payment.splitDetails) {
      formattedPayment.splitDetails = {
        cashAmount: payment.splitDetails.cashAmount
          ? Types.Decimal128.fromString(String(payment.splitDetails.cashAmount))
          : undefined,
        cardAmount: payment.splitDetails.cardAmount
          ? Types.Decimal128.fromString(String(payment.splitDetails.cardAmount))
          : undefined,
        mfsAmount: payment.splitDetails.mfsAmount
          ? Types.Decimal128.fromString(String(payment.splitDetails.mfsAmount))
          : undefined,
      };
    }

    // Create immutable invoice
    const [createdInvoice] = await Invoice.create(
      [
        {
          invoiceNumber,
          billedBy: new Types.ObjectId(req.user!.userId),
          billedByName: req.user!.username,
          customerName: customerName?.trim() || undefined,
          customerPhone: customerPhone?.trim() || undefined,
          lines: invoiceLines,
          subtotal: Types.Decimal128.fromString(calculatedTotals.subtotal),
          discountPercent: Types.Decimal128.fromString(calculatedTotals.discountPercent),
          discountAmount: Types.Decimal128.fromString(calculatedTotals.discountAmount),
          charges: calculatedTotals.charges.map((c) => ({
            name: c.name,
            type: c.type,
            rate: Types.Decimal128.fromString(c.rate),
            amount: Types.Decimal128.fromString(c.amount),
          })),
          totalCharges: Types.Decimal128.fromString(calculatedTotals.totalCharges),
          grandTotal: Types.Decimal128.fromString(calculatedTotals.grandTotal),
          payment: formattedPayment,
          status: 'PAID',
          hasPriceOverride: hasAnyPriceOverride,
          hasNonFefoBatch: hasAnyNonFefo,
        },
      ],
      { session }
    );

    // If price overrides exist, log an audit entry
    if (hasAnyPriceOverride) {
      await AuditLog.create(
        [
          {
            action: 'PRICE_OVERRIDE',
            entity: 'Invoice',
            entityId: createdInvoice._id,
            userId: new Types.ObjectId(req.user!.userId),
            username: req.user!.username,
            details: {
              invoiceNumber,
              grandTotal: calculatedTotals.grandTotal,
            },
            timestamp: new Date(),
          },
        ],
        { session }
      );
    }

    await session.commitTransaction();

    res.status(201).json({
      message: 'Checkout completed successfully',
      invoice: createdInvoice,
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message || 'Checkout failed' });
  } finally {
    session.endSession();
  }
}

/**
 * GET /api/pos/invoices
 * Lists paginated past invoices with search and date filters.
 */
export async function getInvoices(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const search = (req.query.search as string)?.trim();
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const query: any = {};

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch invoices' });
  }
}

/**
 * GET /api/pos/invoices/:id
 * Fetches single invoice snapshot by ID or Invoice Number.
 */
export async function getInvoiceById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    let invoice;
    if (Types.ObjectId.isValid(id)) {
      invoice = await Invoice.findById(id).lean();
    } else {
      invoice = await Invoice.findOne({ invoiceNumber: id.toUpperCase() }).lean();
    }

    if (!invoice) {
      res.status(400).json({ error: 'Invoice not found' });
      return;
    }

    res.json({ invoice });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch invoice' });
  }
}
