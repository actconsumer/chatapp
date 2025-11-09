/**
 * Main Express Application Server
 * Production-grade backend for Project Chat
 */

import 'express-async-errors';
import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { cosmosDBClient } from './infrastructure/database/cosmosdb.config';
import { azureBlobStorage } from './infrastructure/storage/blob.config';
import { redisCache } from './infrastructure/cache/redis.config';
import { emailService } from './utils/email';
import { errorHandler, notFoundHandler } from './application/middleware/error.middleware';
import { apiLimiter } from './application/middleware/rateLimit.middleware';

// Import routes
import authRoutes from './application/routes/auth.routes';
import twoFactorAuthRoutes from './application/routes/twoFactorAuth.routes';
import securityRoutes from './application/routes/security.routes';
import chatRoutes from './application/routes/chat.routes';
import messageRoutes from './application/routes/message.routes';
import securityPinRoutes from './application/routes/securityPin.routes';
import storyRoutes from './application/routes/story.routes';
import storageRoutes from './application/routes/storage.routes';
import callRoutes from './application/routes/call.routes';
import realtimeRoutes from './application/routes/realtime.routes';
import { socketServer } from './sockets/socket.server';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// ========== Middleware ==========

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
const corsOptions = {
  origin: (process.env.CORS_ORIGIN || 'http://localhost:19006').split(','),
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  }));
}

// Rate limiting
app.use(`/api/${API_VERSION}`, apiLimiter);

// ========== Routes ==========

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: API_VERSION,
  });
});

// API routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/auth/2fa`, twoFactorAuthRoutes);
app.use(`/api/${API_VERSION}/security`, securityRoutes);
app.use(`/api/${API_VERSION}/chats`, chatRoutes);
app.use(`/api/${API_VERSION}/messages`, messageRoutes);
app.use(`/api/${API_VERSION}/security/pin`, securityPinRoutes);
app.use(`/api/${API_VERSION}/stories`, storyRoutes);
app.use(`/api/${API_VERSION}/storage`, storageRoutes);
app.use(`/api/${API_VERSION}/calls`, callRoutes);
app.use(`/api/${API_VERSION}/realtime`, realtimeRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// ========== Initialize Application ==========

async function initializeApp() {
  try {
    logger.info('🚀 Initializing Project Chat Backend...');

    // Initialize Azure Cosmos DB
    logger.info('📦 Connecting to Azure Cosmos DB...');
    await cosmosDBClient.initialize();

    // Initialize Azure Blob Storage
    logger.info('💾 Connecting to Azure Blob Storage...');
    await azureBlobStorage.initialize();

    // Initialize Redis Cache
    logger.info('🔴 Connecting to Redis Cache...');
    await redisCache.initialize();

    // Initialize Email Service
    logger.info('📧 Initializing Email Service...');
    await emailService.initialize();

    logger.info('✅ All services initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

// ========== Start Server ==========

async function startServer() {
  try {
    await initializeApp();

    const server = http.createServer(app);

    socketServer.initialize(server, corsOptions.origin);

    server.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎯 PROJECT CHAT BACKEND - Production Ready              ║
║                                                            ║
║   📍 Server:        http://localhost:${PORT}                 ║
║   🌐 API Version:   ${API_VERSION}                                ║
║   🔧 Environment:   ${process.env.NODE_ENV || 'development'}        ║
║   📚 API Docs:      http://localhost:${PORT}/api-docs        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// ========== Graceful Shutdown ==========

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received. Closing server gracefully...');
  await cosmosDBClient.close();
  await redisCache.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received. Closing server gracefully...');
  await cosmosDBClient.close();
  await redisCache.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;
