import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { lookupBarcode } from '../controllers/itemController.js';
import { Item } from '../models/Item.js';
import { Batch } from '../models/Batch.js';

vi.mock('../models/Item.js');
vi.mock('../models/Batch.js');

describe('Barcode & QR Code Lookup Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    mockRes = {
      json: jsonMock,
      status: statusMock,
    };
  });

  it('returns 400 if code parameter is missing', async () => {
    mockReq = { query: {} };
    await lookupBarcode(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Barcode or QR code query parameter is required',
    });
  });

  it('looks up item by barcode array and returns active batches sorted by FEFO', async () => {
    mockReq = { query: { code: '8901234567890' } };

    const mockItem = {
      _id: 'item123',
      tradeName: 'Napa Extra 500mg',
      genericName: 'Paracetamol',
      barcodes: ['8901234567890'],
      isActive: true,
    };

    const mockBatches = [
      {
        _id: 'batch1',
        itemId: 'item123',
        batchNumber: 'B001',
        expiryDate: new Date('2027-01-01'),
        qtySellable: 100,
      },
      {
        _id: 'batch2',
        itemId: 'item123',
        batchNumber: 'B002',
        expiryDate: new Date('2027-06-01'),
        qtySellable: 50,
      },
    ];

    (Item.findOne as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockItem),
    });

    (Batch.findOne as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    (Batch.find as any).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockBatches),
      }),
    });

    await lookupBarcode(mockReq as Request, mockRes as Response);

    expect(Item.findOne).toHaveBeenCalledWith({
      $or: [
        { barcodes: '8901234567890' },
        { qrCode: '8901234567890' },
        { itemCode: '8901234567890' },
      ],
      isActive: true,
    });

    expect(jsonMock).toHaveBeenCalledWith({
      found: true,
      code: '8901234567890',
      item: mockItem,
      activeBatches: mockBatches,
      matchingBatchId: null,
    });
  });

  it('resolves item via batch barcode if not directly on item', async () => {
    mockReq = { query: { code: 'BATCH-BARCODE-99' } };

    const mockBatch = {
      _id: 'batch99',
      itemId: 'item456',
      barcode: 'BATCH-BARCODE-99',
    };

    const mockItem = {
      _id: 'item456',
      tradeName: 'Seclo 20',
      genericName: 'Omeprazole',
      barcodes: [],
      isActive: true,
    };

    // First Item.findOne returns null
    (Item.findOne as any)
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(null),
      })
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(mockItem),
      });

    (Batch.findOne as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockBatch),
    });

    (Batch.find as any).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([mockBatch]),
      }),
    });

    await lookupBarcode(mockReq as Request, mockRes as Response);

    expect(jsonMock).toHaveBeenCalledWith({
      found: true,
      code: 'BATCH-BARCODE-99',
      item: mockItem,
      activeBatches: [mockBatch],
      matchingBatchId: 'batch99',
    });
  });

  it('returns found: false when barcode does not exist in items or batches', async () => {
    mockReq = { query: { code: 'UNKNOWN-9999' } };

    (Item.findOne as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    (Batch.findOne as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    await lookupBarcode(mockReq as Request, mockRes as Response);

    expect(jsonMock).toHaveBeenCalledWith({
      found: false,
      code: 'UNKNOWN-9999',
    });
  });
});
