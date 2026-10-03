import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB(): Promise<typeof mongoose> {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.name} (${conn.connection.host})`);
    return conn;
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
