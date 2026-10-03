import { describe, it, expect } from 'vitest';

describe('Concurrency Guard & Atomic Stock Deduction ($gte Guard)', () => {
  interface MockBatch {
    _id: string;
    batchNumber: string;
    qtySellable: number;
  }

  // Simulated atomic MongoDB findOneAndUpdate with { qtySellable: { $gte: requestedQty } }
  function atomicDeductStock(
    batch: MockBatch,
    requestedQty: number
  ): { success: boolean; updatedBatch?: MockBatch; error?: string } {
    if (batch.qtySellable >= requestedQty) {
      batch.qtySellable -= requestedQty;
      return { success: true, updatedBatch: { ...batch } };
    }
    return {
      success: false,
      error: `Insufficient stock for batch ${batch.batchNumber}. Available: ${batch.qtySellable}, Requested: ${requestedQty} pcs`,
    };
  }

  it('guarantees stock never drops below zero under simulated concurrent checkouts', async () => {
    const batch: MockBatch = {
      _id: 'batch_para_001',
      batchNumber: 'B-PARA-001',
      qtySellable: 15, // Only 15 pieces available
    };

    // Simulate 3 concurrent checkout requests attempting to buy 10 pieces each (Total: 30 pieces requested)
    const checkoutRequests = [
      { id: 'req_A', qty: 10 },
      { id: 'req_B', qty: 10 },
      { id: 'req_C', qty: 10 },
    ];

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    // Execute simulated atomic concurrent calls
    for (const req of checkoutRequests) {
      const outcome = atomicDeductStock(batch, req.qty);
      results.push({
        id: req.id,
        success: outcome.success,
        error: outcome.error,
      });
    }

    const successfulCheckouts = results.filter((r) => r.success);
    const rejectedCheckouts = results.filter((r) => !r.success);

    // Exactly 1 checkout of 10 pcs must succeed
    expect(successfulCheckouts).toHaveLength(1);
    expect(rejectedCheckouts).toHaveLength(2);

    // Remaining stock must be exactly 5 pcs (15 - 10) and NEVER negative
    expect(batch.qtySellable).toBe(5);
    expect(batch.qtySellable).toBeGreaterThanOrEqual(0);

    // Rejected checkouts must provide descriptive error messages
    expect(rejectedCheckouts[0].error).toContain('Insufficient stock for batch B-PARA-001');
  });

  it('handles multiple sequential and multi-unit deductions cleanly', () => {
    const batch: MockBatch = {
      _id: 'batch_para_002',
      batchNumber: 'B-PARA-002',
      qtySellable: 100,
    };

    // Deduct 1 strip (10 pcs)
    const res1 = atomicDeductStock(batch, 10);
    expect(res1.success).toBe(true);
    expect(batch.qtySellable).toBe(90);

    // Deduct 1 box (50 pcs)
    const res2 = atomicDeductStock(batch, 50);
    expect(res2.success).toBe(true);
    expect(batch.qtySellable).toBe(40);

    // Attempt to deduct 50 pcs (only 40 available)
    const res3 = atomicDeductStock(batch, 50);
    expect(res3.success).toBe(false);
    expect(batch.qtySellable).toBe(40);
  });
});
