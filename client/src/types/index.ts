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
