import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Settings } from '../models/Settings.js';
import { config } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';

export async function seedInitialData() {
  // 1. Seed Owner User
  const existingOwner = await User.findOne({ role: 'owner' });
  if (!existingOwner) {
    console.log('[Seed] No owner account found. Creating default owner...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(config.defaultOwner.password, salt);

    await User.create({
      username: config.defaultOwner.username.toLowerCase(),
      passwordHash,
      fullName: config.defaultOwner.fullName,
      role: 'owner',
      isActive: true,
    });
    console.log(`[Seed] Default owner created: ${config.defaultOwner.username} / ${config.defaultOwner.password}`);
  } else {
    console.log(`[Seed] Owner account already exists (${existingOwner.username}).`);
  }

  // 2. Seed Default Pharmacist User for immediate testing
  const existingPharmacist = await User.findOne({ role: 'pharmacist' });
  if (!existingPharmacist) {
    console.log('[Seed] Creating demo pharmacist account...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('pharma123', salt);

    await User.create({
      username: 'pharmacist',
      passwordHash,
      fullName: 'Dispensing Pharmacist',
      role: 'pharmacist',
      isActive: true,
    });
    console.log('[Seed] Demo pharmacist created: pharmacist / pharma123');
  }

  // 3. Seed Default Settings
  const existingSettings = await Settings.findOne();
  if (!existingSettings) {
    console.log('[Seed] Initializing default pharmacy settings...');
    await Settings.create({
      pharmacyName: 'PharmERP Clinical Pharmacy',
      address: 'House #12, Road #4, Dhanmondi, Dhaka-1205',
      phone: '+880 1700-000000',
      email: 'dispensary@pharmaerp.local',
      currency: 'BDT',
      currencySymbol: '৳',
      receiptWidth: '80mm',
      charges: [],
      expiryAlertWindows: { greenDays: 90, yellowDays: 60, redDays: 30 },
    });
    console.log('[Seed] Default settings initialized.');
  }
}

// Allow direct script execution
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    try {
      await connectDB();
      await seedInitialData();
      await disconnectDB();
      console.log('[Seed] Database seeding completed successfully.');
      process.exit(0);
    } catch (error) {
      console.error('[Seed] Database seeding failed:', error);
      process.exit(1);
    }
  })();
}
