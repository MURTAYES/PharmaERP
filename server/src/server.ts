import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { responseSerializer } from './middleware/serializer.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';
import { seedInitialData } from './scripts/seed.js';

export const app = express();

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // For easier dev; enable strict in prod
  })
);

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Server-side response serializer to strip sensitive cost/profit fields for Pharmacists
app.use(responseSerializer as any);

// API Routes
app.use('/api', apiRouter);

// Error Handling
app.use(errorHandler);

// Server startup function
export async function startServer() {
  try {
    await connectDB();
    await seedInitialData();

    const server = app.listen(config.port, () => {
      console.log(`[PharmaERP Server] Running on http://localhost:${config.port} (env: ${config.nodeEnv})`);
    });

    return server;
  } catch (error) {
    console.error('[PharmaERP Server] Failed to start server:', error);
    process.exit(1);
  }
}

// Start server when run directly
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  startServer();
}
