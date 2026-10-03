export type UserRole = 'owner' | 'pharmacist';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GlobalCharge {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  rate: number;
  isActive: boolean;
}

export interface ExpiryAlertWindows {
  greenDays: number;
  yellowDays: number;
  redDays: number;
}

export interface PharmacySettings {
  pharmacyName: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  currencySymbol: string;
  receiptHeader: string;
  receiptFooter: string;
  receiptWidth: '80mm' | '58mm';
  charges: GlobalCharge[];
  expiryAlertWindows: ExpiryAlertWindows;
  categories: string[];
}

export interface AuditLogItem {
  _id: string;
  timestamp: string;
  userId?: string;
  username: string;
  role?: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface UnitHierarchy {
  baseUnit: 'piece';
  piecesPerStrip: number;
  stripsPerBox: number;
}

export interface Item {
  _id: string;
  tradeName: string;
  genericName: string;
  itemCode: string;
  category: string;
  manufacturer: string;
  shelfLocation?: string;
  unitHierarchy: UnitHierarchy;
  mrpPerPiece: string;
  stripPrice?: string;
  boxPrice?: string;
  totalPiecesPerBox?: number;
  lowStockThresholdPieces: number;
  totalSellablePieces?: number;
  totalDamagedPieces?: number;
  totalExpiredPieces?: number;
  batchCount?: number;
  earliestExpiry?: string;
  isLowStock?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  _id: string;
  itemId: string | Item;
  batchNumber: string;
  expiryDate: string;
  qtySellable: number;
  qtyDamaged: number;
  qtyExpired: number;
  purchasePricePerPiece?: string;
  isCostMissing: boolean;
  supplierName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  _id: string;
  batchId: string | Batch;
  itemId: string | Item;
  type: 'RECEIVE' | 'ADJUST_TRANSFER' | 'WRITE_OFF' | 'SALE_DEDUCT' | 'RETURN_RESTOCK';
  qtyChangePieces: number;
  bucketFrom?: 'sellable' | 'damaged' | 'expired';
  bucketTo?: 'sellable' | 'damaged' | 'expired' | 'write_off';
  reasonCategory?: string;
  reasonDetail?: string;
  userId: string | User;
  timestamp: string;
}

export interface AlertSummary {
  expiredCount: number;
  critical30Count: number;
  warning60Count: number;
  notice90Count: number;
  lowStockCount: number;
  totalAlerts: number;
}

export interface InvoiceLineItem {
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
  quantity: number;
  quantityPieces: number;
  unitPrice: string;
  unitPricePerPiece: string;
  lineTotal: string;
  purchaseCostPerPiece?: string;
  isPriceOverridden: boolean;
  originalUnitPrice?: string;
  priceOverrideVariance?: string;
  isNonFefo: boolean;
  suggestedFefoBatchNumber?: string;
}

export interface InvoiceCharge {
  name: string;
  type: 'percentage' | 'fixed';
  rate: string;
  amount: string;
}

export interface InvoicePayment {
  method: 'cash' | 'card' | 'mfs' | 'split';
  cashTendered?: string;
  changeDue?: string;
  mfsProvider?: 'bkash' | 'nagad' | 'rocket' | 'upay';
  mfsTransactionId?: string;
  cardLast4?: string;
  cardType?: string;
  splitDetails?: {
    cashAmount?: string;
    cardAmount?: string;
    mfsAmount?: string;
  };
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  billedBy: string;
  billedByName: string;
  customerName?: string;
  customerPhone?: string;
  lines: InvoiceLineItem[];
  subtotal: string;
  discountPercent: string;
  discountAmount: string;
  charges: InvoiceCharge[];
  totalCharges: string;
  grandTotal: string;
  payment: InvoicePayment;
  status: 'PAID' | 'RETURNED_PARTIAL' | 'RETURNED_FULL';
  hasPriceOverride: boolean;
  hasNonFefoBatch: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HeldBillLine {
  itemId: string;
  tradeName: string;
  genericName: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  unit: 'piece' | 'strip' | 'box';
  unitHierarchy: {
    piecesPerStrip: number;
    stripsPerBox: number;
  };
  quantity: number;
  quantityPieces: number;
  unitPrice: string;
  mrpPerPiece: string;
  isPriceOverridden: boolean;
  originalUnitPrice?: string;
  isNonFefo: boolean;
  suggestedFefoBatchNumber?: string;
}

export interface HeldBill {
  _id: string;
  billReference: string;
  heldBy: string;
  heldByName: string;
  customerName?: string;
  customerPhone?: string;
  lines: HeldBillLine[];
  discountPercent: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

