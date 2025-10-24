import dotenv from 'dotenv';
import { createServer, startServer } from './server';
import { createWhatsAppClient, initializeWhatsAppClient } from './bot/whatsapp';
import { handleIncomingMessage } from './bot/messageHandler';
import { setWhatsAppClient } from './payment/webhook';
import { closePool } from './database/connection';
import logger from './utils/logger';
import { setWhatsAppStatus } from './state/whatsappStatus';
import { Client } from 'whatsapp-web.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'OPENAI_API_KEY',
  'WEBHOOK_URL',
];

// Optional but recommended
const optionalEnvVars = ['MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_PUBLIC_KEY'];
const missingOptional = optionalEnvVars.filter((envVar) => !process.env[envVar]);

if (missingOptional.length > 0) {
  logger.warn(
    { missingOptional },
    '⚠️  Optional environment variables missing. Payment features will be disabled.'
  );
}

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error(
    { missingEnvVars },
    'Missing required environment variables. Please check your .env file.'
  );
  process.exit(1);
}

// Retry configuration for WhatsApp initialization
let retryDelayMs = 10000; // Start with 10 seconds
const MAX_RETRY_DELAY_MS = 60000; // Max 60 seconds

function startWhatsAppInitInBackground(client: Client): void {
  setWhatsAppStatus('initializing');
  logger.info('Starting WhatsApp initialization in background...');

  initializeWhatsAppClient(client)
    .then(() => {
      logger.info('✅ WhatsApp client initialized successfully!');
      // Reset retry delay on success
      retryDelayMs = 10000;
    })
    .catch((error) => {
      logger.error({ error }, '❌ WhatsApp initialization failed');
      setWhatsAppStatus('error', error);
      
      // Schedule retry with exponential backoff
      scheduleWhatsAppRetry(client);
    });
}

function scheduleWhatsAppRetry(client: Client): void {
  const delay = Math.min(retryDelayMs, MAX_RETRY_DELAY_MS);
  logger.warn(`⏱️ Retrying WhatsApp initialization in ${delay / 1000}s...`);
  
  setTimeout(() => {
    // Exponential backoff: double the delay for next retry
    retryDelayMs = Math.min(retryDelayMs * 2, MAX_RETRY_DELAY_MS);
    startWhatsAppInitInBackground(client);
  }, delay);
}

async function main() {
  try {
    logger.info('🚀 Starting Helixon WhatsApp Bot...');

    // Create Express server first
    const app = createServer();
    
    // Create WhatsApp client
    const whatsappClient = createWhatsAppClient();

    // Register WhatsApp client with webhook handler
    setWhatsAppClient(whatsappClient);

    // Register message handler
    whatsappClient.on('message', async (msg) => {
      try {
        await handleIncomingMessage(msg);
      } catch (error) {
        logger.error({ error }, 'Error in message handler');
      }
    });

    // Start HTTP server BEFORE WhatsApp initialization
    // This ensures health checks pass immediately
    startServer(app);
    logger.info('✅ HTTP server is ready and accepting health checks');

    // Initialize WhatsApp client in background (non-blocking)
    startWhatsAppInitInBackground(whatsappClient);

    logger.info('📱 Bot startup complete. WhatsApp connecting in background...');
  } catch (error) {
    logger.error({ error }, 'Failed to start application');
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Received shutdown signal');

  try {
    // Close database pool
    await closePool();
    logger.info('Database connections closed');

    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Promise Rejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception');
  process.exit(1);
});

// Start the application
main();
