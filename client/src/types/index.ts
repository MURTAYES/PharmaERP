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
