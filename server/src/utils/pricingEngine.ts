import Decimal from 'decimal.js';

export interface UnitHierarchy {
  piecesPerStrip: number;
  stripsPerBox: number;
}

export interface LineItemInput {
  unitPrice: string | number;
  quantity: number;
  unit: 'piece' | 'strip' | 'box';
  unitHierarchy: UnitHierarchy;
}

export interface CalculatedLineItem {
  quantity: number;
  quantityPieces: number;
  unitPrice: string;
  unitPricePerPiece: string;
  lineTotal: string;
}

export interface ChargeInput {
  name: string;
  type: 'percentage' | 'fixed';
  rate: string | number;
  isActive?: boolean;
}

export interface CalculatedCharge {
  name: string;
  type: 'percentage' | 'fixed';
  rate: string;
  amount: string;
}

export interface CalculatedInvoiceTotals {
  subtotal: string;
  discountPercent: string;
  discountAmount: string;
  netAfterDiscount: string;
  charges: CalculatedCharge[];
  totalCharges: string;
  grandTotal: string;
}

/**
 * Calculates pieces conversion, line total, and effective price per base piece for a line item.
 */
export function calculateLineItem(input: LineItemInput): CalculatedLineItem {
  const qtyInt = Math.floor(input.quantity);
  if (qtyInt <= 0) {
    throw new Error('Quantity must be a positive integer');
  }

  const pcsPerStrip = input.unitHierarchy.piecesPerStrip || 1;
  const stripsPerBox = input.unitHierarchy.stripsPerBox || 1;
  const totalPcsPerBox = pcsPerStrip * stripsPerBox;

  let quantityPieces = qtyInt;
  let piecesInThisUnit = 1;

  if (input.unit === 'piece') {
    quantityPieces = qtyInt;
    piecesInThisUnit = 1;
  } else if (input.unit === 'strip') {
    quantityPieces = qtyInt * pcsPerStrip;
    piecesInThisUnit = pcsPerStrip;
  } else if (input.unit === 'box') {
    quantityPieces = qtyInt * totalPcsPerBox;
    piecesInThisUnit = totalPcsPerBox;
  }

  const unitPriceDec = new Decimal(input.unitPrice || 0);
  const lineTotalDec = unitPriceDec.times(qtyInt);
  const unitPricePerPieceDec = unitPriceDec.dividedBy(piecesInThisUnit);

  return {
    quantity: qtyInt,
    quantityPieces,
    unitPrice: unitPriceDec.toFixed(2),
    unitPricePerPiece: unitPricePerPieceDec.toFixed(4),
    lineTotal: lineTotalDec.toFixed(2),
  };
}

/**
 * Computes subtotal, discount, global charges, and 2dp round-half-up grand total.
 */
export function calculateInvoiceTotals(
  lines: Array<{ lineTotal: string | number }>,
  discountPercentInput: string | number = 0,
  chargesInput: ChargeInput[] = []
): CalculatedInvoiceTotals {
  let subtotalDec = new Decimal(0);
  for (const line of lines) {
    subtotalDec = subtotalDec.plus(new Decimal(line.lineTotal || 0));
  }

  const discountPercentDec = new Decimal(discountPercentInput || 0);
  if (discountPercentDec.isNegative() || discountPercentDec.greaterThan(100)) {
    throw new Error('Discount percentage must be between 0 and 100');
  }

  // discountAmount = subtotal * (discountPercent / 100)
  const discountAmountDec = subtotalDec.times(discountPercentDec.dividedBy(100));
  const netAfterDiscountDec = subtotalDec.minus(discountAmountDec);

  const calculatedCharges: CalculatedCharge[] = [];
  let totalChargesDec = new Decimal(0);

  for (const charge of chargesInput) {
    if (charge.isActive === false) continue;

    const rateDec = new Decimal(charge.rate || 0);
    let chargeAmountDec = new Decimal(0);

    if (charge.type === 'percentage') {
      // Applied on net after discount
      chargeAmountDec = netAfterDiscountDec.times(rateDec.dividedBy(100));
    } else {
      // Fixed charge applied once per invoice
      chargeAmountDec = rateDec;
    }

    totalChargesDec = totalChargesDec.plus(chargeAmountDec);
    calculatedCharges.push({
      name: charge.name,
      type: charge.type,
      rate: rateDec.toFixed(2),
      amount: chargeAmountDec.toFixed(2),
    });
  }

  const rawGrandTotalDec = netAfterDiscountDec.plus(totalChargesDec);
  // Round half up to 2 decimal places
  const grandTotalDec = rawGrandTotalDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return {
    subtotal: subtotalDec.toFixed(2),
    discountPercent: discountPercentDec.toFixed(2),
    discountAmount: discountAmountDec.toFixed(2),
    netAfterDiscount: netAfterDiscountDec.toFixed(2),
    charges: calculatedCharges,
    totalCharges: totalChargesDec.toFixed(2),
    grandTotal: grandTotalDec.toFixed(2),
  };
}

