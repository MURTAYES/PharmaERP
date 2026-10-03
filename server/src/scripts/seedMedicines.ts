import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Decimal from 'decimal.js';
import { Item } from '../models/Item.js';
import { connectDB, disconnectDB } from '../config/db.js';

interface RawMedicine {
  'brand id': number;
  'brand name': string;
  type?: string;
  slug?: string;
  'dosage form'?: string;
  generic?: string;
  strength?: string;
  manufacturer?: string;
  'package container'?: string;
  'Package Size'?: string;
}

export function parseMedicineRecord(item: RawMedicine) {
  const brandName = (item['brand name'] || '').trim();
  const strength = (item['strength'] || '').trim();
  const generic = (item['generic'] || 'Generic Medicine').trim();
  const dosageForm = (item['dosage form'] || item['type'] || 'General').trim();
  const manufacturer = (item['manufacturer'] || 'Unknown Manufacturer').trim();
  const brandId = item['brand id'];

  // Trade name formatting: e.g. "A-Cold 4 mg/5 ml" or "A-Cold"
  let tradeName = brandName;
  if (strength && !brandName.toLowerCase().includes(strength.toLowerCase())) {
    tradeName = `${brandName} ${strength}`.trim();
  }

  // Packaging and Unit Price
  const container = item['package container'] || '';
  const packSize = item['Package Size'] || '';
  const combined = `${container} ${packSize}`;

  let unitPrice: number | null = null;
  let packCount: number | null = null;

  // Check unit price pattern (e.g. Unit Price: ৳ 5.98)
  const unitPriceMatch = combined.match(/Unit Price\s*:\s*৳\s*([\d,.]+)/i);
  if (unitPriceMatch) {
    unitPrice = parseFloat(unitPriceMatch[1].replace(/,/g, ''));
  }

  // Check pack count pattern e.g. (100's pack: ৳ 598.00)
  const packMatch = combined.match(/\((\d+)'s\s*pack\s*:\s*৳\s*([\d,.]+)\)/i);
  if (packMatch) {
    packCount = parseInt(packMatch[1], 10);
    const packPrice = parseFloat(packMatch[2].replace(/,/g, ''));
    if ((!unitPrice || unitPrice <= 0) && packCount > 0 && packPrice > 0) {
      unitPrice = +(packPrice / packCount).toFixed(2);
    }
  }

  // Fallback general price pattern (e.g. 100 ml bottle: ৳ 40.12)
  if (!unitPrice || unitPrice <= 0) {
    const generalPriceMatch = combined.match(/:\s*৳\s*([\d,.]+)/i);
    if (generalPriceMatch) {
      unitPrice = parseFloat(generalPriceMatch[1].replace(/,/g, ''));
    }
  }

  // Default fallback if price was unavailable or zero
  if (!unitPrice || unitPrice <= 0 || isNaN(unitPrice)) {
    unitPrice = 10.0;
  }

  // Unit hierarchy deduction
  const isSolidOral = /tablet|capsule|caplet|pill|pellet/i.test(dosageForm);
  let piecesPerStrip = 1;
  let stripsPerBox = 1;

  if (isSolidOral) {
    if (packCount && packCount > 0) {
      if (packCount % 10 === 0 && packCount >= 10) {
        piecesPerStrip = 10;
        stripsPerBox = Math.floor(packCount / 10);
      } else if (packCount % 7 === 0 && packCount >= 7) {
        piecesPerStrip = 7;
        stripsPerBox = Math.floor(packCount / 7);
      } else if (packCount % 14 === 0 && packCount >= 14) {
        piecesPerStrip = 14;
        stripsPerBox = Math.floor(packCount / 14);
      } else if (packCount % 4 === 0 && packCount >= 4) {
        piecesPerStrip = 4;
        stripsPerBox = Math.floor(packCount / 4);
      } else if (packCount % 6 === 0 && packCount >= 6) {
        piecesPerStrip = 6;
        stripsPerBox = Math.floor(packCount / 6);
      } else {
        piecesPerStrip = packCount;
        stripsPerBox = 1;
      }
    } else {
      piecesPerStrip = 10;
      stripsPerBox = 10;
    }
  } else {
    piecesPerStrip = 1;
    stripsPerBox = 1;
  }

  return {
    tradeName: tradeName || 'Unnamed Medicine',
    genericName: generic,
    itemCode: `MED-${String(brandId).padStart(6, '0')}`,
    category: dosageForm,
    manufacturer: manufacturer,
    shelfLocation: '',
    unitHierarchy: {
      baseUnit: 'piece' as const,
      piecesPerStrip: Math.max(1, piecesPerStrip),
      stripsPerBox: Math.max(1, stripsPerBox),
    },
    mrpPerPiece: mongoose.Types.Decimal128.fromString(new Decimal(unitPrice).toFixed(2)),
    lowStockThresholdPieces: 20,
    isActive: true,
  };
}

export async function seedMedicineDataset(filePath?: string) {
  const jsonPath = filePath || path.resolve(process.cwd(), '..', 'backups', 'medicine.json');
  
  if (!fs.existsSync(jsonPath)) {
    // Try inside server directory fallback
    const altPath = path.resolve(process.cwd(), 'backups', 'medicine.json');
    if (!fs.existsSync(altPath)) {
      throw new Error(`medicine.json dataset not found at ${jsonPath} or ${altPath}`);
    }
  }

  const resolvedPath = fs.existsSync(jsonPath) ? jsonPath : path.resolve(process.cwd(), 'backups', 'medicine.json');
  console.log(`[Seed Dataset] Reading medicines from: ${resolvedPath}`);

  const rawContent = fs.readFileSync(resolvedPath, 'utf8');
  const rawList: RawMedicine[] = JSON.parse(rawContent);

  console.log(`[Seed Dataset] Loaded ${rawList.length} records. Preparing batch operations...`);

  // Batch bulk write using unordered upserts for maximum throughput
  const BATCH_SIZE = 1000;
  let processed = 0;
  let upsertedCount = 0;
  let modifiedCount = 0;

  for (let i = 0; i < rawList.length; i += BATCH_SIZE) {
    const chunk = rawList.slice(i, i + BATCH_SIZE);
    const bulkOps = chunk.map((raw) => {
      const parsed = parseMedicineRecord(raw);
      return {
        updateOne: {
          filter: { itemCode: parsed.itemCode },
          update: {
            $set: {
              tradeName: parsed.tradeName,
              genericName: parsed.genericName,
              category: parsed.category,
              manufacturer: parsed.manufacturer,
              unitHierarchy: parsed.unitHierarchy,
              mrpPerPiece: parsed.mrpPerPiece,
              lowStockThresholdPieces: parsed.lowStockThresholdPieces,
              isActive: parsed.isActive,
            },
            $setOnInsert: {
              shelfLocation: parsed.shelfLocation,
            },
          },
          upsert: true,
        },
      };
    });

    const result = await Item.bulkWrite(bulkOps, { ordered: false });
    upsertedCount += result.upsertedCount || 0;
    modifiedCount += result.modifiedCount || 0;
    processed += chunk.length;

    console.log(
      `[Seed Dataset] Processed ${processed}/${rawList.length} items (${Math.round(
        (processed / rawList.length) * 100
      )}%) - ${upsertedCount} inserted, ${modifiedCount} updated`
    );
  }

  console.log(`[Seed Dataset] Completed! Total: ${rawList.length} items successfully synced to MongoDB.`);
}

// Direct CLI Execution
if (process.argv[1]?.endsWith('seedMedicines.ts') || process.argv[1]?.endsWith('seedMedicines.js')) {
  (async () => {
    try {
      await connectDB();
      await seedMedicineDataset();
      await disconnectDB();
      console.log('✅ Medicine dataset seeding finished.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Failed to seed medicine dataset:', err);
      process.exit(1);
    }
  })();
}