/**
 * Calculates change due for cash payments.
 */
export function calculateChangeDue(
  grandTotalInput: string | number,
  tenderedInput: string | number
): { changeDue: string; isSufficient: boolean; balanceRemaining: string } {
  const grandTotalDec = new Decimal(grandTotalInput || 0);
  const tenderedDec = new Decimal(tenderedInput || 0);

  if (tenderedDec.greaterThanOrEqualTo(grandTotalDec)) {
    const changeDec = tenderedDec.minus(grandTotalDec);
    return {
      changeDue: changeDec.toFixed(2),
      isSufficient: true,
      balanceRemaining: '0.00',
    };
  } else {
    const diffDec = grandTotalDec.minus(tenderedDec);
    return {
      changeDue: '0.00',
      isSufficient: false,
      balanceRemaining: diffDec.toFixed(2),
    };
  }
}

export interface RefundLineInput {
  unitPricePerPiece: string | number;
  returnedQuantityPieces: number;
}

export interface CalculatedRefundCharge {
  name: string;
  type: 'percentage' | 'fixed';
  rate: string;
  refundAmount: string;
}

export interface CalculatedRefundTotals {
  subtotalRefund: string;
  discountRefund: string;
  netRefundAfterDiscount: string;
  chargesRefund: CalculatedRefundCharge[];
  totalChargesRefund: string;
  grandTotalRefund: string;
}

/**
 * Computes proportional refund totals for sales returns.
 * - Returned item value = returnedQuantityPieces * unitPricePerPiece
 * - Proportional discount = (subtotalRefund / originalSubtotal) * originalDiscountAmount
 * - Percentage charges refunded proportionally on net refund amount
 * - Fixed charges remain non-refundable (0.00 refund)
 */
export function calculateRefundPricing(
  returnedLines: RefundLineInput[],
  originalSubtotal: string | number,
  originalDiscountAmount: string | number = 0,
  originalCharges: ChargeInput[] = []
): CalculatedRefundTotals {
  let subtotalRefundDec = new Decimal(0);

  for (const line of returnedLines) {
    const qtyPcs = Math.floor(line.returnedQuantityPieces);
    if (qtyPcs <= 0) continue;
    const pricePerPcsDec = new Decimal(line.unitPricePerPiece || 0);
    const lineTotalDec = pricePerPcsDec.times(qtyPcs);
    subtotalRefundDec = subtotalRefundDec.plus(lineTotalDec);
  }

  const origSubtotalDec = new Decimal(originalSubtotal || 0);
  const origDiscountDec = new Decimal(originalDiscountAmount || 0);

  let discountRefundDec = new Decimal(0);
  if (origSubtotalDec.greaterThan(0) && origDiscountDec.greaterThan(0)) {
    // Proportional ratio = subtotalRefund / originalSubtotal
    const ratio = subtotalRefundDec.dividedBy(origSubtotalDec);
    discountRefundDec = origDiscountDec.times(ratio);
  }

  const netRefundDec = subtotalRefundDec.minus(discountRefundDec);

  const chargesRefund: CalculatedRefundCharge[] = [];
  let totalChargesRefundDec = new Decimal(0);

  for (const charge of originalCharges) {
    const rateDec = new Decimal(charge.rate || 0);
    let chargeRefundDec = new Decimal(0);

    if (charge.type === 'percentage') {
      // Percentage tax/charge refund = netRefund * (rate / 100)
      chargeRefundDec = netRefundDec.times(rateDec.dividedBy(100));
    } else {
      // Fixed charge (e.g. platform fee/delivery) is non-refundable
      chargeRefundDec = new Decimal(0);
    }

    totalChargesRefundDec = totalChargesRefundDec.plus(chargeRefundDec);
    chargesRefund.push({
      name: charge.name,
      type: charge.type,
      rate: rateDec.toFixed(2),
      refundAmount: chargeRefundDec.toFixed(2),
    });
  }

  const rawGrandTotalRefundDec = netRefundDec.plus(totalChargesRefundDec);
  const grandTotalRefundDec = rawGrandTotalRefundDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return {
    subtotalRefund: subtotalRefundDec.toFixed(2),
    discountRefund: discountRefundDec.toFixed(2),
    netRefundAfterDiscount: netRefundDec.toFixed(2),
    chargesRefund,
    totalChargesRefund: totalChargesRefundDec.toFixed(2),
    grandTotalRefund: grandTotalRefundDec.toFixed(2),
  };
}
